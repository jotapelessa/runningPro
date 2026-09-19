import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, RunnerState, WeekPlan } from '../types';
import { Send, User, Sparkles, MessageCircle, RefreshCw, AlertCircle, X } from 'lucide-react';

interface CoachChatProps {
  runnerState: RunnerState;
  activePlan: WeekPlan[];
  onClose?: () => void;
}

export default function CoachChat({ runnerState, activePlan, onClose }: CoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Bem-vindo(a) ao Treinador Virtual de Corrida! Para montar seu plano personalizado, vou fazer algumas perguntas. Você pode responder todas de uma vez se preferir, ou uma a uma.

Vamos começar? Por favor, me informe qual o seu objetivo e qual é a sua **idade** e **sexo biológico** (masculino/feminino).`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // Format current training plan details for the AI coach context
    const currentPlanSummary = activePlan.map(w => 
      `Semana ${w.weekNum} [${w.periodLabel}]: Volume ${w.totalVolumeKm}km. Intensidade: ${w.intensityLevel}.`
    ).join('\n');

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, text: m.text })),
          runnerState: runnerState,
          currentPlanSummary: currentPlanSummary
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }
      
      const coachMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.message || '⚠️ **Desculpe**, tive um problema ao processar sua resposta. Por favor, tente novamente.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, coachMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        text: `⚠️ **Ops, ocorreu um erro!** ${err.message || 'Não consegui obter resposta do Treinador IA. Por favor, tente novamente mais tarde.'}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTrigger = (text: string) => {
    handleSendMessage(text);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `Bem-vindo(a) ao Treinador Virtual de Corrida! Para montar seu plano personalizado, vou fazer algumas perguntas. Você pode responder todas de uma vez se preferir, ou uma a uma.

Vamos começar? Por favor, me informe qual o seu objetivo e qual é a sua **idade** e **sexo biológico** (masculino/feminino).`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div id="coach-chat-container" className="bg-slate-950 text-slate-100 rounded-2xl flex flex-col h-[640px] shadow-xl overflow-hidden border border-slate-800">
      
      {/* Chat Header */}
      <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-vdot-orange/15 p-2 rounded-lg border border-vdot-orange/20 animate-pulse">
            <Sparkles className="w-4 h-4 text-vdot-orange" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              Treinador IA VDOT
              <span className="bg-[#FF4E00]/10 text-[#FF4E00] text-[8px] font-black tracking-normal px-1.5 py-0.5 rounded uppercase">Coach</span>
            </h3>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              Sincronizado com os dados acima
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button 
            type="button"
            onClick={handleResetChat}
            title="Reiniciar chat"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              title="Fechar chat"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 scroll-smooth">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="bg-vdot-orange shrink-0 p-1.5 rounded-lg text-black font-black text-xs mt-0.5 shadow-[0_0_8px_rgba(255,78,0,0.3)]">
                  IA
                </div>
              )}

              <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  isUser 
                    ? 'bg-vdot-orange text-black font-extrabold rounded-tr-none shadow-[0_0_12px_rgba(255,78,0,0.2)]' 
                    : 'bg-[#121214] border border-white/5 text-slate-200 rounded-tl-none'
                }`}>
                  {renderCustomMarkdown(msg.text)}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 font-mono">{msg.timestamp}</span>
              </div>

              {isUser && (
                <div className="bg-slate-800 shrink-0 p-1.5 rounded-lg text-slate-400 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="bg-vdot-orange shrink-0 p-1.5 rounded-lg text-black font-black text-xs mt-0.5">
              IA
            </div>
            <div className="bg-[#121214] border border-white/5 p-4 rounded-2xl text-sm text-slate-400 rounded-tl-none flex items-center space-x-2">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75" />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150" />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-300" />
              <span className="text-xs font-mono ml-2">Treinador elaborando planilha...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Fast Triggers */}
      <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-900 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2 shrink-0">
        <button 
          onClick={() => handleQuickTrigger('Como deve ser a progressão de volume (km) e intensidade?')}
          className="bg-slate-900 border border-slate-800 hover:border-vdot-orange px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white transition shrink-0 cursor-pointer"
        >
          📈 Volume vs Intensidade
        </button>
        <button 
          onClick={() => handleQuickTrigger('Fiz o teste de Cooper e corri 2800 metros. Calcular meu VO2 e VDOT, por favor.')}
          className="bg-slate-900 border border-slate-800 hover:border-vdot-orange px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white transition shrink-0 cursor-pointer"
        >
          🏃 Calcular Cooper 2800m
        </button>
        <button 
          onClick={() => handleQuickTrigger('Se eu corro 5k em 22:30, quanto faço nos 10k e na meia maratona?')}
          className="bg-slate-900 border border-slate-800 hover:border-vdot-orange px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white transition shrink-0 cursor-pointer"
        >
          ⏱️ Equivalência 5k (22min)
        </button>
        <button 
          onClick={() => handleQuickTrigger('Sinto fortes dores na canela direita ao treinar, o que devo fazer?')}
          className="bg-slate-900 border border-rose-850 hover:border-rose-500 px-3 py-1.5 rounded-lg text-xs text-rose-300 hover:text-white transition shrink-0 cursor-pointer"
        >
          🚨 Canela inflamada (Dor aguda!)
        </button>
        <button 
          onClick={() => handleQuickTrigger('Estou exausto e me sentindo com sintomas de overtraining. Como recuperar?')}
          className="bg-slate-900 border border-slate-800 hover:border-vdot-orange px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white transition shrink-0 cursor-pointer"
        >
          🔋 Fadiga & Overtraining
        </button>
      </div>

      {/* Input Bar */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="bg-slate-900 p-4 border-t border-slate-850 flex gap-2.5 shrink-0"
      >
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escreva sua mensagem para o Treinador VDOT..."
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-vdot-orange disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={!inputText.trim() || loading}
          className="bg-vdot-orange hover:bg-opacity-90 text-black font-black px-4 py-3 rounded-xl transition disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}

// Inline Markdown parsing elements
function renderCustomMarkdown(text: string = '') {
  const safeText = typeof text === 'string' ? text : String(text || '');
  return safeText.split('\n').map((line, i) => {
    // List item check
    if (line.trim().startsWith('- ')) {
      return <li key={i} className="ml-4 list-disc text-slate-300 leading-relaxed mb-1">{parseInlineStyles(line.trim().substring(2))}</li>;
    }
    if (line.trim().startsWith('* ')) {
      return <li key={i} className="ml-4 list-disc text-slate-300 leading-relaxed mb-1">{parseInlineStyles(line.trim().substring(2))}</li>;
    }
    // Heading 3
    if (line.trim().startsWith('### ')) {
      return <h4 key={i} className="text-sm font-extrabold text-white mt-3.5 mb-1 tracking-wide">{parseInlineStyles(line.trim().substring(4))}</h4>;
    }
    // Heading 2
    if (line.trim().startsWith('## ')) {
      return <h3 key={i} className="text-base font-black text-white mt-4 mb-2 tracking-wide border-b border-slate-800 pb-1">{parseInlineStyles(line.trim().substring(3))}</h3>;
    }
    // Standard Paragraph
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return <p key={i} className="text-slate-300 leading-relaxed font-sans mb-1.5">{parseInlineStyles(line)}</p>;
  });
}

function parseInlineStyles(line: string = '') {
  const safeLine = typeof line === 'string' ? line : String(line || '');
  const parts = safeLine.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-extrabold text-white bg-slate-800/60 px-1 py-0.2 rounded">{part}</strong>;
    }
    return part;
  });
}
