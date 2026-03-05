import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Globe, Send, X, Brain, Bot, User, Mic, Volume2 } from 'lucide-react';

const Chatbot = () => {
  const [language, setLanguage] = useState('en');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' }
  ];

  const translations = {
    en: {
      title: 'AI Assistant',
      send: 'Send',
      typeMessage: 'Type your message here...',
      askAssistant: 'Ask about venue data, occupancy, or anything else',
      minimize: 'Minimize',
      maximize: 'Maximize'
    },
    es: {
      title: 'Asistente de IA',
      send: 'Enviar',
      typeMessage: 'Escribe tu mensaje aquí...',
      askAssistant: 'Pregunta sobre datos del lugar, ocupación, o cualquier cosa',
      minimize: 'Minimizar',
      maximize: 'Maximizar'
    },
    // Add more translations as needed
  };

  const t = translations[language] || translations.en;

  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hello! I can help you analyze venue data and retrieve information about detected people. What would you like to know?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [processingMessage, setProcessingMessage] = useState(false);
  const chatContainerRef = useRef(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || processingMessage) return;

    const userMessage = { id: messages.length + 1, role: 'user', content: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setProcessingMessage(true);

    scrollToBottom();

    try {
      let botResponse = "I'm processing your request about the venue data.";
      if (userInput.toLowerCase().includes('parking')) {
        botResponse = `There are currently 68 parking spaces available at the venue.`;
      } else if (userInput.toLowerCase().includes('people') || userInput.toLowerCase().includes('count')) {
        botResponse = `Currently, there are 42 people detected in the venue (42% capacity).`;
      } else if (userInput.toLowerCase().includes('trend') || userInput.toLowerCase().includes('hour')) {
        botResponse = `Peak occupancy today was at 14:00 with 76 people.`;
      } else if (userInput.toLowerCase().includes('export') || userInput.toLowerCase().includes('download')) {
        botResponse = `Export detection data from the Detected People page in the admin dashboard.`;
      } else if (userInput.toLowerCase().includes('camera') || userInput.toLowerCase().includes('feed')) {
        botResponse = `View live camera feed on the Venue Monitoring page.`;
      } else {
        botResponse = `I can assist with venue occupancy, parking, detection, and trends. What do you need?`;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      const assistantMessage = { id: messages.length + 2, role: 'assistant', content: botResponse };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = { id: messages.length + 2, role: 'assistant', content: 'Sorry, an error occurred. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setProcessingMessage(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 100);
    }
  };

  useEffect(() => {
    if (messages.length > 0 && messages[0].role === 'assistant') {
      const welcomeMessage = `Hello! I can help you analyze venue data and retrieve information. What would you like to know?`;
      setMessages(prev => [
        { id: 1, role: 'assistant', content: welcomeMessage },
        ...prev.slice(1)
      ]);
    }
    scrollToBottom();
  }, [language]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">{t.title}</h2>
                <p className="text-sm text-blue-100">Powered by 512D AI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white/20 border-none rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="text-gray-800">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="h-[600px] flex flex-col">
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 bg-gray-50"
            >
              <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-3 max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          {message.content}
                        </div>
                        {message.role === 'assistant' && (
                          <button 
                            className={`flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors ${
                              isSpeaking ? 'text-blue-600' : ''
                            }`}
                            onClick={() => setIsSpeaking(!isSpeaking)}
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>{isSpeaking ? 'Stop Speaking' : 'Listen'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {processingMessage && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-100"></div>
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-200">
              <div className="max-w-3xl mx-auto flex flex-col gap-2">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 pr-12"
                      placeholder={t.typeMessage}
                      disabled={processingMessage}
                    />
                    <button
                      type="button"
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
                        isListening 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      onClick={() => setIsListening(!isListening)}
                      title={isListening ? 'Stop Recording' : 'Start Recording'}
                    >
                      <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                    disabled={processingMessage || !userInput.trim()}
                  >
                    <Send className="w-5 h-5" />
                    <span>{t.send}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{t.askAssistant}</p>
                  {isListening && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                      <span>Recording...</span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;