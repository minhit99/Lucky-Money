
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface FortuneTellerProps {
  winningAmount?: string;
}

const FALLBACK_FORTUNES = [
  "Năm mới vạn sự như ý, tỷ sự như mơ, làm ăn phát đạt!",
  "Chúc bạn năm mới sức khỏe dồi dào, gia đình hạnh phúc, công danh rạng rỡ.",
  "Tiền vào như nước sông Đà, tiền ra nhỏ giọt như cà phê phin.",
  "Cung chúc tân xuân, phước lộc thọ toàn, an khang thịnh vượng.",
  "Chúc mừng năm mới, mã đáo thành công, vạn sự hanh thông.",
  "Năm mới lộc lá đầy nhà, niềm vui phơi phới, tiếng cười rộn vang.",
  "Chúc bạn tấn tài tấn lộc, công thành danh toại, ngũ phúc lâm môn.",
  "Xuân này hơn hẳn mấy xuân qua, phúc lộc đưa nhau đến từng nhà."
];

const FortuneTeller: React.FC<FortuneTellerProps> = ({ winningAmount }) => {
  const [fortune, setFortune] = useState<string>("Bấm quay để xem quẻ may mắn cho năm nay!");
  const [loading, setLoading] = useState(false);

  const generateFortune = async (amount: string) => {
    setLoading(true);
    try {
      // Use a local random fallback immediately if the API key is likely to fail 
      // or to have some content ready. But here we try the API first.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Bạn là thầy đồ xem bói Tết Bính Ngọ 2026. Một người vừa quay trúng lì xì mệnh giá ${amount}. 
      Hãy đưa ra một lời chúc Tết ngắn gọn, vần điệu, hài hước và mang lại may mắn (không quá 3 câu). 
      Sử dụng ngôn ngữ truyền thống Việt Nam pha chút hiện đại.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = response.text;
      if (text) {
        setFortune(text.trim());
      } else {
        throw new Error("Empty response");
      }
    } catch (error: any) {
      console.error("Fortune API Error:", error);
      
      // If we hit a 429 (Resource Exhausted) or any other error, 
      // we provide a high-quality pre-written fortune so the user experience is preserved.
      const randomIndex = Math.floor(Math.random() * FALLBACK_FORTUNES.length);
      const randomFallback = FALLBACK_FORTUNES[randomIndex];
      
      // Personalize the fallback slightly with the winning amount if possible
      setFortune(`${amount}: ${randomFallback}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (winningAmount) {
      generateFortune(winningAmount);
    }
  }, [winningAmount]);

  return (
    <div className="bg-gradient-to-br from-red-800 to-red-900 rounded-2xl border-2 border-yellow-500/50 p-6 relative overflow-hidden group shadow-xl">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform pointer-events-none">
        <svg className="w-20 h-20 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      </div>

      <div className="relative z-10">
        <h4 className="text-yellow-400 font-festive text-2xl mb-4">Gieo Quẻ Đầu Năm</h4>
        
        <div className={`text-red-100 italic leading-relaxed min-h-[80px] flex items-center transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-.15s]"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
              <span className="text-sm">Đang giải quẻ...</span>
            </div>
          ) : (
            `"${fortune}"`
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-yellow-500/20 text-[10px] text-red-300 uppercase tracking-widest font-bold">
        Thầy Đồ AI Phán
      </div>
    </div>
  );
};

export default FortuneTeller;
