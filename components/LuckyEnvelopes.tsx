
import React, { useState, useEffect, useRef } from 'react';
import { Denomination, GameState } from '../types';

interface LuckyEnvelopesProps {
  items: Denomination[];
  onSelectStart: () => void;
  onSelectEnd: (result: Denomination) => void;
  gameState: GameState;
  winner: Denomination | null;
  onReset: () => void;
}

const LUCKY_WORDS = ['Tâm', 'Phúc', 'Trí', 'Tài', 'Lộc', 'Bình an'];

const generateDistributedLabels = () => {
  // Ensure all unique words appear at least once
  const labels = [...LUCKY_WORDS];
  
  // Fill the remaining slots (8 total - 6 unique = 2 extra) with random words from the list
  // Note: Assuming grid size is 8 based on rendering logic
  while (labels.length < 8) {
    labels.push(LUCKY_WORDS[Math.floor(Math.random() * LUCKY_WORDS.length)]);
  }
  
  // Shuffle the array using Fisher-Yates algorithm
  for (let i = labels.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  
  return labels;
};

const LuckyEnvelopes: React.FC<LuckyEnvelopesProps> = ({ items, onSelectStart, onSelectEnd, gameState, winner, onReset }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  // Initialize with distributed random words
  const [envelopeLabels, setEnvelopeLabels] = useState<string[]>(() => generateDistributedLabels());
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playPopSound = () => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const playShuffleSound = () => {
    const ctx = getAudioCtx();
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  };

  useEffect(() => {
    if (gameState === GameState.IDLE) {
      setSelectedIndex(null);
      setIsShuffling(true);
      playShuffleSound();
      
      // Shuffle words when game resets with distribution logic
      setEnvelopeLabels(generateDistributedLabels());

      const timer = setTimeout(() => setIsShuffling(false), 800);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const handleSelect = (index: number) => {
    if (gameState !== GameState.IDLE || isShuffling) return;
    playPopSound();
    setSelectedIndex(index);
    onSelectStart();
    
    // Weighted random logic
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    let chosenWinner: Denomination = items[0];
    for (let i = 0; i < items.length; i++) {
      cumulativeWeight += items[i].weight;
      if (random <= cumulativeWeight) {
        chosenWinner = items[i];
        break;
      }
    }
    
    // Reveal after 2000ms delay to create anticipation (shake + flip time)
    setTimeout(() => {
      onSelectEnd(chosenWinner);
    }, 2000);
  };

  const envelopes = Array.from({ length: 8 });

  return (
    <div className="relative w-full max-w-lg mx-auto py-8">
      {/* Grid of Envelopes */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-6 transition-all duration-700 ${gameState === GameState.WINNING ? 'blur-md grayscale opacity-40 scale-90' : ''}`}>
        {envelopes.map((_, idx) => {
          const isSelected = selectedIndex === idx;
          const isOpening = isSelected && gameState === GameState.SPINNING;
          const isWon = isSelected && gameState === GameState.WINNING;
          const label = envelopeLabels[idx];
          // Use smaller font for longer words like "Bình an"
          const fontSizeClass = label.length > 4 ? 'text-sm' : 'text-2xl';

          return (
            <div
              key={idx}
              className={`relative aspect-[2/3] group perspective-1000 transition-all duration-700
                ${isSelected ? 'z-30' : (selectedIndex !== null ? 'opacity-20 grayscale blur-[4px] scale-90' : 'opacity-100 grayscale-0 scale-100')}
                ${isShuffling ? 'animate-re-deal' : ''}`}
              style={{ 
                animationDelay: isShuffling ? `${idx * 0.05}s` : '0s', 
                zIndex: isSelected ? 30 : 10,
                transform: isOpening ? 'translateY(-20px) scale(1.15)' : 'none'
              }}
            >
              <div
                onClick={() => handleSelect(idx)}
                className={`w-full h-full relative transition-all duration-500 preserve-3d
                  ${gameState === GameState.IDLE && !isShuffling ? 'hover:-translate-y-3 hover:scale-105 cursor-pointer active:scale-95' : 'cursor-default'}
                  ${isWon ? '[transform:rotateY(180deg)]' : ''}
                `}
              >
                {/* FLOURISH EFFECT (visible during opening/won state) */}
                {isSelected && (
                  <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${isWon ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,_#facc1533_0%,_transparent_70%)] animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] animate-spin-slow">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-t from-transparent via-yellow-400/20 to-transparent" style={{ transform: `translateX(-50%) rotate(${i * 45}deg)` }}></div>
                      ))}
                    </div>
                  </div>
                )}

                {/* THE CARD ITSELF */}
                <div className={`w-full h-full relative preserve-3d transition-transform duration-1000 ${isOpening ? 'animate-subtle-shake' : ''}`}>
                  
                  {/* FRONT FACE */}
                  <div className="absolute inset-0 backface-hidden bg-red-600 rounded-2xl border-2 border-yellow-500 shadow-2xl flex flex-col items-center justify-center p-2 overflow-hidden z-10">
                    <div className="absolute inset-1 border border-yellow-500/20 rounded-xl pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/30"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/30"></div>
                    
                    <div className={`w-12 h-12 rounded-full border-2 border-yellow-400 flex items-center justify-center text-yellow-400 font-festive ${fontSizeClass} bg-red-700 shadow-inner transition-all duration-300
                      ${gameState === GameState.IDLE && !isShuffling ? 'group-hover:rotate-[360deg] group-hover:scale-110' : ''}`}>
                      {label}
                    </div>
                    
                    <div className="mt-4 text-[10px] text-yellow-300 font-bold tracking-[0.2em] uppercase text-center opacity-80">Lì Xì Tết</div>
                    
                    <div className="absolute top-0 left-0 right-0 h-1/4 bg-red-700/80 rounded-t-2xl border-b border-yellow-500 flex items-end justify-center pb-2">
                       <div className="w-6 h-1 bg-yellow-500/40 rounded-full"></div>
                    </div>
                  </div>

                  {/* BACK FACE (REVEAL) */}
                  <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-white rounded-2xl border-2 border-yellow-500 shadow-2xl flex flex-col items-center justify-center p-2 overflow-hidden z-20">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#fff_0%,_#fef3c7_100%)] opacity-50"></div>
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                     
                     <div className="relative z-10 flex flex-col items-center">
                        <div className="text-[8px] text-red-800 font-black uppercase tracking-tighter mb-1 opacity-40">Ngân Hàng Tài Lộc</div>
                        <div className="bg-red-50 border border-yellow-500/30 rounded-lg py-2 px-3 shadow-inner">
                           <div className="text-xl font-black text-red-600 animate-reveal-text drop-shadow-sm">
                             {winner?.label || '...'}
                           </div>
                        </div>
                        <div className="mt-2 w-8 h-[1px] bg-yellow-500/30"></div>
                     </div>

                     {/* Scratch shine effect */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-shine-fast pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }

        @keyframes subtle-shake { 
          0%, 100% { transform: translateX(0) rotate(0deg); } 
          20% { transform: translateX(-4px) rotate(-2deg); } 
          40% { transform: translateX(4px) rotate(2deg); } 
          60% { transform: translateX(-4px) rotate(-1deg); } 
          80% { transform: translateX(4px) rotate(1deg); } 
        }
        .animate-subtle-shake { animation: subtle-shake 0.1s linear infinite; }
        
        @keyframes re-deal { 
          0% { transform: scale(1) translate(0, 0); opacity: 1; filter: blur(0); } 
          30% { transform: scale(0.5) translate(0, 50px); opacity: 0; filter: blur(8px); } 
          60% { transform: scale(1.1) translate(0, -20px); opacity: 0.8; filter: blur(2px); } 
          100% { transform: scale(1) translate(0, 0); opacity: 1; filter: blur(0); } 
        }
        .animate-re-deal { animation: re-deal 0.8s cubic-bezier(0.45, 0, 0.55, 1) forwards; }

        @keyframes shine-fast {
          0% { transform: translateX(-150%) skewX(-30deg); }
          50%, 100% { transform: translateX(150%) skewX(-30deg); }
        }
        .animate-shine-fast { animation: shine-fast 2s infinite; }

        @keyframes reveal-text {
          0% { opacity: 0; transform: scale(0.5); filter: blur(5px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .animate-reveal-text { animation: reveal-text 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LuckyEnvelopes;
