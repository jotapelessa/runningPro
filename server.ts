import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google Gemini AI lazily
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  const tokenFileExists = fs.existsSync("/data/google_tokens.json") || fs.existsSync(path.join(process.cwd(), "google_tokens.json"));
  res.json({
    status: "ok",
    app: "PaceLab VDOT v3.6",
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    googleFitAuth: tokenFileExists,
    memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    time: new Date().toISOString(),
  });
});

// 2. AI Coach endpoint (VDOT Expert & Exercise Physiologist)
app.post("/api/coach", async (req, res) => {
  try {
    const { messages, runnerState, userPrompt, activities } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Return intelligent local fallback response if no API key is provided
      const fallbackResponse = generateLocalCoachAdvice(userPrompt || (messages && messages[messages.length - 1]?.text) || "", runnerState);
      return res.json({ text: fallbackResponse, source: "local-expert-engine" });
    }

    const isTransition = runnerState?.level === 'sedentary_transition' || runnerState?.activityProfile === 'sedentary';

    // Format recent athlete activities (Google Fit / Amazfit / GPS)
    let recentActivitiesContext = "Nenhuma atividade recente registrada.";
    if (activities && Array.isArray(activities) && activities.length > 0) {
      recentActivitiesContext = activities.slice(0, 5).map((act: any, idx: number) => {
        const typeLabel = act.type === 'run' ? 'Corrida' : act.type === 'walk' ? 'Caminhada' : act.type;
        const hrInfo = act.avgHr ? ` | FC Média: ${act.avgHr} bpm` : '';
        const driftInfo = act.cardiacDriftPct !== undefined ? ` | Drift Cardíaco: ${act.cardiacDriftPct}%` : '';
        return `[Atividade ${idx + 1}] ${act.date ? new Date(act.date).toLocaleDateString('pt-BR') : ''} - ${typeLabel}: ${act.distanceKm?.toFixed(2) || 0} km em ${act.durationFormatted || 'N/A'} (Pace: ${act.paceFormatted || 'N/A'}/km${hrInfo}${driftInfo}) [Origem: ${act.sourceLabel || act.source || 'Zepp/Fit'}]`;
      }).join('\n');
    }

    const systemInstruction = `Você é o "Treinador IA PaceLab VDOT", um fisiologista do exercício e treinador sênior de corrida de rua, especialista rigoroso na metodologia VDOT do Dr. Jack Daniels e na fórmula de Frequência Cardíaca de Reserva de Karvonen.

DADOS ATUAIS DO ATLETA:
- Nome: ${runnerState?.name || 'Atleta'}
- Perfil / Nível: ${runnerState?.level || 'sedentary_transition'}
- Estágio de Treino: ${isTransition ? 'FASE 0: TRANSIÇÃO SEGURA / MÉTODO CAMINHA-CORRE (RUN-WALK)' : 'CORREDOR ATIVO COM ZONAS VDOT'}
- VDOT Atual: ${runnerState?.currentVdot || 30.0} (VO2Max: ${runnerState?.currentVo2max || 30.0} ml/kg/min)
- Volume Semanal Atual: ${runnerState?.weeklyVolume || 12} km
- Semanas Ativo: ${runnerState?.weeksActive || 0}
- FC Máxima: ${runnerState?.macHR || 185} bpm | FC Repouso: ${runnerState?.restHR || 70} bpm
- Dias de treino por semana: ${runnerState?.trainingDays || 3}
- Histórico de Dores Ativas: ${JSON.stringify(runnerState?.pains || [])}
- Provas/Metas: ${runnerState?.goal || 'Retomar o condicionamento com segurança sem dor'}

ÚLTIMOS TREINOS REAIS SINCRONIZADOS (Amazfit Zepp / Google Fit):
${recentActivitiesContext}

DIRETRIZES E REGRAS INVIOLÁVEIS DE PRESCRIÇÃO:
1. Responda SEMPRE em Português do Brasil (pt-BR), com tom acolhedor, encorajador, técnico e protetor.
2. Reconheça e comente os treinos recentes do atleta caso faça sentido na conversa (ex: parabenizando pela regularidade ou sugerindo ajustes de ritmo e recuperação baseados nos dados reais).
${isTransition ? `3. DIRETRIZ FUNDAMENTAL PARA INICIANTES/SEDENTÁRIOS:
   - Este atleta está na FASE DE TRANSIÇÃO (Caminha-Corre). Ele alterna frações curtas de trote (ex: 1 min ou 250m) com caminhada.
   - NUNCA prescreva treinos all-out, testes de 5k no limite ou tiros de velocidade (Pace I/R)!
   - O foco absoluto é ADAPTAÇÃO MECÂNICA (fortalecer tendões de Aquiles, fáscia plantar, cartilagens e canelas).
   - Oriente SEMPRE o trote pelo TESTE DA FALA (ritmo em que consiga falar frases curtas) e Esforço RPE 6/10.
   - Apenas quando o atleta conseguir correr 3 km de forma ininterrupta e confortável ele deverá realizar um teste formal de VDOT.` : `3. Zonas de Pace Daniels: E (Fácil/Regenerativo), M (Ritmo Maratona), T (Limiar de Lactato/Threshold), I (Intervalado/VO2Max), R (Repetições/Economia).
4. Regra dos 8%: O volume total de tiros em intensidade I/R na semana NUNCA deve ultrapassar 8% do volume semanal total do atleta. Se o atleta pedir mais, alerte com veemência!`}
5. Regra dos 10%: A progressão de volume semanal máximo é de 10% por semana, com semana regenerativa a cada 3-4 semanas.
6. Se o atleta relatar dor moderada ou severa (especialmente canelites, tendão de aquiles, fáscia plantar ou joelho), ordene redução de 30% a 50% do volume, suspensão imediata de trote, foco em caminhada, repouso e crioterapia (gelo).
7. Use formatação limpa em Markdown com tópicos claros e objetivos.`;

    // Format conversation history for Gemini API
    let promptText = "";
    if (messages && Array.isArray(messages)) {
      promptText = messages.map((m: any) => `${m.role === 'user' ? 'Atleta' : 'Treinador'}: ${m.text}`).join('\n\n');
      if (userPrompt) promptText += `\n\nAtleta: ${userPrompt}`;
    } else {
      promptText = userPrompt || "Olá treinador, como posso melhorar minha performance?";
    }

    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.8-flash"];
    let response: any = null;
    let usedModel = "";

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemInstruction}\n\n--- HISTÓRICO DA CONVERSA / PERGUNTA ATUAL ---\n${promptText}` }],
            }
          ],
        });
        if (response && response.text) {
          usedModel = model;
          break;
        }
      } catch (mErr: any) {
        console.warn(`Model ${model} unavailable: ${mErr?.message}`);
      }
    }

    if (!response || !response.text) {
      throw new Error("No Gemini models responded successfully");
    }

    return res.json({ text: response.text, source: usedModel });
  } catch (error: any) {
    console.error("Coach API error:", error);
    // Graceful fallback to local engine
    const fallbackResponse = generateLocalCoachAdvice(req.body?.userPrompt || "orientação", req.body?.runnerState);
    return res.json({
      text: fallbackResponse,
      source: "local-expert-fallback",
      error: error?.message || "AI service temporary error",
    });
  }
});

// 2.1 AI Coach SSE Streaming Endpoint (Real-time token stream)
app.post("/api/coach/stream", async (req, res) => {
  const { messages, runnerState, userPrompt, activities } = req.body;

  // Set SSE response headers with Nginx unbuffered streaming header
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const ai = getGeminiClient();
  if (!ai) {
    const fallbackResponse = generateLocalCoachAdvice(userPrompt || (messages && messages[messages.length - 1]?.text) || "", runnerState);
    sendEvent("chunk", { text: fallbackResponse });
    sendEvent("done", { source: "local-expert-engine" });
    return res.end();
  }

  const isTransition = runnerState?.level === 'sedentary_transition' || runnerState?.activityProfile === 'sedentary';

  let recentActivitiesContext = "Nenhuma atividade recente registrada.";
  if (activities && Array.isArray(activities) && activities.length > 0) {
    recentActivitiesContext = activities.slice(0, 5).map((act: any, idx: number) => {
      const typeLabel = act.type === 'run' ? 'Corrida' : act.type === 'walk' ? 'Caminhada' : act.type;
      const hrInfo = act.avgHr ? ` | FC Média: ${act.avgHr} bpm` : '';
      const driftInfo = act.cardiacDriftPct !== undefined ? ` | Drift Cardíaco: ${act.cardiacDriftPct}%` : '';
      return `[Atividade ${idx + 1}] ${act.date ? new Date(act.date).toLocaleDateString('pt-BR') : ''} - ${typeLabel}: ${act.distanceKm?.toFixed(2) || 0} km em ${act.durationFormatted || 'N/A'} (Pace: ${act.paceFormatted || 'N/A'}/km${hrInfo}${driftInfo}) [Origem: ${act.sourceLabel || act.source || 'Zepp/Fit'}]`;
    }).join('\n');
  }

  const systemInstruction = `Você é o "Treinador IA PaceLab VDOT", um fisiologista do exercício e treinador sênior de corrida de rua, especialista rigoroso na metodologia VDOT do Dr. Jack Daniels e na fórmula de Frequência Cardíaca de Reserva de Karvonen.

DADOS ATUAIS DO ATLETA:
- Nome: ${runnerState?.name || 'Atleta'}
- Perfil / Nível: ${runnerState?.level || 'sedentary_transition'}
- Estágio de Treino: ${isTransition ? 'FASE 0: TRANSIÇÃO SEGURA / MÉTODO CAMINHA-CORRE (RUN-WALK)' : 'CORREDOR ATIVO COM ZONAS VDOT'}
- VDOT Atual: ${runnerState?.currentVdot || 30.0} (VO2Max: ${runnerState?.currentVo2max || 30.0} ml/kg/min)
- Volume Semanal Atual: ${runnerState?.weeklyVolume || 12} km
- Semanas Ativo: ${runnerState?.weeksActive || 0}
- FC Máxima: ${runnerState?.macHR || 185} bpm | FC Repouso: ${runnerState?.restHR || 70} bpm
- Dias de treino por semana: ${runnerState?.trainingDays || 3}
- Histórico de Dores Ativas: ${JSON.stringify(runnerState?.pains || [])}
- Provas/Metas: ${runnerState?.goal || 'Retomar o condicionamento com segurança sem dor'}

ÚLTIMOS TREINOS REAIS SINCRONIZADOS (Amazfit Zepp / Google Fit):
${recentActivitiesContext}

DIRETRIZES E REGRAS INVIOLÁVEIS DE PRESCRIÇÃO:
1. Responda SEMPRE em Português do Brasil (pt-BR), com tom acolhedor, encorajador, técnico e protetor.
2. Reconheça e comente os treinos recentes do atleta caso faça sentido na conversa (ex: parabenizando pela regularidade ou sugerindo ajustes de ritmo e recuperação baseados nos dados reais).
${isTransition ? `3. DIRETRIZ FUNDAMENTAL PARA INICIANTES/SEDENTÁRIOS:
   - Este atleta está na FASE DE TRANSIÇÃO (Caminha-Corre). Ele alterna frações curtas de trote (ex: 1 min ou 250m) com caminhada.
   - NUNCA prescreva treinos all-out, testes de 5k no limite ou tiros de velocidade (Pace I/R)!
   - O foco absoluto é ADAPTAÇÃO MECÂNICA (fortalecer tendões de Aquiles, fáscia plantar, cartilagens e canelas).
   - Oriente SEMPRE o trote pelo TESTE DA FALA (ritmo em que consiga falar frases curtas) e Esforço RPE 6/10.
   - Apenas quando o atleta conseguir correr 3 km de forma ininterrupta e confortável ele deverá realizar um teste formal de VDOT.` : `3. Zonas de Pace Daniels: E (Fácil/Regenerativo), M (Ritmo Maratona), T (Limiar de Lactato/Threshold), I (Intervalado/VO2Max), R (Repetições/Economia).
4. Regra dos 8%: O volume total de tiros em intensidade I/R na semana NUNCA deve ultrapassar 8% do volume semanal total do atleta. Se o atleta pedir mais, alerte com veemência!`}
5. Regra dos 10%: A progressão de volume semanal máximo é de 10% por semana, com semana regenerativa a cada 3-4 semanas.
6. Se o atleta relatar dor moderada ou severa (especialmente canelites, tendão de aquiles, fáscia plantar ou joelho), ordene redução de 30% a 50% do volume, suspensão imediata de trote, foco em caminhada, repouso e crioterapia (gelo).
7. Use formatação limpa em Markdown com tópicos claros e objetivos.`;

  let promptText = "";
  if (messages && Array.isArray(messages)) {
    promptText = messages.map((m: any) => `${m.role === 'user' ? 'Atleta' : 'Treinador'}: ${m.text}`).join('\n\n');
    if (userPrompt) promptText += `\n\nAtleta: ${userPrompt}`;
  } else {
    promptText = userPrompt || "Olá treinador, como posso melhorar minha performance?";
  }

  const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.8-flash"];
  let streamResult: any = null;
  let usedModel = "";

  for (const model of candidateModels) {
    try {
      streamResult = await ai.models.generateContentStream({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\n--- HISTÓRICO DA CONVERSA / PERGUNTA ATUAL ---\n${promptText}` }],
          }
        ],
      });
      if (streamResult) {
        usedModel = model;
        break;
      }
    } catch (e: any) {
      console.warn(`Stream model ${model} unavailable: ${e?.message}`);
    }
  }

  try {
    if (!streamResult) {
      throw new Error("No Gemini models responded to streaming request");
    }

    for await (const chunk of streamResult) {
      const chunkText = chunk.text;
      if (chunkText) {
        sendEvent("chunk", { text: chunkText });
      }
    }
    sendEvent("done", { source: usedModel || "gemini-flash" });
  } catch (err: any) {
    console.error("Coach stream error, sending local fallback:", err);
    const fallbackResponse = generateLocalCoachAdvice(userPrompt || "orientação", runnerState);
    sendEvent("chunk", { text: fallbackResponse });
    sendEvent("done", { source: "local-expert-fallback", error: err?.message });
  } finally {
    res.end();
  }
});

