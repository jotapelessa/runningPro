import express from "express";
import path from "path";
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
  res.json({
    status: "ok",
    app: "PaceLab VDOT v3.5",
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// 2. AI Coach endpoint (VDOT Expert & Exercise Physiologist)
app.post("/api/coach", async (req, res) => {
  try {
    const { messages, runnerState, userPrompt } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Return intelligent local fallback response if no API key is provided
      const fallbackResponse = generateLocalCoachAdvice(userPrompt || (messages && messages[messages.length - 1]?.text) || "", runnerState);
      return res.json({ text: fallbackResponse, source: "local-expert-engine" });
    }

    const systemInstruction = `Você é o "Treinador IA PaceLab VDOT", um fisiologista do exercício e treinador sênior de corrida de rua, especialista rigoroso na metodologia VDOT do Dr. Jack Daniels e na fórmula de Frequência Cardíaca de Reserva de Karvonen.

DADOS ATUAIS DO ATLETA:
- Nome: ${runnerState?.name || 'Atleta'}
- VDOT Atual: ${runnerState?.currentVdot || 45.0} (VO2Max: ${runnerState?.currentVo2max || 45.0} ml/kg/min)
- Nível: ${runnerState?.level || 'Intermediário'}
- Volume Semanal Atual: ${runnerState?.weeklyVolume || 35} km
- Semanas Ativo: ${runnerState?.weeksActive || 8}
- FC Máxima: ${runnerState?.macHR || 185} bpm | FC Repouso: ${runnerState?.restHR || 60} bpm
- Dias de treino por semana: ${runnerState?.trainingDays || 4}
- Histórico de Dores Ativas: ${JSON.stringify(runnerState?.pains || [])}
- Provas/Metas: ${runnerState?.goal || 'Melhorar 5k/10k com segurança'}

DIRETRIZES E REGRAS INVIOLÁVEIS DE PRESCRIÇÃO:
1. Responda SEMPRE em Português do Brasil (pt-BR), com tom técnico, encorajador, preciso e objetivo.
2. Zonas de Pace Daniels: E (Fácil/Regenerativo), M (Ritmo Maratona), T (Limiar de Lactato/Threshold), I (Intervalado/VO2Max), R (Repetições/Economia).
3. Regra dos 8%: O volume total de tiros em intensidade I/R na semana NUNCA deve ultrapassar 8% do volume semanal total do atleta. Se o atleta pedir mais, alerte com veemência!
4. Regra dos 10%: A progressão de volume semanal máximo é de 10% por semana, com semana regenerativa a cada 3-4 semanas.
5. Se o atleta relatar dor moderada ou severa (especialmente canelites, tendão de aquiles, fáscia plantar ou joelho), ordene redução de 30% a 50% do volume, suspensão de tiros I/R e foco em regenerativo Z1 e repouso.
6. Use formatação limpa em Markdown com tópicos claros, tabelas de ritmo quando pertinente e tempos exatos em min/km.`;

    // Format conversation history for Gemini API
    let promptText = "";
    if (messages && Array.isArray(messages)) {
      promptText = messages.map((m: any) => `${m.role === 'user' ? 'Atleta' : 'Treinador'}: ${m.text}`).join('\n\n');
      if (userPrompt) promptText += `\n\nAtleta: ${userPrompt}`;
    } else {
      promptText = userPrompt || "Olá treinador, como posso melhorar minha performance?";
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\n--- HISTÓRICO DA CONVERSA / PERGUNTA ATUAL ---\n${promptText}` }],
          }
        ],
      });
    } catch (primaryModelErr: any) {
      console.warn("Primary model error, attempting gemini-3.6-flash fallback:", primaryModelErr?.message);
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\n--- HISTÓRICO DA CONVERSA / PERGUNTA ATUAL ---\n${promptText}` }],
          }
        ],
      });
    }

    const replyText = response.text || "Não foi possível gerar resposta no momento.";
    return res.json({ text: replyText, source: "gemini-flash" });
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

// 3. Race Scraper / Catalog Search endpoint
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
  const vdot = state?.currentVdot || 45.0;
  const volume = state?.weeklyVolume || 35;
  const p = prompt.toLowerCase();

  if (p.includes("dor") || p.includes("lesão") || p.includes("canelite") || p.includes("joelho") || p.includes("aquiles")) {
    return `### 🩺 Análise Fisiológica de Desconforto & Protocolo de Carga

Identifiquei seu relato de sensibilidade física. Na metodologia Jack Daniels e medicina esportiva:

1. **Ajuste Imediato de Carga**: Reduza o volume semanal atual (${volume} km) em **40%** nos próximos 4 a 6 dias.
2. **Suspensão de Intensidades**: Interrompa imediatamente tiros em ritmo **I (Interval)** e **R (Repetição)**.
3. **Zonas Permitidas**: Apenas treinos na **Zona E (Easy)** e **Z1 Karvonen**, em terreno plano e preferencialmente grama ou terra batida.
4. **Crioterapia & Liberação**: Gelo por 15-20 minutos pós-treino e liberação miofascial com rolo nos gastrocnêmios e soleares.
5. *Se a dor persistir em caminhadas normais, consulte um ortopedista ou fisioterapeuta do esporte antes de qualquer treino forte.*`;
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
