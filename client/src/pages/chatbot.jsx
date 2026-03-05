import React, { useState, useEffect, useRef } from 'react';
import { Brain, Bot, User, Mic, Send, Globe, Volume2, Sparkles, Terminal, Activity, Command } from 'lucide-react';
import { Navigation } from '../components/Layout';

const Chatbot = () => {
  const [language, setLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [processingMessage, setProcessingMessage] = useState(false);
  const chatContainerRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'hi', name: 'हिन्दी' }
  ];

  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Neural link established. I am your 512D Assistant. How can I help you analyze venue metrics today?' }
  ]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [messages, processingMessage]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || processingMessage) return;

    const userMsg = { id: Date.now(), role: 'user', content: userInput };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setProcessingMessage(true);

    // Mock AI Logic
    setTimeout(() => {
      let botResponse = "Query processed. I'm analyzing the requested neural data clusters.";
      if (userInput.toLowerCase().includes('people')) botResponse = "Current sensor data indicates 42 subjects present (42% total capacity).";
      else if (userInput.toLowerCase().includes('parking')) botResponse = "Parking telemetry shows 68 vacant slots in Sector A and B.";
      
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: botResponse }]);
      setProcessingMessage(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200">
      <Navigation />
      
      <main className="flex-1 ml-[80px] flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-[#020617]/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Brain className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-widest text-white uppercase">Neural Assistant</h1>
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400/60 uppercase">
                <Activity className="w-3 h-3" /> Protocol: 512D-Alpha
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 items-center">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-3 mr-2" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-300 focus:outline-none pr-4 py-2"
              >
                {languages.map(l => <option key={l.code} value={l.code} className="bg-slate-900">{l.name}</option>)}
              </select>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[10px] font-black tracking-widest">
              SYSTEM ONLINE
            </div>
          </div>
        </header>

        {/* Chat Interface */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar" ref={chatContainerRef}>
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`flex gap-4 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                    m.role === 'user' ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/10'
                  }`}>
                    {m.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-blue-400" />}
                  </div>
                  
                  <div className="space-y-2">
                    <div className={`px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-xl ${
                      m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/[0.03] text-slate-200 border border-white/10'
                    }`}>
                      {m.content}
                    </div>
                    {m.role === 'assistant' && (
                      <button 
                        onClick={() => setIsSpeaking(!isSpeaking)}
                        className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${isSpeaking ? 'text-blue-400' : 'text-slate-600 hover:text-blue-400'}`}
                      >
                        <Volume2 className={`w-3 h-3 ${isSpeaking ? 'animate-pulse' : ''}`} />
                        {isSpeaking ? 'Synthesis Active' : 'Synthesize Audio'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {processingMessage && (
              <div className="flex justify-start">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                  </div>
                  <div className="flex gap-1.5 p-3">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Command Input Area */}
        <div className="p-8 bg-gradient-to-t from-[#020617] to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-2 shadow-2xl focus-within:border-blue-500/50 transition-all duration-300">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className="flex-1 relative flex items-center">
                  <div className="absolute left-4 p-1.5 bg-white/5 rounded-lg border border-white/10">
                    <Command className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Enter command or query (e.g., 'Report occupancy')..."
                    className="w-full bg-transparent py-4 pl-14 pr-12 text-sm text-white focus:outline-none placeholder:text-slate-600 font-medium"
                    disabled={processingMessage}
                  />
                  <button
                    type="button"
                    onClick={() => setIsListening(!isListening)}
                    className={`absolute right-2 p-2.5 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:bg-white/5'}`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!userInput.trim() || processingMessage}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-600 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>Execute</span>
                  </div>
                </button>
              </form>
            </div>
            <div className="mt-4 flex justify-between px-6">
               <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Type / for advanced commands</p>
               {isListening && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">Recording Audio Stream...</p>}
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}</style>
    </div>
  );
};

export default Chatbot;