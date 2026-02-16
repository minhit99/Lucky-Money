
import React, { useState, useEffect, useRef } from 'react';
import Wheel from './components/Wheel';
import LuckyEnvelopes from './components/LuckyEnvelopes';
import SettingsPanel from './components/SettingsPanel';
import HistoryList from './components/HistoryList';
import { Denomination, HistoryEntry, GameState, SelectionMode } from './types';
import { DEFAULT_DENOMINATIONS } from './constants';
import Confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [items, setItems] = useState<Denomination[]>(DEFAULT_DENOMINATIONS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [winner, setWinner] = useState<Denomination | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<SelectionMode>(SelectionMode.WHEEL);
  const [isMuted, setIsMuted] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Background Music Setup
    audioRef.current = new Audio('https://cdn.pixabay.com/audio/2026/01/14/audio_3265c1aace.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playFireworksSound = () => {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    const createBoom = (time: number, volume: number) => {
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, time);
      filter.frequency.exponentialRampToValueAtTime(40, time + 1.5);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(time);
      noise.stop(time + 1.5);
    };

    const createCrackle = (time: number, volume: number) => {
      for (let i = 0; i < 20; i++) {
        const t = time + Math.random() * 0.5;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2000 + Math.random() * 3000, t);
        gain.gain.setValueAtTime(volume * Math.random(), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.02);
      }
    };

    // Play a sequence of fireworks
    createBoom(now, 0.4);
    createCrackle(now + 0.1, 0.15);
    
    createBoom(now + 0.4, 0.3);
    createCrackle(now + 0.5, 0.1);
    
    createBoom(now + 0.8, 0.5);
    createCrackle(now + 0.9, 0.2);
  };

  const playTadaSound = () => {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C-E-G-C
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.1, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.5);
    });
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      setIsMuted(false);
    } else {
      audioRef.current.pause();
      setIsMuted(true);
    }
  };

  const handleSpinStart = () => {
    setGameState(GameState.SPINNING);
    setWinner(null);
  };

  const handleSpinEnd = (result: Denomination) => {
    setWinner(result);
    setGameState(GameState.WINNING);
    
    // Save to history
    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      label: result.label,
      timestamp: Date.now()
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 20));

    // Celebration
    if (!isMuted) {
      playTadaSound();
      playFireworksSound();
    }
    
    Confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FF0000', '#FFFFFF']
    });
  };

  const resetGame = () => {
    setGameState(GameState.IDLE);
    setWinner(null);
  };

  return (
    <div className="min-h-screen bg-red-950 text-white relative overflow-hidden flex flex-col items-center">
      {/* Decorative Background Patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none z-0">
         <div className="absolute top-0 left-0 w-64 h-64 bg-[url('https://www.transparenttextures.com/patterns/chinese-lanterns.png')]"></div>
         <div className="absolute bottom-0 right-0 w-64 h-64 bg-[url('https://www.transparenttextures.com/patterns/chinese-lanterns.png')]"></div>
      </div>

      {/* Floating Music Control */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={toggleMusic}
          className={`group relative p-3 rounded-full border-2 transition-all duration-300 shadow-2xl ${isMuted ? 'bg-red-900/80 border-red-500 text-red-500' : 'bg-yellow-500 border-yellow-400 text-red-900 animate-pulse-slow'}`}
        >
          {isMuted ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
          )}
        </button>
      </div>

      {/* Result Modal Overlay */}
      {gameState === GameState.WINNING && winner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-red-950/70 animate-overlay-fade">
          <div className="relative w-full max-w-md animate-modal-zoom">
            <div className="absolute -inset-10 bg-yellow-400/20 rounded-full blur-[100px] animate-pulse"></div>
            
            <div className="relative bg-red-600 rounded-[3rem] border-8 border-yellow-400 shadow-[0_25px_60px_rgba(250,204,21,0.5)] overflow-hidden flex flex-col items-center">
              {/* Top part of envelope */}
              <div className="w-full h-24 bg-red-700 border-b-4 border-yellow-500 shadow-md flex items-center justify-center relative">
                <div className="w-16 h-16 rounded-full border-4 border-yellow-400 bg-red-800 flex items-center justify-center text-yellow-400 font-festive text-3xl animate-bounce">Phúc</div>
                <div className="absolute top-2 left-6 text-yellow-500/30 w-10 h-10 animate-swing-slow"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C10.34 2 9 3.34 9 5H15C15 3.34 13.66 2 12 2M17 6H7C5.9 6 5 6.9 5 8V14C5 15.1 5.9 16 7 16H8V18H10V16H14V18H16V16H17C18.1 16 19 15.1 19 14V8C19 6.9 18.1 6 17 6Z"/></svg></div>
                <div className="absolute top-2 right-6 text-yellow-500/30 w-10 h-10 animate-swing-slow-reverse"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C10.34 2 9 3.34 9 5H15C15 3.34 13.66 2 12 2M17 6H7C5.9 6 5 6.9 5 8V14C5 15.1 5.9 16 7 16H8V18H10V16H14V18H16V16H17C18.1 16 19 15.1 19 14V8C19 6.9 18.1 6 17 6Z"/></svg></div>
              </div>

              {/* Main Content */}
              <div className="p-10 pt-6 pb-12 flex flex-col items-center text-center w-full">
                <h2 className="text-yellow-400 font-black text-2xl uppercase tracking-[0.3em] drop-shadow-lg mb-8">LÌ XÌ MAY MẮN</h2>
                
                <div className="relative mb-10 group">
                  <div className="absolute -inset-6 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 p-2 rounded-[2.5rem] shadow-2xl transform hover:scale-105 transition duration-500">
                    <div className="bg-red-900 py-8 px-10 rounded-[2.2rem] border-4 border-yellow-100 flex flex-col items-center">
                      <span className="text-white text-5xl sm:text-7xl font-black drop-shadow-[0_5px_0_rgba(0,0,0,0.3)]">{winner.label}</span>
                    </div>
                  </div>
                </div>

                <p className="text-red-100 text-lg font-medium italic opacity-90 mb-8 leading-relaxed">
                  "Năm mới tài lộc dồi dào,<br/>Vạn sự như ý, lộc vào đầy tay!"
                </p>

                <button 
                  onClick={resetGame}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-red-950 font-black py-5 rounded-2xl shadow-[0_10px_0_#ca8a04] hover:shadow-[0_8px_0_#ca8a04] active:shadow-none active:translate-y-[8px] transition-all text-2xl uppercase tracking-tighter"
                >
                  NHẬN LÌ XÌ
                </button>
              </div>

              {/* Bottom detail */}
              <div className="w-full h-4 bg-red-700 opacity-50"></div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 w-full max-w-4xl px-6 pt-10 text-center flex flex-col items-center gap-2">
        <h1 className="text-5xl md:text-7xl font-festive text-yellow-400 drop-shadow-lg mb-2">Lì Xì Đại Cát</h1>
        <p className="text-red-200 text-lg md:text-xl font-medium">Xuân Bính Ngọ 2026 - Chúc Mừng Năm Mới</p>

        <div className="mt-8 flex bg-red-900/50 p-1 rounded-full border border-yellow-500/30 backdrop-blur-md">
          <button 
            onClick={() => { setMode(SelectionMode.WHEEL); resetGame(); }}
            className={`px-8 py-2.5 rounded-full font-bold transition-all ${mode === SelectionMode.WHEEL ? 'bg-yellow-500 text-red-950 shadow-lg' : 'text-yellow-500/60 hover:text-yellow-400'}`}
          >Vòng Quay</button>
          <button 
            onClick={() => { setMode(SelectionMode.ENVELOPES); resetGame(); }}
            className={`px-8 py-2.5 rounded-full font-bold transition-all ${mode === SelectionMode.ENVELOPES ? 'bg-yellow-500 text-red-950 shadow-lg' : 'text-yellow-500/60 hover:text-yellow-400'}`}
          >Bốc Thăm</button>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-4xl px-4 py-8 flex flex-col items-center justify-center flex-1">
        <div className="w-full flex flex-col items-center gap-8 mb-12">
          {mode === SelectionMode.WHEEL ? (
            <div className={`relative transition-all duration-500 ${gameState === GameState.WINNING ? 'blur-sm scale-90' : ''}`}>
              <div className="absolute -inset-4 bg-yellow-400/10 rounded-full blur-3xl"></div>
              <Wheel items={items} onSpinStart={handleSpinStart} onSpinEnd={handleSpinEnd} gameState={gameState} />
            </div>
          ) : (
            <LuckyEnvelopes items={items} onSelectStart={handleSpinStart} onSelectEnd={handleSpinEnd} gameState={gameState} winner={winner} onReset={resetGame} />
          )}
        </div>

        {gameState === GameState.IDLE && (
          <div className="w-full max-w-xs mb-12">
             <button 
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/10 transition backdrop-blur-md shadow-lg group text-yellow-100 font-semibold"
             >
               <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
               Cài đặt tỷ lệ & mệnh giá
             </button>
          </div>
        )}
      </main>

      <div className="relative z-10 w-full max-w-6xl px-4 mb-8">
        <HistoryList history={history} />
      </div>

      {showSettings && (
        <SettingsPanel items={items} onSave={(newItems) => { setItems(newItems); setShowSettings(false); }} onClose={() => setShowSettings(false)} />
      )}

      <footer className="relative z-10 py-6 text-red-300/40 text-sm">© 2026 Lì Xì Đại Cát</footer>

      <style>{`
        @keyframes overlay-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-zoom { 
          0% { transform: scale(0.6) translateY(50px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes swing-slow { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
        .animate-overlay-fade { animation: overlay-fade 0.4s ease-out forwards; }
        .animate-modal-zoom { animation: modal-zoom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-swing-slow { animation: swing-slow 3s ease-in-out infinite; transform-origin: top center; }
        .animate-swing-slow-reverse { animation: swing-slow 3s ease-in-out infinite reverse; transform-origin: top center; }
        @keyframes pulse-slow { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.5); } 50% { transform: scale(1.1); box-shadow: 0 0 0 12px rgba(250, 204, 21, 0); } }
        .animate-pulse-slow { animation: pulse-slow 2.5s infinite; }
      `}</style>
    </div>
  );
};

export default App;