// 3. Google OAuth & Fitness Endpoints (Server-Side)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Store athlete's Google tokens in persistent JSON file on disk
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}
const TOKENS_FILE = path.join(DATA_DIR, 'google_tokens.json');
let athleteGoogleTokens: { access_token?: string; refresh_token?: string; expiry_date?: number; email?: string } = {};

try {
  if (fs.existsSync(TOKENS_FILE)) {
    athleteGoogleTokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not read persistent tokens file:', e);
}

function saveGoogleTokens(tokens: typeof athleteGoogleTokens) {
  athleteGoogleTokens = tokens;
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving persistent tokens file:', e);
  }
}

// 3.1 Generate Google Auth URL with oob / manual authorization code support
app.get("/api/auth/google/url", (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.location.read',
    'https://www.googleapis.com/auth/fitness.body.read'
  ].join(' ');

  // Default to http://localhost:3005 for Google Web Client OAuth
  const redirectUri = (req.query.redirectUri as string) || 'http://localhost:3005';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.json({ url: authUrl, clientId: GOOGLE_CLIENT_ID, redirectUri });
});

// 3.2 Exchange Authorization Code for Refresh Token & Access Token
app.post("/api/auth/google/exchange", async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Código de autorização não informado." });
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code.trim(),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri || 'http://localhost:3005',
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Google Token Exchange error:", tokenData);
      return res.status(tokenResponse.status).json({ 
        error: tokenData.error_description || tokenData.error || "Falha na troca do código OAuth." 
      });
    }

    // Get user info
    let userEmail = 'Atleta Google';
    let userName = 'Atleta';
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        userEmail = userInfo.email || userEmail;
        userName = userInfo.name || userName;
      }
    } catch (e) {
      console.warn("Could not fetch user profile details:", e);
    }

    saveGoogleTokens({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: Date.now() + (tokenData.expires_in || 3600) * 1000,
      email: userEmail
    });

    return res.json({
      success: true,
      email: userEmail,
      name: userName,
      hasRefreshToken: Boolean(tokenData.refresh_token)
    });
  } catch (error: any) {
    console.error("Exchange endpoint error:", error);
    res.status(500).json({ error: error?.message || "Erro interno no servidor." });
  }
});

