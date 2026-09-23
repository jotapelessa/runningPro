import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  RotateCcw, 
  Flame, 
  HeartHandshake, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { ChatMessage, RunnerState, UserActivity } from '../types';

interface CoachChatProps {
  runnerState: RunnerState;
  activities?: UserActivity[];
}

export const CoachChat: React.FC<CoachChatProps> = ({ runnerState, activities = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isTransitionUser = runnerState.level === 'sedentary_transition' || runnerState.activityProfile === 'sedentary';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: isTransitionUser
        ? `👋 Olá, **${runnerState.name}**! Eu sou seu **Treinador IA PaceLab (Fisiologista de Transição)**.\n\nIdentifiquei que você está na **Fase de Adaptação Musculoesquelética** (método Caminha-Corre). Minha prioridade com você é **proteger seus tendões e articulações** e garantir que você evolua sem canelite e sem esgotamento.\n\nComo posso te orientar sobre seu trote leve, respiração ou dores hoje?`
        : `👋 Olá, **${runnerState.name}**! Eu sou seu **Treinador IA PaceLab VDOT**.\n\nEstou calibrado com seu VDOT atual de **${runnerState.currentVdot.toFixed(1)}**, volume de **${runnerState.weeklyVolume} km/sem** e acompanho suas atividades sincronizadas.\n\nComo posso ajudar você com suas zonas de ritmo, análise dos últimos treinos ou prevenção de lesões hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickChips = isTransitionUser ? [
    'Analise meus treinos recentes sincronizados',
    'Como saber se meu trote está leve o suficiente?',
    'Senti uma fisgada na canela ao alternar 250m',
    'Posso fazer o caminha-corre na esteira ou na rua?',
    'Quando estarei pronto para o teste formal de VDOT?'
  ] : [
    'Analise meu volume e treinos recentes sincronizados',
    'Como distribuir meu volume semanal?',
    'Qual meu teto seguro de tiros (≤ 8%)?',
    'Estou sentindo dor na canela, o que fazer?',
    'Como respirar durante o Pace T (Limiar)?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setLoading(true);

    const botMessageId = `bot-${Date.now()}`;
    let botReplyCreated = false;

    try {
      const response = await fetch('/api/coach/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          runnerState,
          userPrompt: text.trim(),
          activities,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream HTTP error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data:')) {
            try {
              const dataPayload = JSON.parse(line.substring(5).trim());
              if (dataPayload.text) {
                accumulatedText += dataPayload.text;

                if (!botReplyCreated) {
                  botReplyCreated = true;
                  setLoading(false);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: botMessageId,
                      role: 'assistant',
                      text: accumulatedText,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    }
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMessageId ? { ...msg, text: accumulatedText } : msg
                    )
                  );
                }
              }
            } catch (jsonErr) {
              // Ignore partial or non-json SSE lines
            }
          }
        }
      }

      // If finished stream without receiving text chunk, fallback
      if (!accumulatedText) {
        setMessages((prev) => [
          ...prev,
          {
            id: botMessageId,
            role: 'assistant',
            text: 'Entendido! Siga rigorosamente suas zonas de FC e pace.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }
    } catch (err) {
      console.error('Coach chat stream error, trying fallback standard POST:', err);
      try {
        const responseFallback = await fetch('/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newHistory,
            runnerState,
            userPrompt: text.trim(),
            activities,
          }),
        });
        const fallbackData = await responseFallback.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-fallback-${Date.now()}`,
            role: 'assistant',
            text: fallbackData.text || 'Lembre-se: mantenha pelo menos 75% da sua semana em Z2 (Pace E) para recuperação garantida.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } catch (finalErr) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            role: 'assistant',
            text: 'Desculpe, tive uma instabilidade temporária na conexão. Mantenha os treinos fáceis em Z2 e hidrate-se bem.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: `Conversa reiniciada. Fisiologia pronta: VDOT **${runnerState.currentVdot.toFixed(1)}**, ${runnerState.weeklyVolume} km semanais. Em que posso te orientar agora?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        id="btn-open-coach-chat"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-40 p-3.5 rounded-full bg-[#FF4E00] hover:bg-[#E03E00] text-white shadow-2xl shadow-[#FF4E00]/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group"
        title="Falar com o Treinador IA"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#050505]"></span>
        </span>
      </button>

      {/* Floating Modal Panel */}
      {isOpen && (
        <div 
          id="coach-chat-window"
          className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] max-h-[82vh] bg-[#0A0A0A] border border-[#FF4E00]/30 rounded-2xl shadow-2xl shadow-black flex flex-col overflow-hidden animate-fadeIn"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#140F0C] via-[#0A0A0A] to-[#140F0C] border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF4E00]/10 border border-[#FF4E00]/30 flex items-center justify-center text-[#FF4E00]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-white font-heading">Treinador IA PaceLab</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono-data">
                  VDOT {runnerState.currentVdot.toFixed(1)} • Jack Daniels Fisiologia
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="btn-reset-coach-chat"
                onClick={handleReset}
                title="Reiniciar conversa"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-close-coach-chat"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Chips */}
          <div className="bg-[#050505] px-3 py-2 border-b border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="whitespace-nowrap text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#FF4E00]/15 hover:text-[#FF4E00] border border-white/10 text-slate-300 transition-colors flex-shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Scroll View */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#FF4E00] text-white rounded-br-none shadow-md shadow-[#FF4E00]/20'
                        : 'bg-[#121214] text-slate-200 border border-white/10 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                  </div>
                  <span className="text-[10px] text-slate-500 px-1 mt-1 font-mono-data">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#121214] px-3 py-2 rounded-xl w-fit border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-[#FF4E00] animate-spin" />
                <span>Analisando fisiologia e calculando resposta...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-[#0A0A0A] border-t border-white/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Pergunte sobre treinos, dores, paces..."
                className="flex-1 bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4E00]"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-2 rounded-xl bg-[#FF4E00] hover:bg-[#E03E00] disabled:opacity-40 text-white transition-all shadow-md shadow-[#FF4E00]/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
