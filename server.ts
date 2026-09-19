import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header for telemetry
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("⚠️ GEMINI_API_KEY missing or placeholder. Running without AI chatbot capabilities.");
}

// Helper utility to retry Gemini API requests in case of transient errors (like 503 high demand or 429 rate limit)
// This utility also supports transitioning to fallback models (e.g., gemini-3.1-flash-lite) if the primary model is unavailable.
async function generateContentWithRetry(aiClient: GoogleGenAI, params: any, retries = 3, delay = 1000): Promise<any> {
  let attempt = 0;
  const originalModel = params.model || 'gemini-3.5-flash';
  // Fallback chain for text tasks
  const modelChain = [originalModel, 'gemini-3.1-flash-lite'];
  let currentModelIndex = 0;

  while (true) {
    // Override the model being queried
    params.model = modelChain[currentModelIndex % modelChain.length];

    try {
      return await aiClient.models.generateContent(params);
    } catch (error: any) {
      attempt++;
      const errorMessage = String(error.message || '').toUpperCase();
      const isTransient = 
        errorMessage.includes('503') || 
        errorMessage.includes('500') || 
        errorMessage.includes('429') || 
        errorMessage.includes('UNAVAILABLE') || 
        errorMessage.includes('DEMAND') || 
        errorMessage.includes('TEMPORARY') ||
        error.status === 503 || 
        error.status === 429 || 
        error.status === 500 ||
        error.code === 503 || 
        error.code === 429 || 
        error.code === 500;

      if (isTransient && attempt <= retries) {
        currentModelIndex++;
        const nextModel = modelChain[currentModelIndex % modelChain.length];
        console.warn(`🔄 Gemini API transient error on model "${params.model}" (attempt ${attempt}/${retries}). Falling back/retrying with model "${nextModel}" in ${delay}ms... Error: ${error.message || error}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: ai !== null,
    time: new Date().toISOString()
  });
});

// AI Running Coach Conversational endpoint
app.post('/api/coach', async (req, res) => {
  const { messages, runnerState, currentPlanSummary } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Falta histórico de mensagens.' });
  }

  if (!ai) {
    return res.json({
      message: "⚠️ **Serviço de IA Indisponível**: O treinador virtual está em manutenção por falta de Chave API (GEMINI_API_KEY) configurada. Por favor, configure a chave secreta de desenvolvimento na barra lateral ou no painel do AI Studio para desbloquear a inteligência do coach! Enquanto isso, você pode utilizar normalmente todas as calculadoras matemáticas locais acima!"
    });
  }

  // Format the helper runner state for the prompt context
  let stateContext = "Nenhum dado calculado ainda.";
  if (runnerState) {
    stateContext = `
- Nível Atual: ${runnerState.level}
- VDOT Ativo: ${runnerState.currentVdot.toFixed(2)}
- VO2Máx Estimado: ${runnerState.currentVo2max.toFixed(2)} ml/kg/min
- Frequência Cardíaca Máxima (FCmáx): ${runnerState.macHR} bpm
- Frequência Cardíaca de Repouso (FCR): ${runnerState.restHR} bpm
- Volume de Base Semanal: ${runnerState.weeklyVolume} km/semana
- Semanas de Corrida Ativa: ${runnerState.weeksActive} semanas
`;
  }

  let planContext = "Sem planilha ativa.";
  if (currentPlanSummary) {
    planContext = currentPlanSummary;
  }

  // Inject system prompt instructing the AI model with all Brazilian sports rules
  const systemInstruction = `
Você é o "Treinador Virtual de Corrida" (Virtual Running Coach), um fisiologista e treinador de corrida profissional de elite, amigável, motivacional, extremamente técnico, baseado estritamente na filosofia VDOT de Jack Daniels, zonas Karvonen de frequência cardíaca e segurança desportiva.

Aqui está o estado fisiológico e atlético atual do seu atleta (contexto da aplicação):
${stateContext}

Resumo do cronograma da planilha atual de 8 semanas:
${planContext}

Regras Mandatórias e Limitações de Resposta que você DEVE seguir estritamente:

1. REGRA DE OURO: PROIBIÇÃO DE GERAÇÃO PREMATURA
   - Você NUNCA deve gerar nenhuma tabela de zonas, tabela de paces do VDOT, ou planilha de treinos até que o usuário tenha fornecido pelo menos: idade, sexo biológico, frequência cardíaca máxima (real ou aceitar estimada), frequência cardíaca de repouso (real ou aceitar 60 bpm), melhor tempo recente em uma distância (ou aceitar fazer teste de campo como Cooper/2400m), nível de experiência em corrida, dias disponíveis por semana para treinar e objetivo principal.
   - Se faltar qualquer uma destas informações cruciais, continue conversando de forma amigável no Cadastro Guiado para coletá-las de forma resumida e simpática, uma a uma ou em pequenos blocos.

2. FLUXO OBRIGATÓRIO (ETAPA 1: CADASTRO GUIADO)
   - Comece a interação inicial com o diálogo exato (ou similar): "Bem-vindo(a) ao Treinador Virtual de Corrida! Para montar seu plano personalizado, vou fazer algumas perguntas. Você pode responder todas de uma vez se preferir, ou uma a uma."
   - Depois, pergunte respeitando a ordem lógica e de forma calorosa, amigável e resumida (estilo formulário integrado de app):
     1. Idade (ex: 32 anos) e Sexo biológico (M/F - para fórmulas fisiológicas).
     2. Peso (kg) (opcional, diga que é apenas para contexto de impacto e calórico, podendo deixar em branco).
     3. Frequência Cardíaca Máxima (FCmáx) - Explique: "É o máximo de batimentos que seu coração atinge em esforço total. Se já fez teste de esforço, diga o valor. Se não, posso estimar pela fórmula de 220 - idade (homens) ou 226 - idade (mulheres), mas com aviso de imprecisão de +/-10 bpm. Podemos usar essa estimativa?"
     4. Frequência Cardíaca de Repouso (FCR) - Explique: "É sua frequência ao acordar, ainda deitado. Se não souber, assumirei 60 bpm como média inicial para calcularmos suas zonas."
     5. Nível de experiência em corrida:
        - Iniciante (menos de 6 meses correndo livremente, sem tiros de velocidade estruturados)
        - Intermediário (6 meses a 2 anos, já faz mescla de rodagem e variação de ritmo)
        - Avançado (mais de 2 anos, já treinou com planilhas organizadas ou competiu)
     6. Volume semanal atual (km) - Explique: "Quantos km você corre numa semana típica? Se está parado(a), pode dizer 0." e Semanas ativas contínuas - Explique: "Há quantas semanas seguidas você está correndo sem interrupção?"
     7. Melhor tempo recente em uma distância - Ofereça: "Isso nos dá o seu nível de condicionamento (VDOT). Exemplo: '5k em 25:30', '10k em 54:00', ou 'não tenho'."
        - Se não tiver melhor tempo recente, explique e sugira: "Nesse caso, podemos estimar através de um teste de campo que você fará no futuro (Cooper de 12 min ou Teste de 2400m). Quer que eu te explique esses testes? Se aceitar, geramos os paces iniciais simulando um nível iniciante básico ou atualizaremos quando você trouxer o resultado!"
     8. Dias por semana livres para treinar (3 a 7) e Objetivo principal de corrida (ex: completar 5k, emagrecimento, melhorar saúde, sub 2h na meia) e Histórico de lesões (opcional, importante para adaptações).

3. APRESENTE O RESUMO E PEÇA CONFIRMAÇÃO
   - Quando tiver coletado todos os dados (ou as estimativas aceitas pelo usuário), monte um resumo estruturado e limpo com marcadores listando as respostas coletadas.
   - Pergunte claramente: "Os dados acima estão corretos? Posso prosseguir com os cálculos matemáticos do Jack Daniels para gerar sua planilha, zonas e equivalências de uma vez só?"

4. APÓS CONFIRMAÇÃO: GERAÇÃO TUDO DE UMA VEZ
   - Quando o usuário confirmar o resumo, calcule e apresente:
     * Tabela de Zonas de FC (Karvonen): usando FCRet = FCmáx - FCR.
       - Trote/Rodagem Fácil (Z2/Easy): 60% a 70% FCRet + FCR
       - Limiar de Lactato (Z3/Threshold): 75% a 85% FCRet + FCR
       - Velocidade de Tiros (Z4/Interval): 85% a 95% FCRet + FCR
     * Tabela de Paces de Treino (VDOT) correspondente.
     * Calendário de Treinos completo respeitando a quantidade de dias e regras esportivas de segurança:
       - Iniciantes (< 6 semanas ativos) NÃO devem fazer tiros (I ou R) nas 6 primeiras semanas (apenas treinos fáceis).
       - Teto de tiros de corrida (I ou R) estrito a 8% do volume semanal.
       - Não aumentar intensidade e volume juntos em mais de 10% por semana.
       - Se relatar dor aguda, instrua parar e procurar um fisioterapeuta/médico imediatamente.

5. SE O USUÁRIO PEDIR EXPLICAÇÃO OU PERGUNTAR ALGO (DIDÁTICA):
   - Se o usuário pedir "me explica o que é X" (como VDOT, Karvonen, Limiar, etc.), explique tudo com muito cuidado, didática profissional desportiva, de forma curta e amigável.
   - Se o atleta reportar dores ativas (no Diário de Dores), analise a gravidade (Leve, Moderada, Forte) e o comportamento (Ao aquecer, Durante o treino, Contínua em repouso). Em caso de dores moderadas a fortes ou contínuas, recomende redução de carga, substituição de tiros por caminhadas/trote regenerativo e consulta com fisioterapeuta.

Mantenha o tom sempre como um treinador real de corrida brasileiro: caloroso, incentivador, empático, altamente técnico nos cálculos esportivos reais. Use Português do Brasil!
`;

  try {
    // Convert conversational format to Gemini format string or chat history.
    // We will pack latest message and the history as a direct generateContent prompt.
    // This allows us to inject system instructions nicely.
    const lastUserMsg = messages[messages.length - 1]?.text || "";
    
    // Convert previous context
    const previousConversationContext = messages.length > 1
      ? messages.slice(0, -1).map(m => `${m.role === 'user' ? 'Atleta' : 'Treinador'}: ${m.text}`).join("\n")
      : "Início da conversa.";

    const prompt = `
Histórico anterior da conversa:
${previousConversationContext}

Nova mensagem do Atleta: "${lastUserMsg}"

Treinador, dê sua resposta profissional e humana:
`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ message: response.text || "Desculpe, não consegui processar a resposta." });
  } catch (error: any) {
    console.error("Gemini API Error in server.ts:", error);
    res.status(500).json({ error: "Erro de processamento da IA: " + error.message });
  }
});

// GET & POST endpoint for Scraping & Bing Web Search simulation
// Designed by the ScrapingArchitect to support both real Bing API queries and AI-driven portal scraping simulations.
app.post('/api/scrape-races', async (req, res) => {
  const { query, stateCode } = req.body;
  const targetQuery = query || `corridas de rua ${stateCode || 'Alagoas'} 2026`;
  const normalizedQuery = targetQuery.toLowerCase();

  console.log(`🔍 [ScrapingArchitect] Initiating search/scrape action for query: "${targetQuery}"`);

  const hasBingKey = process.env.BING_API_KEY && process.env.BING_API_KEY !== "";
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_URL !== "";

  let rawSearchResults: any[] = [];
  let isSimulated = false;

  try {
    if (hasBingKey) {
      // Option 1: Live Bing Web Search API Call
      console.log("🟢 [ScrapingArchitect] Fetching live results from Bing Web Search API");
      const bingUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(targetQuery)}&count=8&mkt=pt-BR&safeSearch=Active`;
      const response = await fetch(bingUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY as string }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.webPages && data.webPages.value) {
          rawSearchResults = data.webPages.value.map((page: any) => ({
            title: page.name,
            snippet: page.snippet,
            url: page.url
          }));
        }
      } else {
        console.error(`🔴 [ScrapingArchitect] Bing API returned error status: ${response.status}`);
        isSimulated = true;
      }
    } else {
      isSimulated = true;
      console.log("🟡 [ScrapingArchitect] No Bing Web Search API Key found or active. Running in simulated state portal scrapping mode.");
    }

    // Now convert raw search snippets or query directly into structured Brazilian race objects
    // If we have AI enabled, we use Gemini's deep running calendar knowledge to extract/simulate realistic races.
    if (ai) {
      let prompt = "";
      if (!isSimulated && rawSearchResults.length > 0) {
        prompt = `
You are the **ScrapingArchitect** AI scraping engine. Your task is to scrape and extract valid, upcoming running race events from the following Bing Search snippets.
Input search query: "${targetQuery}"
Search Snippets:
${JSON.stringify(rawSearchResults, null, 2)}

Provide your output as a STRICT JSON array of at most 6 items. Every item must represent a real or highly likely running race corresponding to the search with the following JSON schema:
[
  {
    "name": "Nome oficial da Corrida",
    "city": "Nome da Cidade",
    "state": "Sigla do Estado (ex: AL, SP, RJ, PE)",
    "date": "Data por extenso em Português (ex: 15 de Novembro, 2026)",
    "distances": [
      { "label": "5k", "meters": 5000 },
      { "label": "10k", "meters": 10000 }
    ],
    "profile": "flat" | "moderate" | "hilly" | "extreme",
    "profileText": "Curta descrição física (ex: Super Plano e Rápido, Misto com subidas leve, aclives acentuados)",
    "elevationGain": "+50m" | "+150m" etc,
    "vdotOffset": -1.5 to 0.5 (depending on difficulty. Flat/cool is positive, hilly/hot is zero or negative),
    "tip": "Dica estratégica valiosa baseada no clima e Jack Daniels VDOT para a região",
    "link": "https://www.ticketsports.com.br" ou link oficial da corretora do snippet,
    "attendance": "Estimativa de participantes (ex: 2.000+ atletas)",
    "source": "Ticket Sports" | "Sympla" | "FPA" | "Federação local" etc (where the event came from)
  }
]
No other text. Just the JSON array.
`;
      } else {
        // Direct expert simulation from portals like Ticket Sports / Sympla / local federations based on query
        prompt = `
You are the **ScrapingArchitect** AI scraping engine. You need to simulate the scraping of structured records from major portals (Ticket Sports, Corre Brasil, Sympla, Ativo, local Atletismo Federations) matching the target search text: "${targetQuery}".
Leverage your extensive knowledge of actual state athletic calendars and regional circuits in Brazil to generate a list of 4 to 6 highly authentic, accurate upcoming/scheduled running races for the year 2026 or early 2027 based on the queried area.

Ensure:
1. Geographically and calendar-correct races (e.g. if Alagoas is queried: Maceió, Marechal Deodoro or Arapiraca races, like 'Meia Maratona de Maceió', 'Circuito das Estações Maceió', or federated road races).
2. Distances must contain actual typical distances of that race.
3. Realistic URLs (e.g. ticketsports.com.br, sympla.com.br, ativo.com, etc).

Return your output as a STRICT JSON array with this schema:
[
  {
    "name": "Nome da Corrida",
    "city": "Cidade",
    "state": "Sigla do Estado (ex: AL)",
    "date": "Data por extenso (ex: 18 de Outubro, 2026)",
    "distances": [
      { "label": "5k", "meters": 5000 },
      { "label": "10k", "meters": 10000 },
      { "label": "Meia Maratona (21.1k)", "meters": 21097.5 }
    ],
    "profile": "flat" | "moderate" | "hilly" | "extreme",
    "profileText": "Descrição física (ex: Percurso Plano Beira-Mar com clima quente)",
    "elevationGain": "+35m" ou similar,
    "vdotOffset": -0.6,
    "tip": "Dica estratégica sobre calor, vento ou hidratração",
    "link": "https://www.ticketsports.com.br",
    "attendance": "3.500+ atletas",
    "source": "Ticket Sports"
  }
]
Do not output markdown code blocks. Do not write any explanations. Output ONLY the raw JSON array.
`;
      }

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
        }
      });

      let jsonText = response.text || "[]";
      // Sanitize markdown if any
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedRaces = JSON.parse(jsonText);
      
      return res.json({
        success: true,
        query: targetQuery,
        isSimulated: isSimulated,
        hasSupabase: hasSupabase,
        results: parsedRaces
      });
    } else {
      // In case both Gemini and Bing are missing: return mock Alagoas and other state calendar directories
      console.warn("⚠️ Both Gemini & Bing Key are missing. Returning static regional calendar directory fallback.");
      const fallbackRaces = [
        {
          name: "Meia Maratona do Farol - Maceió 2026",
          city: "Maceió",
          state: "AL",
          date: "16 de Agosto, 2026",
          distances: [
            { label: "5k", meters: 5000 },
            { label: "10k", meters: 10000 },
            { label: "Meia Maratona (21.1k)", meters: 21097.5 }
          ],
          profile: "flat",
          profileText: "Extremamente Plano à Beira-Mar / Quente",
          elevationGain: "+15m",
          vdotOffset: -0.4,
          tip: "Sensacional trajeto correndo na orla de Pajuçara e Ponta Verde. O asfalto é lisinho e plano, mas o calor de Alagoas a partir das 7h30 da manhã reduz o VDOT. Largue forte e hidrate em todos os postos.",
          link: "https://www.ticketsports.com.br",
          attendance: "2.800+ atletas",
          source: "Ticket Sports"
        },
        {
          name: "Corrida de rua Marechal Deodoro 2026",
          city: "Marechal Deodoro",
          state: "AL",
          date: "15 de Novembro, 2026",
          distances: [
            { label: "5k", meters: 5000 },
            { label: "10k", meters: 10000 }
          ],
          profile: "moderate",
          profileText: "Asfalto Quente e Ligeiramente Ondulado",
          elevationGain: "+65m",
          vdotOffset: -0.5,
          tip: "Histórica cidade da região metropolitana de Maceió. Percurso com pavimento de paralelepípedo em trechos e clima tropical úmido. Exige atenção na pisada.",
          link: "https://www.famaal.com.br",
          attendance: "1.200 atletas",
          source: "FAMA (Federação Alagoana de Atletismo)"
        }
      ];

      return res.json({
        success: true,
        query: targetQuery,
        isSimulated: true,
        hasSupabase: hasSupabase,
        results: fallbackRaces.filter(r => r.state.toLowerCase() === (stateCode || 'AL').toLowerCase() || r.name.toLowerCase().includes(normalizedQuery))
      });
    }

  } catch (error: any) {
    console.error("🔴 [ScrapingArchitect Error] Scraping API caught error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro desconhecido ao processar scraping."
    });
  }
});

// Configure Vite or production static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Starting Server in Development Mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Starting Server in Production Mode with Static Middleware...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌍 Server active and listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
