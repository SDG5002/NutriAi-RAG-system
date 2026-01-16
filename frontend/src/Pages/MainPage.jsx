import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Sparkles, Apple, Activity, Info, Loader2 } from 'lucide-react';

// --- API Logic (REPLACED GEMINI WITH FASTAPI BACKEND) ---
const callBackend = async (query) => {
  try {
    const response = await fetch("https://nutriai-rag-system.onrender.com/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: query
      })
    });

    if (!response.ok) throw new Error("Backend unavailable");
    const data = await response.json();
    return data.answer;
  } catch (e) {
    return "Server error. Please ensure your local FastAPI backend is running at https://nutriai-rag-system.onrender.com/ask.";
  }
};

// --- UI Components ---

const BackgroundCreatures = () => {
  // Static positions with green and emerald themes
  const staticPositions = [
    { top: '15%', left: '10%', color: '#10b981', size: 180 },
    { top: '70%', left: '80%', color: '#4ade80', size: 220 },
    { top: '40%', left: '60%', color: '#059669', size: 150 },
    { top: '10%', left: '75%', color: '#4ade80', size: 190 },
    { top: '80%', left: '20%', color: '#10b981', size: 200 },
    { top: '50%', left: '5%', color: '#34d399', size: 160 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#020503]">
      {/* Static Blurred Ambient Shapes for Depth - Switched to Green shades */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[130px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-green-500/10 blur-[130px]" />

      {/* High-Visibility White Dot Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.4]" 
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}
      />
      
      {/* Static Bioluminescent "Creatures" - Green theme */}
      {staticPositions.map((pos, i) => (
        <div
          key={i}
          className="absolute opacity-30 blur-2xl"
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.size,
            height: pos.size,
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 200 200">
            <defs>
              <radialGradient id={`grad${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={pos.color} stopOpacity="0.8" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="80" fill={`url(#grad${i})`} />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I am NutriAI, your health and nutrition assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Ref for the scrollable container
  const scrollRef = useRef(null);
  // Ref for the dummy element at the bottom of the chat
  const messagesEndRef = useRef(null);

  // Quick prompt suggestions
  const quickPrompts = [
    "High protein snacks?",
    "Daily water intake?",
    "Low carb diet tips",
    "Vitamins for energy"
  ];

  // Function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effect to trigger scroll whenever messages or typing state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (forcedQuery) => {
    const queryToSend = typeof forcedQuery === 'string' ? forcedQuery : input.trim();
    if (!queryToSend || isTyping) return;

    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: queryToSend }]);
    setIsTyping(true);

    try {
      const response = await callBackend(queryToSend);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const onQuickPromptClick = (prompt) => {
    handleSend(prompt);
  };

  return (
    <div className="relative min-h-screen text-slate-100 font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col">
      <BackgroundCreatures />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/20 border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-emerald-400 to-green-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
            <Activity size={20} className="text-black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            NutriAI
          </h1>
        </div>
        <div className="hidden sm:flex gap-6 text-sm font-medium text-white/60">
          <button
            onClick={() => window.open(
                "https://www.zambiancu.org/1zRead/RevillaMarie%20Kainoa-Human-Nutrition-2020.pdf",
                "_blank"
            )}
            className="hover:text-white cursor-pointer transition-colors"
            >
            Knowledge Base
            </button>

          <span className=" cursor-pointer transition-colors flex items-center gap-1">
            <span className="text-emerald-400/80">●</span> Nutrition Facts
          </span>
        </div>
      </nav>

      {/* Main Chat Interface */}
      <main className="relative z-10 pt-20 flex-1 flex flex-col max-w-4xl w-full mx-auto px-4">
        {/* Chat area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto pt-6 pb-40 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-white/10"
        >
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-sm ${
                  msg.role === 'user' ? 'bg-emerald-600/20' : 'bg-white/10'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-emerald-400" />}
                </div>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed backdrop-blur-xl ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600/30 text-emerald-50 border border-emerald-500/20 rounded-tr-none shadow-lg' 
                    : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none shadow-lg'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-3 max-w-[85%] flex-row">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 border border-white/10 backdrop-blur-sm">
                  <Loader2 size={16} className="animate-spin text-emerald-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 rounded-tl-none text-white/40 italic text-xs backdrop-blur-xl">
                  NutriAI is thinking...
                </div>
              </div>
            </div>
          )}

          {/* This element ensures we can always scroll to the very bottom */}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input area */}
        <div className="fixed bottom-0 left-0 w-full pb-8 pt-4 bg-gradient-to-t from-[#020503] via-[#020503]/95 to-transparent px-4">
          <div className="max-w-3xl mx-auto">
            
            {/* Quick Prompts */}
            <div className="flex flex-wrap justify-center gap-2 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onQuickPromptClick(prompt)}
                  disabled={isTyping}
                  className="px-4 py-2 text-xs font-medium rounded-full border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/20 hover:border-emerald-500/40 backdrop-blur-md transition-all text-emerald-100/70 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="relative flex items-center group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about calories, vitamins, meal plans..."
                className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all placeholder:text-white/20 shadow-2xl"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`absolute right-2 p-2.5 rounded-xl transition-all ${
                  input.trim() && !isTyping 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[9px] text-center mt-3 text-white/10 uppercase tracking-[0.2em] font-bold">
              Personalized Nutrition Intelligence
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}