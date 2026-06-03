import { useState } from 'react';
import CoinThrower from './components/CoinThrower';
import { Trigram, calculateFromCoinResults, getGuaName } from './utils/guaData';

function App() {
  const [trigrams, setTrigrams] = useState<Trigram[]>([]);
  const [isThrowing, setIsThrowing] = useState(false);
  const [canThrow, setCanThrow] = useState(true);
  
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
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景图片 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}background.jpg)` }}
      />

      {/* 3D场景 */}
      <div className="absolute inset-0">
        <CoinThrower 
          onThrowComplete={handleThrowComplete} 
          isThrowing={isThrowing}
          coinRotationX={coinRotationX}
          coinRotationY={coinRotationY}
          coinRotationZ={coinRotationZ}
        />
      </div>

      {/* 控制按钮 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10" style={{ fontFamily: "'Noto Serif SC', serif" }}>
        <button
          onClick={handleReset}
          disabled={trigrams.length === 0}
          className="px-6 py-3 bg-white/90 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black border-2 border-black font-medium transition-all"
        >
          重置
        </button>
        <button
          onClick={handleStartThrow}
          disabled={!canThrow || isThrowing || trigrams.length >= 6}
          className="px-10 py-4 bg-white/90 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black border-2 border-black font-bold text-xl transition-all"
        >
          {isThrowing ? '摇动中...' : trigrams.length >= 6 ? '已完成' : '起卦'}
        </button>
      </div>

      {/* 爻记录 - 始终显示 */}
      <div className="absolute top-8 right-8 bg-white/90 p-5 border-2 border-black z-10 w-[240px]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
        <div className="text-black text-sm font-bold mb-3 text-center">
          {trigrams.length < 6 ? `已起: ${trigrams.length}/6` : '起卦完成'}
        </div>
        
        <div className="space-y-1">
          {/* 预置6个爻位，从下往上显示，第1爻在最下面 */}
          {[5, 4, 3, 2, 1, 0].map((pos) => {
            const trigram = trigrams[pos];
            return (
              <div key={pos} className="relative flex justify-center items-center">
                {/* 变爻标记放在左边 */}
                <div className="absolute left-2 w-6 h-6 flex items-center justify-center z-10">
                  {trigram?.changing && (
                    <span className="text-black font-bold text-xl">
                      {trigram.yinYang === 'yang' ? '○' : '×'}
                    </span>
                  )}
                </div>
                {/* 阴阳爻：实线阳，虚线阴，黑色方形线，单独居中 */}
                <div className="flex items-center">
                  {trigram ? (
                    trigram.yinYang === 'yang' ? (
                      <div className="w-24 h-2 bg-black"></div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="w-11 h-2 bg-black"></div>
                        <div className="w-11 h-2 bg-black"></div>
                      </div>
                    )
                  ) : (
                    <div className="w-24 h-2 bg-gray-200"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 卦名 */}
        <div className="mt-4 pt-3 border-t-2 border-black text-center">
          <div className="text-black text-xs mb-1">本卦</div>
          <div className="text-black text-xl font-bold">
            {trigrams.length === 6 ? getGuaName(trigrams) : '　'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
