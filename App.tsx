
import React, { useState } from 'react';
import { DreamEntry, ImageSize } from './types';
import { Recorder } from './components/Recorder';
import { DreamDisplay } from './components/DreamDisplay';
import { transcribeAudio, interpretDream, generateDreamImage } from './services/geminiService';

const App: React.FC = () => {
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [selectedDreamId, setSelectedDreamId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<{ imageSize: ImageSize }>({ imageSize: '1K' });

  const handleRecordingComplete = async (blob: Blob, base64: string) => {
    setIsProcessing(true);
    try {
      // 1. Transcribe (High speed with Flash)
      const text = await transcribeAudio(base64);
      
      const newDream: DreamEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        transcription: text,
        chatHistory: [],
        imageSize: config.imageSize
      };
      
      // Update UI immediately to show transcription
      setDreams(prev => [newDream, ...prev]);
      setSelectedDreamId(newDream.id);

      // 2. Interpret (Flash model for speed)
      const interpretation = await interpretDream(text);
      setDreams(prev => prev.map(d => d.id === newDream.id ? { ...d, interpretation } : d));

      // 3. Generate Image (Fastest for 1K)
      const imageUrl = await generateDreamImage(interpretation, config.imageSize);
      setDreams(prev => prev.map(d => d.id === newDream.id ? { ...d, imageUrl } : d));
      
    } catch (err: any) {
      console.error(err);
      alert("Encountered an error exploring your subconscious. Please ensure your environment is configured correctly.");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedDream = dreams.find(d => d.id === selectedDreamId);

  return (
    <div className="min-h-screen dream-gradient p-4 md:p-8">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-serif text-white tracking-tight mb-2">Somnium</h1>
          <p className="text-indigo-300 font-light tracking-widest uppercase text-xs">A bridge to your subconscious</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <label className="text-[10px] uppercase tracking-tighter text-indigo-400 mb-1">Visual Fidelity</label>
            <select
              value={config.imageSize}
              onChange={(e) => setConfig({ ...config, imageSize: e.target.value as ImageSize })}
              className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="1K">1K - Flash (Fastest)</option>
              <option value="2K">2K - Pro (Detailed)</option>
              <option value="4K">4K - Pro (Highest)</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-12 pb-20">
        {!selectedDreamId ? (
          <div className="flex flex-col items-center py-20 space-y-12">
            <Recorder onRecordingComplete={handleRecordingComplete} isProcessing={isProcessing} />
            
            {dreams.length > 0 && (
              <div className="w-full">
                <h3 className="text-2xl font-serif text-indigo-200 mb-6 text-center">Dream Archive</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dreams.map((dream) => (
                    <button
                      key={dream.id}
                      onClick={() => setSelectedDreamId(dream.id)}
                      className="glass-card group relative aspect-square rounded-3xl overflow-hidden transition-all hover:scale-[1.02] active:scale-95"
                    >
                      {dream.imageUrl ? (
                        <img src={dream.imageUrl} alt="Dream" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-6 text-center text-sm text-indigo-300">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>{isProcessing ? "Manifesting..." : "Interpretation in progress..."}</span>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-6">
                        <span className="text-xs text-indigo-400 mb-1">{new Date(dream.timestamp).toLocaleDateString()}</span>
                        <p className="text-white text-sm line-clamp-2 italic">"{dream.transcription}"</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => setSelectedDreamId(null)}
              className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Return to Gallery
            </button>
            {selectedDream && (
              <DreamDisplay
                dream={selectedDream}
                onUpdate={(updated) => setDreams(prev => prev.map(d => d.id === updated.id ? updated : d))}
              />
            )}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none z-50">
        <div className="max-w-6xl mx-auto flex justify-center">
          <div className="bg-black/60 backdrop-blur-md border border-white/5 px-6 py-2 rounded-full text-xs text-indigo-400 pointer-events-auto shadow-lg">
            © Somnium AI · Exploring the Architecture of Dreams
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
