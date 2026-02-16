
import React, { useState } from 'react';
import { Denomination } from '../types';
import { FESTIVE_COLORS } from '../constants';

interface SettingsPanelProps {
  items: Denomination[];
  onSave: (items: Denomination[]) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ items, onSave, onClose }) => {
  const [localItems, setLocalItems] = useState<Denomination[]>(items);

  const addItem = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const color = FESTIVE_COLORS[localItems.length % FESTIVE_COLORS.length];
    setLocalItems([...localItems, { id: newId, label: 'Mới', value: 0, weight: 10, color }]);
  };

  const removeItem = (id: string) => {
    if (localItems.length <= 2) return alert("Phải có ít nhất 2 mệnh giá");
    setLocalItems(localItems.filter(i => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<Denomination>) => {
    setLocalItems(localItems.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const totalWeight = localItems.reduce((sum, i) => sum + i.weight, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-red-900 border-2 border-yellow-500 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl flex flex-col shadow-2xl">
        
        <div className="p-6 border-b border-yellow-500/30 flex justify-between items-center bg-red-800">
          <h2 className="text-2xl font-bold text-yellow-400">Cấu hình Vòng Quay</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-12 gap-2 text-xs font-bold text-red-200 uppercase tracking-wider mb-2">
            <div className="col-span-5">Mệnh giá</div>
            <div className="col-span-3">Trọng số</div>
            <div className="col-span-2">Tỷ lệ %</div>
            <div className="col-span-2">Xóa</div>
          </div>
          
          {localItems.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-red-800/50 p-3 rounded-xl border border-red-700">
              <div className="col-span-5 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                <input 
                  type="text"
                  value={item.label}
                  onChange={(e) => updateItem(item.id, { label: e.target.value })}
                  className="bg-red-950 border border-red-700 text-white px-3 py-1 rounded w-full focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
              <div className="col-span-3">
                <input 
                  type="number"
                  min="1"
                  value={item.weight}
                  onChange={(e) => updateItem(item.id, { weight: Number(e.target.value) || 0 })}
                  className="bg-red-950 border border-red-700 text-white px-3 py-1 rounded w-full focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
              <div className="col-span-2 text-center text-sm font-medium text-yellow-400">
                {((item.weight / totalWeight) * 100).toFixed(1)}%
              </div>
              <div className="col-span-2 flex justify-end">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-700/50 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={addItem}
            className="w-full py-3 border-2 border-dashed border-red-700 rounded-xl text-red-300 hover:bg-red-800 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Thêm mệnh giá
          </button>
        </div>

        <div className="p-6 border-t border-yellow-500/30 bg-red-800 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-red-200 hover:text-white font-semibold transition"
          >
            Hủy
          </button>
          <button 
            onClick={() => onSave(localItems)}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-red-950 py-3 rounded-xl font-bold transition shadow-lg"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
