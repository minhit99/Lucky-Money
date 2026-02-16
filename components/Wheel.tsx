
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Denomination, GameState } from '../types';

interface WheelProps {
  items: Denomination[];
  onSpinStart: () => void;
  onSpinEnd: (result: Denomination) => void;
  gameState: GameState;
}

const Wheel: React.FC<WheelProps> = ({ items, onSpinStart, onSpinEnd, gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const [isRotating, setIsRotating] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSegmentRef = useRef<number>(-1);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTickSound = (vol: number = 0.05) => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = size / 2 - 15;
    
    ctx.clearRect(0, 0, size, size);
    
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let currentAngle = rotationRef.current;

    // Outer Glow/Border
    ctx.beginPath();
    ctx.arc(center, center, radius + 10, 0, Math.PI * 2);
    ctx.fillStyle = '#facc15'; // yellow-400
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 4;
    ctx.stroke();

    items.forEach((item, index) => {
      const sliceAngle = (item.weight / totalWeight) * (Math.PI * 2);
      
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, currentAngle, currentAngle + sliceAngle);
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(currentAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Montserrat';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.fillText(item.label, radius - 40, 8);
      ctx.restore();

      currentAngle += sliceAngle;
    });

    // Center Hub Decorative Circle
    ctx.beginPath();
    ctx.arc(center, center, 35, 0, Math.PI * 2);
    ctx.fillStyle = '#facc15';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Hub Center
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#7f1d1d';
    ctx.fill();
    
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 18px Dancing Script';
    ctx.textAlign = 'center';
    ctx.fillText('Lì Xì', center, center + 7);
  }, [items]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const spin = () => {
    if (isRotating || gameState === GameState.SPINNING) return;
    
    onSpinStart();
    setIsRotating(true);
    lastSegmentRef.current = -1;

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const random = Math.random() * totalWeight;
    
    let cumulativeWeight = 0;
    let winnerIndex = 0;
    for (let i = 0; i < items.length; i++) {
      cumulativeWeight += items[i].weight;
      if (random <= cumulativeWeight) {
        winnerIndex = i;
        break;
      }
    }

    const winner = items[winnerIndex];
    
    let startAngleSum = 0;
    for (let i = 0; i < winnerIndex; i++) {
      startAngleSum += (items[i].weight / totalWeight) * (Math.PI * 2);
    }
    const segmentWidth = (winner.weight / totalWeight) * (Math.PI * 2);
    const targetAngle = startAngleSum + segmentWidth / 2;
    
    // Increased extra spins (8 to 14 rounds) for longer duration feel
    const extraSpins = 8 + Math.floor(Math.random() * 6);
    const currentRotation = rotationRef.current;
    const finalRotation = currentRotation + (extraSpins * Math.PI * 2) + (1.5 * Math.PI - targetAngle - (currentRotation % (Math.PI * 2)));

    const startTime = performance.now();
    // Increased duration to 7000ms (7 seconds)
    const duration = 7000;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Quintic ease-out for a more dramatic slow-down at the end
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 5);
      
      rotationRef.current = currentRotation + (finalRotation - currentRotation) * easeOut(progress);
      
      const normalizedRotation = (rotationRef.current % (Math.PI * 2));
      let pointerRelativeAngle = (1.5 * Math.PI - normalizedRotation);
      while (pointerRelativeAngle < 0) pointerRelativeAngle += Math.PI * 2;
      pointerRelativeAngle %= (Math.PI * 2);

      let currentSegIndex = 0;
      let angleCheck = 0;
      for (let i = 0; i < items.length; i++) {
        const segWidth = (items[i].weight / totalWeight) * (Math.PI * 2);
        if (pointerRelativeAngle >= angleCheck && pointerRelativeAngle < angleCheck + segWidth) {
          currentSegIndex = i;
          break;
        }
        angleCheck += segWidth;
      }

      if (currentSegIndex !== lastSegmentRef.current) {
        lastSegmentRef.current = currentSegIndex;
        // Adjust volume based on progress to match the slow-down
        playTickSound(Math.max(0.01, 0.05 * (1 - progress * 0.8)));
      }

      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsRotating(false);
        onSpinEnd(winner);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Pointer Container */}
      <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 z-20 w-16 h-16 drop-shadow-xl animate-bounce-subtle">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21L12 16M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM12 16L12 21Z" stroke="#facc15" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 2L12 8" stroke="#facc15" strokeWidth="3" strokeLinecap="round"/>
          <path d="M12 2L8 6" stroke="#facc15" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 2L16 6" stroke="#facc15" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      
      <canvas 
        ref={canvasRef} 
        width={480} 
        height={480} 
        className="max-w-full h-auto cursor-pointer drop-shadow-2xl transition-transform hover:scale-[1.01]"
        onClick={spin}
      />
      
      <button 
        onClick={spin}
        disabled={isRotating}
        className={`mt-10 bg-yellow-400 hover:bg-yellow-300 text-red-950 font-black text-2xl py-5 px-16 rounded-full shadow-[0_8px_0_#ca8a04] hover:shadow-[0_6px_0_#ca8a04] active:shadow-none active:translate-y-[6px] transition-all ${isRotating ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105'}`}
      >
        {isRotating ? 'ĐANG QUAY...' : 'QUAY NGAY'}
      </button>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Wheel;
