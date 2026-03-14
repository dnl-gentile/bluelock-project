import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, User, ArrowLeft, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  action?: {
    type: 'training_update' | 'wiki_entry';
    label: string;
  };
}

export default function AICoachChat() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q');
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Olá! Eu sou a Anri, assistente do Ego. Precisa alterar a carga do treino, trocar o foco para outro fundamento, ou quer perguntar algo para a Bluelockpedia?'
    }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
    }
  }, []);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const newUserMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      let aiText = 'Estou refatorando os dados...';
      let action: ChatMessage['action'] = undefined;
      
      const lower = text.toLowerCase();
      if (lower.includes('treino') || lower.includes('drible') || lower.includes('chute') || lower.includes('refatorar')) {
        aiText = 'Legal. Entendi que você quer focar mais nisso hoje. Gerei um novo protocolo priorizando volume nesse fundamento.';
        action = { type: 'training_update', label: 'Aceitar e Fixar Novo Treino' };
      } else if (lower.includes('wiki') || lower.includes('o que é') || lower.includes('explica')) {
        aiText = 'Busquei isso nos dados globais. Adicionei uma nova entrada completa na Bluelockpedia para você consultar depois. Você pode acessar também para treinar essa técnica.';
        action = { type: 'wiki_entry', label: 'Ver na Bluelockpedia' };
      } else {
        aiText = 'Analisei sua mensagem. Para progredirmos, escolha se quer atualizar o treino atual ou apenas tirar uma dúvida técnica.';
      }
      
      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', sender: 'ai', text: aiText, action }]);
    }, 1200);
  };

  const handleActionClick = (action: NonNullable<ChatMessage['action']>) => {
    if (action.type === 'training_update') {
      alert('Treino fixado com sucesso. Navegando para o Treino do Dia...');
      router.push('/training');
    } else if (action.type === 'wiki_entry') {
      router.push('/wiki');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 border-b border-white/5 shrink-0">
        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <Bot className="w-8 h-8 text-[#1d4ed8]" />
        <div>
          <h1 className="text-xl font-bold font-display uppercase tracking-wider text-white">Anri</h1>
          <p className="text-xs font-mono text-slate-500 uppercase">Status: Online</p>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 scroll-smooth px-2 no-scrollbar">
        {messages.map(msg => {
          const isAI = msg.sender === 'ai';
          return (
            <div key={msg.id} className={`flex gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAI ? 'bg-[#1d4ed8]/20 border border-[#1d4ed8]/50' : 'bg-white/10'}`}>
                {isAI ? <Bot className="w-4 h-4 text-[#1d4ed8]" /> : <User className="w-4 h-4 text-slate-300" />}
              </div>
              <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'} max-w-[80%]`}>
                <div className={`p-4 rounded-2xl text-sm ${
                  isAI 
                    ? 'bg-[#162032] border border-white/5 text-slate-300 rounded-tl-none' 
                    : 'bg-[#1d4ed8] text-white rounded-tr-none'
                }`}>
                  {msg.text}
                </div>
                {msg.action && (
                  <button 
                    onClick={() => handleActionClick(msg.action!)}
                    className="mt-2 bg-[#050505] border border-[#1d4ed8]/50 text-[#1d4ed8] box-shadow-neon px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all hover:bg-[#1d4ed8]/10"
                  >
                    {msg.action.label}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Input Area */}
      <div className="py-4 shrink-0">
        <div className="p-2 bg-[#0a0e17] border border-white/10 rounded-2xl flex items-center gap-2">
          <input 
            type="text"
            className="flex-1 bg-transparent px-3 py-2 text-white placeholder-slate-600 focus:outline-none font-mono text-sm"
            placeholder="Mude meu treino ou faça uma pergunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          />
          <button 
            onClick={() => handleSend(input)}
            className="w-10 h-10 bg-[#1d4ed8] rounded-xl flex items-center justify-center text-white hover:brightness-110 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-2 px-1 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setInput('Mude meu treino para foco em passes.')} className="bg-white/5 whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] uppercase font-mono text-slate-400 hover:text-white transition-colors">🎯 Focar em Passe</button>
          <button onClick={() => setInput('O que é metavisão?')} className="bg-white/5 whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] uppercase font-mono text-slate-400 hover:text-white transition-colors">🧠 Metavisão</button>
          <button onClick={() => setInput('Crie um treino mais leve hoje. Estou cansado.')} className="bg-white/5 whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] uppercase font-mono text-slate-400 hover:text-white transition-colors">🔋 Treino Regenerativo</button>
        </div>
      </div>
    </div>
  );
}