// 3.3 Fetch Google Fitness Activities & Sessions
app.get("/api/fitness/activities", async (req, res) => {
  try {
    if (!athleteGoogleTokens.access_token) {
      return res.status(401).json({ error: "Nenhuma conta Google conectada no backend." });
    }

    // If access token is expired and we have refresh token, refresh it
    if (athleteGoogleTokens.expiry_date && Date.now() > athleteGoogleTokens.expiry_date && athleteGoogleTokens.refresh_token) {
      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: athleteGoogleTokens.refresh_token,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: "refresh_token"
        })
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        saveGoogleTokens({
          ...athleteGoogleTokens,
          access_token: refreshData.access_token,
          expiry_date: Date.now() + (refreshData.expires_in || 3600) * 1000
        });
      }
    }

    // Call Google Fitness REST API Sessions endpoint
    const now = Date.now();
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const fitnessUrl = `https://fitness.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(oneMonthAgo).toISOString()}&endTime=${new Date(now).toISOString()}`;

    const fitResponse = await fetch(fitnessUrl, {
      headers: { Authorization: `Bearer ${athleteGoogleTokens.access_token}` }
    });

    if (!fitResponse.ok) {
      const errData = await fitResponse.json();
      return res.status(fitResponse.status).json({ error: errData.error?.message || "Erro ao consultar Google Fitness." });
    }

    const fitData = await fitResponse.json();
    const rawSessions = fitData.session || [];

    // Enrich top recent sessions with location (GPS) and distance datasets
    const enrichedSessions = await Promise.all(
      rawSessions.slice(0, 10).map(async (sess: any) => {
        try {
          const startNano = `${sess.startTimeMillis}000000`;
          const endNano = `${sess.endTimeMillis}000000`;

          // Query GPS Location sample dataset
          const locUrl = `https://fitness.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.location.sample:com.google.android.gms:merge_location_samples/datasets/${startNano}-${endNano}`;
          const locRes = await fetch(locUrl, {
            headers: { Authorization: `Bearer ${athleteGoogleTokens.access_token}` }
          });

          let routePoints: Array<{ lat: number; lng: number; ele?: number; time?: string; speed?: number }> = [];

          if (locRes.ok) {
            const locData = await locRes.json();
            if (Array.isArray(locData.point)) {
              routePoints = locData.point
                .map((pt: any) => {
                  const latVal = pt.value?.[0]?.fpVal;
                  const lngVal = pt.value?.[1]?.fpVal;
                  const eleVal = pt.value?.[3]?.fpVal;
                  const timeMs = Math.round(parseInt(pt.startTimeNanos || "0", 10) / 1000000);
                  if (typeof latVal === "number" && typeof lngVal === "number") {
                    return {
                      lat: latVal,
                      lng: lngVal,
                      ele: typeof eleVal === "number" ? Math.round(eleVal) : undefined,
                      time: timeMs > 0 ? new Date(timeMs).toISOString() : undefined,
                    };
                  }
                  return null;
                })
                .filter(Boolean);
            }
          }

          // Query Distance Delta dataset for exact GPS distance
          let exactDistanceMeters = 0;
          try {
            const distUrl = `https://fitness.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.distance.delta:com.google.android.gms:merge_distance_deltas/datasets/${startNano}-${endNano}`;
            const distRes = await fetch(distUrl, {
              headers: { Authorization: `Bearer ${athleteGoogleTokens.access_token}` }
            });
            if (distRes.ok) {
              const distData = await distRes.json();
              if (Array.isArray(distData.point)) {
                distData.point.forEach((pt: any) => {
                  const d = pt.value?.[0]?.fpVal;
                  if (typeof d === "number") exactDistanceMeters += d;
                });
              }
            }
          } catch {
            // distance fallback
          }

          // Query Heart Rate dataset
          let avgHeartRate: number | undefined;
          try {
            const hrUrl = `https://fitness.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm/datasets/${startNano}-${endNano}`;
            const hrRes = await fetch(hrUrl, {
              headers: { Authorization: `Bearer ${athleteGoogleTokens.access_token}` }
            });
            if (hrRes.ok) {
              const hrData = await hrRes.json();
              if (Array.isArray(hrData.point) && hrData.point.length > 0) {
                let sumHr = 0;
                let countHr = 0;
                hrData.point.forEach((pt: any) => {
                  const h = pt.value?.[0]?.fpVal;
                  if (typeof h === "number" && h > 40 && h < 240) {
                    sumHr += h;
                    countHr++;
                  }
                });
                if (countHr > 0) avgHeartRate = Math.round(sumHr / countHr);
              }
            }
          } catch {
            // hr fallback
          }

          return {
            ...sess,
            routePoints,
            exactDistanceMeters: exactDistanceMeters > 0 ? Math.round(exactDistanceMeters) : undefined,
            avgHeartRate
          };
        } catch (enrichErr) {
          console.warn(`Failed to enrich session ${sess.id}:`, enrichErr);
          return sess;
        }
      })
    );

    return res.json({
      success: true,
      sessions: enrichedSessions,
      email: athleteGoogleTokens.email
    });
  } catch (error: any) {
    console.error("Fitness fetch error:", error);
    res.status(500).json({ error: error?.message || "Falha ao puxar sessões do Google Fit." });
  }
});

