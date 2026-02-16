
import React from 'react';
import { HistoryEntry } from '../types';

interface HistoryListProps {
  history: HistoryEntry[];
}

const HistoryList: React.FC<HistoryListProps> = ({ history }) => {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col md:flex-row items-center gap-4 w-full">
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-bold text-yellow-200 whitespace-nowrap">Lịch sử Lì Xì</h3>
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-3 pb-2 scrollbar-hide w-full">
        {history.length === 0 ? (
          <div className="text-red-200/40 italic text-sm py-2 ml-4">
            Chưa có lượt nhận nào...
          </div>
        ) : (
          history.map((entry) => (
            <div 
              key={entry.id} 
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/5 animate-slide-in whitespace-nowrap group hover:bg-white/20 transition-colors shadow-sm"
            >
              <span className="font-bold text-yellow-100">{entry.label}</span>
              <span className="text-[10px] text-red-300 opacity-60">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default HistoryList;
