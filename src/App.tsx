import { useState } from 'react';
import CoinThrower from './components/CoinThrower';
import { Trigram, calculateFromCoinResults, getGuaNumber, getGuaName, getEnglishGuaData, getFullGuaText } from './utils/guaData';

function App() {
  const [trigrams, setTrigrams] = useState<Trigram[]>([]);
  const [isThrowing, setIsThrowing] = useState(false);
  const [canThrow, setCanThrow] = useState(true);
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const [lang, setLang] = useState<'cn' | 'en'>('en');
  
  // 铜钱角度状态
  const coinRotationX = -0.7854;
  const coinRotationY = 1.4312;
  const coinRotationZ = 0.9250;

  const handleStartThrow = () => {
    if (trigrams.length >= 6 || isThrowing || !canThrow) return;
    setCanThrow(false);
    setIsThrowing(true);
  };

  const handleThrowComplete = (coinResults: boolean[]) => {
    const result = calculateFromCoinResults(coinResults);
    const newTrigram: Trigram = {
      value: result.result,
      yinYang: result.yinYang,
      changing: result.changing,
    };

    setTrigrams(prev => [...prev, newTrigram]);
    setIsThrowing(false);

    setTimeout(() => {
      setCanThrow(true);
    }, 500);
  };

  const handleReset = () => {
    setTrigrams([]);
    setCanThrow(true);
    setIsThrowing(false);
    setResetViewSignal(prev => prev + 1);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景图片 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}background.webp)` }}
      />

      {/* 3D场景 */}
      <div className="absolute inset-0">
        <CoinThrower 
          onThrowComplete={handleThrowComplete} 
          isThrowing={isThrowing}
          coinRotationX={coinRotationX}
          coinRotationY={coinRotationY}
          coinRotationZ={coinRotationZ}
          resetViewSignal={resetViewSignal}
        />
      </div>

      {/* 控制按钮 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
        <button
          onClick={handleReset}
          disabled={trigrams.length === 0}
          className="px-6 py-3 bg-white/90 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black border-2 border-black font-medium transition-all"
        >
          Reset
        </button>
        <button
          onClick={handleStartThrow}
          disabled={!canThrow || isThrowing || trigrams.length >= 6}
          className="px-10 py-4 bg-white/90 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black border-2 border-black font-bold text-xl transition-all"
        >
          {isThrowing ? 'Casting...' : trigrams.length >= 6 ? 'Done' : 'Cast'}
        </button>
      </div>

      {/* 爻记录 - 始终显示 */}
      <div className="absolute top-8 right-8 bg-white/90 p-5 border-2 border-black z-10 w-[280px] max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="text-black text-sm font-bold mb-3 text-center">
          {trigrams.length < 6 ? `Cast: ${trigrams.length}/6` : 'Complete'}
        </div>
        
        <div className="space-y-1.5">
          {/* 预置6个爻位，从下往上显示，第1爻在最下面 */}
          {[5, 4, 3, 2, 1, 0].map((pos) => {
            const trigram = trigrams[pos];
            return (
              <div key={pos} className="relative flex justify-center items-center">
                {/* 变爻标记放在左边 */}
                <div className="absolute left-2 w-6 h-6 flex items-center justify-center z-10">
                  {trigram?.changing && (
                    <span className="text-black font-bold text-sm leading-none">
                      {trigram.yinYang === 'yang' ? '○' : '×'}
                    </span>
                  )}
                </div>
                {/* 阴阳爻：实线阳，虚线阴，黑色方形线，单独居中 */}
                <div className="flex items-center">
                  {trigram ? (
                    trigram.yinYang === 'yang' ? (
                      <div className="w-[48px] h-2 bg-black"></div>
                    ) : (
                      <div className="flex gap-0.5">
                        <div className="w-[23px] h-2 bg-black"></div>
                        <div className="w-[23px] h-2 bg-black"></div>
                      </div>
                    )
                  ) : (
                    <div className="w-[48px] h-2 bg-gray-200"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 卦名 + 中英切换 */}
        {trigrams.length === 6 && (() => {
          const en = getEnglishGuaData(trigrams);
          const full = getFullGuaText(trigrams);
          return (
            <div className="mt-4 pt-3 border-t-2 border-black">
              <div className="flex items-center justify-between mb-1">
                <div className="text-black text-xs">Hexagram #{getGuaNumber(trigrams)}</div>
                <button
                  onClick={() => setLang(lang === 'cn' ? 'en' : 'cn')}
                  className="text-[10px] px-1.5 py-0.5 border border-black text-black hover:bg-black hover:text-white transition-colors leading-none"
                >
                  {lang === 'cn' ? '中文' : 'EN'}
                </button>
              </div>
              <div className="text-black text-lg font-bold mb-2">
                {lang === 'cn' ? getGuaName(trigrams) : en?.enName}
              </div>
              {full && (
                <div className="text-black text-[11px] leading-relaxed whitespace-pre-line">
                  {lang === 'cn' ? full.cn : full.en}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default App;
