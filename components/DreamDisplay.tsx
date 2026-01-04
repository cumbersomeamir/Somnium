
import React, { useState } from 'react';
import { DreamEntry, ChatMessage } from '../types';
import { getDreamChatResponse } from '../services/geminiService';

interface DreamDisplayProps {
  dream: DreamEntry;
  onUpdate: (updated: DreamEntry) => void;
}

export const DreamDisplay: React.FC<DreamDisplayProps> = ({ dream, onUpdate }) => {
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatting) return;
    
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    const newHistory = [...dream.chatHistory, userMsg];
    
    setChatInput('');
    setIsChatting(true);
    
    // Optimistic update
    onUpdate({ ...dream, chatHistory: newHistory });

    try {
      const response = await getDreamChatResponse(dream.transcription, newHistory, chatInput);
      const modelMsg: ChatMessage = { role: 'model', text: response };
      onUpdate({ ...dream, chatHistory: [...newHistory, modelMsg] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
      {/* Left Column: Visuals & Transcription */}
      <div className="space-y-6">
        <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
          {dream.imageUrl ? (
            <img src={dream.imageUrl} alt="Dream Visual" className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-indigo-900/20 flex items-center justify-center italic text-indigo-300">
              Generating Vision...
            </div>
          )}
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-serif mb-3 text-indigo-300">Transcription</h3>
          <p className="text-slate-300 leading-relaxed italic">"{dream.transcription}"</p>
        </div>
      </div>

      {/* Right Column: Interpretation & Chat */}
      <div className="space-y-6 h-full flex flex-col">
        {dream.interpretation && (
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-xl font-serif text-indigo-300 border-b border-white/10 pb-2">Psychological Interpretation</h3>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-400">Core Theme</h4>
              <p className="text-slate-200">{dream.interpretation.coreTheme}</p>
            </div>

            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-400">Archetypes</h4>
              <ul className="list-disc list-inside space-y-1">
                {dream.interpretation.archetypes.map((a, i) => (
                  <li key={i} className="text-slate-200"><span className="font-semibold text-indigo-200">{a.name}:</span> {a.description}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-400">Key Symbols</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {dream.interpretation.symbols.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-indigo-200">
                    {s.object}: {s.meaning}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="glass-card p-6 rounded-3xl flex-grow flex flex-col min-h-[400px]">
          <h3 className="text-xl font-serif text-indigo-300 mb-4">Discuss the Subconscious</h3>
          
          <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {dream.chatHistory.length === 0 && (
              <p className="text-slate-400 italic text-center mt-10">Ask about specific symbols or feelings from your dream...</p>
            )}
            {dream.chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatting && (
              <div className="flex justify-start">
                <div className="bg-white/10 p-3 rounded-2xl animate-pulse text-slate-400">Thinking...</div>
              </div>
            )}
          </div>

          <div className="flex gap-2 sticky bottom-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask about a symbol..."
              className="flex-grow bg-black/40 border border-white/10 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSendChat}
              disabled={isChatting || !chatInput.trim()}
              className="bg-indigo-600 p-2 rounded-full hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