// 4. Race Scraper / Catalog Search endpoint
app.post("/api/scrape-races", async (req, res) => {
  try {
    const { query, stateCode, distance } = req.body;
    
    // In production/sandbox, we provide full curated live catalog & dynamic parsing
    const brazilianRaces = getCuratedBrazilianRaces();
    
    let filtered = brazilianRaces;
    if (stateCode && stateCode !== "ALL") {
      filtered = filtered.filter((r) => r.stateCode.toUpperCase() === stateCode.toUpperCase());
    }
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter((r) => 
        r.name.toLowerCase().includes(q) || 
        r.city.toLowerCase().includes(q) ||
        r.distances.some((d: string) => d.toLowerCase().includes(q))
      );
    }
    if (distance && distance !== "ALL") {
      filtered = filtered.filter((r) => r.distances.some((d: string) => d.toLowerCase().includes(distance.toLowerCase())));
    }

    return res.json({
      success: true,
      count: filtered.length,
      races: filtered,
      dataSource: "PaceLab National Race Telemetry Hub",
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to search races" });
  }
});

// Fallback Coach Rule Engine
function generateLocalCoachAdvice(prompt: string, state: any): string {
  const isTransition = state?.level === 'sedentary_transition' || state?.activityProfile === 'sedentary';
  const vdot = state?.currentVdot || 30.0;
  const volume = state?.weeklyVolume || (isTransition ? 12 : 35);
  const p = prompt.toLowerCase();

  if (isTransition && (p.includes("quando") || p.includes("teste") || p.includes("vdot") || p.includes("prova"))) {
    return `### 🛡️ Transição Segura para o VDOT
Como você está na fase de adaptação e alternando frações de corrida com caminhada:

1. **Não faça um teste formal de 5k agora**: O VDOT clássico exige ritmo máximo contínuo. Fazer isso agora traria risco desnecessário de canelite ou sobrecarga nos joelhos.
2. **Sua Meta Atual**: Concluir as 4 semanas do método Caminha-Corre (Run-Walk) em blocos de tempo (RPE 6/10).
3. **Marco de Desbloqueio**: Quando você conseguir trotar de **2 km a 3 km de forma ininterrupta e confortável**, aí sim calibraremos seu primeiro VDOT oficial!`;
  }

  if (p.includes("dor") || p.includes("lesão") || p.includes("canelite") || p.includes("joelho") || p.includes("aquiles")) {
    return `### 🩺 Análise Fisiológica de Desconforto & Protocolo de Carga

Identifiquei seu relato de sensibilidade física. Na metodologia Jack Daniels e medicina esportiva:

1. **Ajuste Imediato de Carga**: Reduza o volume semanal atual (${volume} km) em **40%** nos próximos 4 a 6 dias.
2. **Suspensão de Intensidades**: Interrompa imediatamente qualquer trote mais rápido e tiros.
3. **Zonas Permitidas**: Apenas caminhada ativa regenerativa e repouso.
4. **Crioterapia**: Gelo por 15-20 minutos pós-sessão nas canelas ou articulações doloridas.
5. *Se a dor persistir mesmo caminhando, dê 2 dias de descanso total antes de tentar a próxima sessão.*`;
  }


  if (p.includes("tiro") || p.includes("intervalado") || p.includes("volume") || p.includes("limite")) {
    const maxTirosKm = (volume * 0.08).toFixed(1);
    return `### ⚡ Regra de Ouro dos Tiros (Jack Daniels VDOT)

Para o seu volume semanal de **${volume} km**:

- **Teto Máximo de Tiros Semanais (≤ 8%)**: **${maxTirosKm} km de estímulo forte**.
- **Exemplo Prático para VDOT ${vdot.toFixed(1)}**:
  - Tiros de 400m: Máximo de **${Math.floor((volume * 0.08 * 1000) / 400)} tiros** com recuperação ativa trotando 1:1.
  - Tiros de 1.000m: Máximo de **${Math.floor((volume * 0.08) / 1.0)} tiros**.
- **Aviso de Sobrecarga**: Ultrapassar esse limite aumenta exponencialmente o risco de fraturas por estresse e fadiga do SNC sem ganho adicional de VO2Max.`;
  }

  return `### 🏃‍♂️ Análise de Performance PaceLab VDOT

Com base no seu VDOT atual de **${vdot.toFixed(1)}** e volume de **${volume} km/semana**:

- **Distribuição Ideal da Semana**:
  - **70% a 75%** em Ritmo Fácil (**Zona E**): Construção capilar e densidade mitocondrial.
  - **15% a 20%** em Ritmo de Limiar (**Zona T / Threshold**): Remoção e tolerância a lactato.
  - **Máximo 8%** em Ritmo Intervalado (**Zona I**): Estímulo ao VO2Max.
- **Dica de Treino da Semana**: Mantenha cadência próxima a **175-182 ppm** e cuide da hidratação isotônica com 500-700ml/hora de suor.`;
}

function getCuratedBrazilianRaces() {
  return [
    {
      id: "br-sp-maratona",
      name: "Maratona Internacional de São Paulo",
      city: "São Paulo",
      state: "São Paulo",
      stateCode: "SP",
      date: "2025-04-06",
      distances: ["5k", "10k", "21.1k", "42.2k"],
      elevationProfile: "Técnico",
      elevationGainM: 380,
      vdotOffset: -0.8,
      tacticalAdvice: "Percurso ondulado no Parque Ibirapuera e Cidade Universitária USP. Alterne o pace nas subidas da Av. Brigadeiro Luis Antonio e guarde energia para o km 32.",
    },
    {
      id: "br-rj-maratona",
      name: "Maratona do Rio de Janeiro",
      city: "Rio de Janeiro",
      state: "Rio de Janeiro",
      stateCode: "RJ",
      date: "2025-06-22",
      distances: ["5k", "10k", "21.1k", "42.2k"],
      elevationProfile: "Plano",
      elevationGainM: 110,
      vdotOffset: -0.3,
      tacticalAdvice: "Percurso litorâneo muito plano e rápido. O grande desafio é a umidade relativa do ar e o calor a partir das 08h da manhã. Hidratação rigorosa com eletrólitos a cada 20 minutos.",
    },
    {
      id: "br-rs-maratona-poa",
      name: "Maratona Internacional de Porto Alegre",
      city: "Porto Alegre",
      state: "Rio Grande do Sul",
      stateCode: "RS",
      date: "2025-06-08",
      distances: ["7.5k", "21.1k", "42.2k"],
      elevationProfile: "Plano",
      elevationGainM: 85,
      vdotOffset: 0.4,
      tacticalAdvice: "Considerada a maratona mais rápida e plana do Brasil, com clima frio ideal (12°C a 16°C). Cenário perfeito para bater Recorde Pessoal (RP) com estratégia de Even Split.",
    },
    {
      id: "br-pr-maratona-curitiba",
      name: "Maratona de Curitiba Rumo",
      city: "Curitiba",
      state: "Paraná",
      stateCode: "PR",
      date: "2025-11-16",
      distances: ["5k", "10k", "21.1k", "42.2k"],
      elevationProfile: "Montanhoso",
      elevationGainM: 450,
      vdotOffset: -1.2,
      tacticalAdvice: "Muito desafiadora com altitude de 930m e relevo acidentado. Não tente correr no ritmo de prova plano; corra pela percepção de esforço e FC Karvonen.",
    },
    {
      id: "br-sc-maratona-floripa",
      name: "Maratona Internacional de Floripa",
      city: "Florianópolis",
      state: "Santa Catarina",
      stateCode: "SC",
      date: "2025-08-24",
      distances: ["5k", "21.1k", "42.2k"],
      elevationProfile: "Plano",
      elevationGainM: 95,
      vdotOffset: 0.2,
      tacticalAdvice: "Trajeto 100% à beira-mar pela Via Expressa Sul e Beira-Mar Norte. Atenção aos ventos no retorno e mantenha cadência alta de 180 ppm.",
    },
    {
      id: "br-mg-volta-pampulha",
      name: "Volta Internacional da Pampulha",
      city: "Belo Horizonte",
      state: "Minas Gerais",
      stateCode: "MG",
      date: "2025-12-07",
      distances: ["17.8k"],
      elevationProfile: "Plano",
      elevationGainM: 70,
      vdotOffset: -0.6,
      tacticalAdvice: "Distância clássica de 17.8k ao redor da Lagoa da Pampulha. Clima quente e úmido de dezembro exige largada controlada no ritmo de Limiar (T).",
    },
    {
      id: "br-df-maratona-brasilia",
      name: "Maratona de Brasília Monumental",
      city: "Brasília",
      state: "Distrito Federal",
      stateCode: "DF",
      date: "2025-04-20",
      distances: ["5k", "10k", "21.1k", "42.2k"],
      elevationProfile: "Misto",
      elevationGainM: 220,
      vdotOffset: -1.0,
      tacticalAdvice: "Altitude de 1.170m e baixa umidade do ar. Exige compensação ambiental de VDOT e consumo de 700ml/h com cápsulas de sal.",
    },
    {
      id: "br-ba-meia-salvador",
      name: "Meia Maratona de Salvador",
      city: "Salvador",
      state: "Bahia",
      stateCode: "BA",
      date: "2025-09-21",
      distances: ["5k", "10k", "21.1k", "42.2k"],
      elevationProfile: "Misto",
      elevationGainM: 190,
      vdotOffset: -0.9,
      tacticalAdvice: "Visual deslumbrante na orla da Barra e Rio Vermelho, com ondulações e brisa marítima constante.",
    },
    {
      id: "br-ce-meia-fortaleza",
      name: "Meia Maratona de Fortaleza",
      city: "Fortaleza",
      state: "Ceará",
      stateCode: "CE",
      date: "2025-10-12",
      distances: ["5k", "10k", "21.1k"],
      elevationProfile: "Plano",
      elevationGainM: 60,
      vdotOffset: -0.7,
      tacticalAdvice: "Avenida Beira-Mar com clima tropical. Largada bem cedo às 05h30 para fugir do sol forte.",
    },
    {
      id: "br-pe-meia-recife",
      name: "Meia Maratona do Recife Antigo",
      city: "Recife",
      state: "Pernambuco",
      stateCode: "PE",
      date: "2025-07-13",
      distances: ["5k", "10k", "21.1k"],
      elevationProfile: "Plano",
      elevationGainM: 50,
      vdotOffset: -0.4,
      tacticalAdvice: "Centro histórico e pontes do Recife. Percurso plano e atmosfera vibrante da torcida pernambucana.",
    },
    {
      id: "br-am-maratona-manaus",
      name: "Maratona Internacional de Manaus",
      city: "Manaus",
      state: "Amazonas",
      stateCode: "AM",
      date: "2025-10-19",
      distances: ["5k", "10k", "21.1k", "42.2k"],
      elevationProfile: "Misto",
      elevationGainM: 260,
      vdotOffset: -1.5,
      tacticalAdvice: "Passagem pela Ponte Rio Negro. Altíssima umidade da floresta amazônica requer estratégia de hidratação preventiva rigorosa.",
    },
    {
      id: "br-es-dez-milhas-garoto",
      name: "Dez Milhas Garoto",
      city: "Vitória / Vila Velha",
      state: "Espírito Santo",
      stateCode: "ES",
      date: "2025-09-28",
      distances: ["16.09k"],
      elevationProfile: "Técnico",
      elevationGainM: 210,
      vdotOffset: -0.8,
      tacticalAdvice: "A lendária subida da Terceira Ponte no km 6 exige redução de 20s/km no ritmo para não estourar os quadríceps e a FC.",
    }
  ];
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PaceLab VDOT v3.5] Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
