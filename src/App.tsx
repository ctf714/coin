import { useState, useMemo, useEffect } from 'react';
import CoinThrower from './components/CoinThrower';
import { Trigram, calculateFromCoinResults, getGuaNumber, getGuaName, getEnglishGuaData, getFullGuaText, getChangedTrigrams, getChangingLineIndices, boldChangingLines } from './utils/guaData';
import { useDeviceDetect } from './useDeviceDetect';

const LABELS = {
  original:   { cn: '本卦', en: 'Original' },
  changed:    { cn: '变卦', en: 'Changed' },
  noChange:   { cn: '无变爻', en: 'No changing lines' },
  cast:       { cn: '起卦', en: 'Cast' },
  casting:    { cn: '掷币中…', en: 'Casting…' },
  done:       { cn: '完成', en: 'Done' },
  loading:    { cn: '加载中…', en: 'Loading…' },
  reset:      { cn: '重置', en: 'Reset' },
  complete:   { cn: '完成', en: 'Complete' },
} as const;

// 卦象线条组件 — 始终保留箭头列占位，避免变卦出现时布局跳动
const GuaLines: React.FC<{
  trigrams: Trigram[];
  changedTrigrams?: Trigram[] | null;
  arrowVisible?: boolean;
  isMobile?: boolean;
}> = ({ trigrams, changedTrigrams, arrowVisible, isMobile }) => {
  const m = isMobile;
  return (
  <div className={m ? 'space-y-2' : 'space-y-2.5'}>
    {[5, 4, 3, 2, 1, 0].map((pos) => {
      const t = trigrams[pos];
      const ct = changedTrigrams?.[pos];
      const hasArrow = !!changedTrigrams && arrowVisible !== false;
      const yangW = m ? 'w-14' : 'w-20';
      const yangH = m ? 'h-2' : 'h-2.5';
      const yinW = m ? 'w-[27px]' : 'w-[39px]';
      const yinH = m ? 'h-2' : 'h-2.5';
      const markW = m ? 'w-4' : 'w-5';
      const markS = m ? 'text-xs' : 'text-sm';
      const gapS = m ? 'gap-0.5' : 'gap-1';
      const mlS = m ? 'ml-1' : 'ml-2';
      const arrW = m ? 'w-[10px]' : 'w-[14px]';
      const arrS = m ? 'text-xs' : 'text-sm';
      return (
        <div key={pos} className={`flex items-center ${gapS}`}>
          {/* 变爻标记 */}
          {t?.changing ? (
            <span className={`text-black font-bold ${markS} ${markW} text-center leading-none shrink-0`}>
              {t.yinYang === 'yang' ? '○' : '×'}
            </span>
          ) : (
            <span className={`${markW} shrink-0`} />
          )}
          {/* 本卦爻 */}
          {t ? (
            t.yinYang === 'yang' ? (
              <div className={`${yangW} ${yangH} bg-black`} />
            ) : (
              <div className="flex gap-0.5">
                <div className={`${yinW} ${yinH} bg-black`} />
                <div className={`${yinW} ${yinH} bg-black`} />
              </div>
            )
          ) : (
            <div className={`${yangW} ${yangH} bg-gray-200`} />
          )}
          {/* 箭头+变卦爻 — 始终占位，transition opacity */}
          <div
            className={`flex items-center ${gapS} ${mlS} transition-opacity duration-1000 ${hasArrow ? 'opacity-60' : 'opacity-0'}`}
          >
            <span className={`${arrS} ${arrW} text-center shrink-0`}>→</span>
            {ct ? (
              ct.yinYang === 'yang' ? (
                <div className={`${yangW} ${yangH} bg-black`} />
              ) : (
                <div className="flex gap-0.5">
                  <div className={`${yinW} ${yinH} bg-black`} />
                  <div className={`${yinW} ${yinH} bg-black`} />
                </div>
              )
            ) : (
              <div className={`${yangW} ${yangH}`} />
            )}
          </div>
        </div>
      );
    })}
  </div>
);
};

// 卦文本组件
const GuaText: React.FC<{
  trigrams: Trigram[];
  lang: 'cn' | 'en';
  guaType?: 'original' | 'changed';
  boldIndices?: number[];
  isMobile?: boolean;
}> = ({ trigrams, lang, guaType, boldIndices, isMobile }) => {
  const en = getEnglishGuaData(trigrams);
  const full = getFullGuaText(trigrams);
  const name = lang === 'cn' ? getGuaName(trigrams) : en?.enName || '';
  const num = getGuaNumber(trigrams);
  const rawText = full ? (lang === 'cn' ? full.cn : full.en) : '';

  const html = useMemo(() => {
    if (!rawText || !boldIndices?.length) return rawText;
    return boldChangingLines(rawText, boldIndices, lang);
  }, [rawText, boldIndices, lang]);

  const prefixLabel = guaType
    ? (lang === 'cn'
      ? (guaType === 'original' ? '本卦' : '变卦')
      : (guaType === 'original' ? 'Original' : 'Changed'))
    : '';

  const m = isMobile;
  return (
    <div>
      <div className={`text-black mb-0.5 ${m ? 'text-xs' : 'text-sm'}`}>
        {prefixLabel && <span className="font-bold mr-1">{prefixLabel}</span>}
        #{num}
      </div>
      <div className={`text-black font-bold ${m ? 'text-base mb-1' : 'text-lg mb-1.5'}`}>{name}</div>
      <div
        className={`text-black leading-relaxed whitespace-pre-line ${m ? 'text-xs' : 'text-sm'}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

function App() {
  const { isMobile } = useDeviceDetect();
  const m = isMobile;

  const [trigrams, setTrigrams] = useState<Trigram[]>([]);
  const [isThrowing, setIsThrowing] = useState(false);
  const [canThrow, setCanThrow] = useState(true);
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const [lang, setLang] = useState<'cn' | 'en'>('en');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);

  useEffect(() => {
    document.body.style.overflow = (showSplash || showMeditation || showInstruction) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showSplash, showMeditation, showInstruction]);

  const handleSplashBegin = (selectedLang: 'cn' | 'en') => {
    setLang(selectedLang);
    setSplashFading(true);
    setTimeout(() => {
      setShowSplash(false);
      setSplashFading(false);
      setShowMeditation(true);
    }, 1000);
  };

  const handleMeditationStart = () => {
    setShowMeditation(false);
  };

  const coinRotationX = -0.7854;
  const coinRotationY = 1.4312;
  const coinRotationZ = 0.9250;

  const done = trigrams.length === 6;
  const changedTrigrams = done ? getChangedTrigrams(trigrams) : null;
  const changingIndices = done ? getChangingLineIndices(trigrams) : [];

  const handleStartThrow = () => {
    if (trigrams.length >= 6 || isThrowing || !canThrow) return;
    if (!drawerOpen) setDrawerOpen(true);
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
    setTimeout(() => setCanThrow(true), 500);
  };

  const handleReset = () => {
    setTrigrams([]);
    setCanThrow(true);
    setIsThrowing(false);
    setDrawerOpen(false);
    setResetViewSignal(prev => prev + 1);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}background.webp)` }}
      />

      {/* 开屏介绍 — 水墨淡开 */}
      {showSplash && (
        <div
          className={`absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm transition-all duration-1000 ${
            splashFading ? 'opacity-0 blur-sm' : 'opacity-100 blur-0'
          }`}
        >
          <div className={`text-center text-white ${m ? 'px-4' : 'px-6'}`}>
            <h1 className={m ? 'mb-6' : 'mb-8'}>
              <div className={`tracking-[0.3em] text-white/50 ${m ? 'text-xs mb-1' : 'text-base mb-2'}`}>WEN WANG GUA</div>
              <div className={`font-bold tracking-widest ${m ? 'text-3xl' : 'text-5xl'}`}>金 钱 卦</div>
              <div className={`text-white/50 ${m ? 'text-sm mt-1' : 'text-base mt-2'}`}>Money Hexagram Divination</div>
            </h1>
            <div className={`h-px bg-white/40 mx-auto ${m ? 'w-12 mb-6' : 'w-16 mb-8'}`} />
            <div className={`flex items-center justify-center ${m ? 'flex-col gap-3' : 'flex-row gap-6'}`}>
              <button
                onClick={() => handleSplashBegin('en')}
                className={`w-44 bg-white/95 text-black hover:bg-white border-none font-semibold transition-all tracking-widest ${m ? 'py-3 text-base' : 'py-3.5 text-lg'}`}
              >
                E N G L I S H
              </button>
              <button
                onClick={() => handleSplashBegin('cn')}
                className={`w-44 bg-white/95 text-black hover:bg-white border-none font-semibold transition-all tracking-widest ${m ? 'py-3 text-base' : 'py-3.5 text-lg'}`}
              >
                中  文
              </button>
            </div>
            <button
              onClick={() => setShowInstruction(true)}
              className={`text-white/80 hover:text-white border border-white/50 hover:border-white py-2 font-medium transition-all tracking-wider bg-transparent ${m ? 'mt-5 px-5 text-xs' : 'mt-6 px-6 text-sm'}`}
            >
              I N S T R U C T I O N  /  介  绍
            </button>
            {!modelLoaded && (
              <div className={`text-white/40 animate-pulse ${m ? 'text-xs mt-3' : 'text-sm mt-4'}`}>
                Loading coin model…
              </div>
            )}
          </div>
        </div>
      )}

      {/* 介绍弹窗 — PDF 展示 */}
      {showInstruction && (
        <div className={`absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm ${m ? 'p-0' : 'p-4'}`}>
          <div className={`relative bg-white/95 flex flex-col ${m ? 'w-full h-full' : 'w-[90vw] max-w-4xl h-[85vh] border-2 border-black'}`}>
            <div className={`flex items-center justify-between border-b border-black/20 shrink-0 ${m ? 'p-3' : 'p-4'}`}>
              <span className={`text-black font-bold ${m ? 'text-sm' : 'text-lg'}`}>
                {lang === 'cn' ? '金钱卦 · 中英介绍' : 'Money Hexagram · Bilingual Introduction'}
              </span>
              <button
                onClick={() => setShowInstruction(false)}
                className={`text-black/50 hover:text-black leading-none px-2 ${m ? 'text-xl' : 'text-2xl'}`}
              >
                ×
              </button>
            </div>
            <div className="flex-1">
              <iframe
                src={`${import.meta.env.BASE_URL}money_hexagram_bilingual_corrected.pdf`}
                className="w-full h-full border-0"
                title="Money Hexagram Introduction"
              />
            </div>
          </div>
        </div>
      )}

      {/* 静心页 — 水墨淡入 */}
      {showMeditation && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 transition-all duration-1000"
        >
          <div className={`text-center text-white max-w-lg ${m ? 'px-4' : 'px-6'}`}>
            <div className={`font-bold tracking-[0.3em] ${m ? 'text-lg mb-5' : 'text-xl mb-6'}`}>
              {lang === 'cn' ? '静 心 凝 神' : 'C E N T E R  ·  Y O U R  ·  M I N D'}
            </div>
            <div className={`h-px bg-white/40 mx-auto ${m ? 'w-12 mb-5' : 'w-16 mb-6'}`} />
            <p className={`leading-relaxed text-white/85 ${m ? 'text-base mb-3' : 'text-lg mb-4'}`}>
              {lang === 'cn'
                ? '专注默念所问之事约一分钟，确保意念清晰。'
                : 'Focus silently on your question for about a minute. Let your intention be clear and unwavering.'}
            </p>
            <p className={`leading-relaxed text-white/50 ${m ? 'text-sm mb-6' : 'text-base mb-8'}`}>
              {lang === 'cn'
                ? '心诚则灵，感而遂通。'
                : 'A sincere heart opens the way to insight.'}
            </p>
            <button
              onClick={handleMeditationStart}
              className={`bg-white/95 text-black hover:bg-white border-none font-semibold transition-all tracking-[0.3em] ${m ? 'px-10 py-3 text-base' : 'px-14 py-3.5 text-lg'}`}
            >
              {lang === 'cn' ? '问  卜' : 'C O N S U L T'}
            </button>
          </div>
        </div>
      )}

      {/* 3D 场景 — 桌面左移，移动端上缩 */}
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          drawerOpen
            ? m
              ? 'bottom-[42%] right-0 left-0 top-0'
              : 'md:right-1/3 bottom-0'
            : 'right-0 bottom-0'
        }`}
      >
        <CoinThrower
          onThrowComplete={handleThrowComplete}
          isThrowing={isThrowing}
          coinRotationX={coinRotationX}
          coinRotationY={coinRotationY}
          coinRotationZ={coinRotationZ}
          resetViewSignal={resetViewSignal}
          onModelLoaded={() => setModelLoaded(true)}
        />
      </div>

      {/* 按钮 — 桌面左移，移动端贴 3D 区底部 */}
      <div
        className={`absolute z-10 transition-all duration-700 ${
          m ? 'bottom-4 left-0 right-0' : 'bottom-6 left-0'
        } ${
          drawerOpen
            ? m
              ? 'right-0'
              : 'md:right-1/3 right-0'
            : 'right-0'
        }`}
      >
        <div className={`flex justify-center ${m ? 'gap-3' : 'gap-4'}`}>
          <button
            onClick={handleReset}
            disabled={trigrams.length === 0}
            className={`bg-white/90 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black border-2 border-black font-medium transition-all ${m ? 'px-4 py-2.5 text-sm' : 'px-6 py-3 text-base'}`}
          >
            {lang === 'cn' ? LABELS.reset.cn : LABELS.reset.en}
          </button>
          <button
            onClick={handleStartThrow}
            disabled={!modelLoaded || !canThrow || isThrowing || trigrams.length >= 6}
            className={`bg-white/90 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black border-2 border-black font-bold transition-all ${m ? 'px-6 py-3 text-lg' : 'px-10 py-4 text-xl'}`}
          >
            {!modelLoaded
              ? (lang === 'cn' ? LABELS.loading.cn : LABELS.loading.en)
              : isThrowing
              ? (lang === 'cn' ? LABELS.casting.cn : LABELS.casting.en)
              : trigrams.length >= 6
              ? (lang === 'cn' ? LABELS.done.cn : LABELS.done.en)
              : (lang === 'cn' ? LABELS.cast.cn : LABELS.cast.en)}
          </button>
        </div>
      </div>

      {/* 抽屉面板 — 桌面右侧抽屉，移动端底部抽屉 */}
      <div
        className={`absolute z-10 overflow-y-auto transition-all duration-700 bg-white/90 ${
          m
            ? 'w-full h-[42%] left-0 right-0 bottom-0 border-t-2 border-black'
            : 'w-1/3 top-0 right-0 bottom-0 border-l-2 border-black'
        } ${
          drawerOpen
            ? 'translate-x-0 translate-y-0'
            : m ? 'translate-y-full' : 'translate-x-full'
        }`}
      >
        <div className={`flex flex-col justify-center min-h-full ${m ? 'p-3' : 'p-5'}`}>
          {/* 头部：进度 + 语言切换 */}
          <div className={`flex items-center justify-between ${m ? 'mb-3' : 'mb-4'}`}>
            <div className={`text-black font-bold ${m ? 'text-xs' : 'text-sm'}`}>
              {done
                ? (lang === 'cn' ? LABELS.complete.cn : LABELS.complete.en)
                : `${lang === 'cn' ? '起卦' : 'Cast'}: ${trigrams.length}/6`}
            </div>
            <button
              onClick={() => setLang(lang === 'cn' ? 'en' : 'cn')}
              className={`px-1.5 py-0.5 border border-black text-black hover:bg-black hover:text-white transition-colors leading-none ${m ? 'text-[10px]' : 'text-xs px-2'}`}
            >
              {lang === 'cn' ? 'EN' : '中文'}
            </button>
          </div>

          {/* 本卦卦象 — 居中 */}
          <div className={`flex flex-col items-center ${m ? 'mb-3' : 'mb-4'}`}>
            <div className={`text-black font-bold mb-1 opacity-60 self-start ${m ? 'text-[10px]' : 'text-xs'}`}>
              {lang === 'cn' ? LABELS.original.cn : LABELS.original.en}
            </div>
            <GuaLines
              trigrams={trigrams}
              changedTrigrams={changedTrigrams}
              arrowVisible={done}
              isMobile={m}
            />
          </div>

          {/* 本卦文本 — 完成后显示 */}
          <div
            className={`transition-all duration-1000 overflow-hidden ${
              done ? 'max-h-[999px] opacity-100 mb-4 pt-3 border-t border-black/20' : 'max-h-0 opacity-0'
            }`}
          >
            {done && <GuaText trigrams={trigrams} lang={lang} guaType="original" boldIndices={changingIndices} isMobile={m} />}
          </div>

          {/* 变卦 — 平滑展开 */}
          <div
            className={`transition-all duration-1000 overflow-hidden ${
              done && changedTrigrams
                ? 'max-h-[999px] opacity-100 pt-3 border-t-2 border-black'
                : 'max-h-0 opacity-0'
            }`}
          >
            {done && changedTrigrams && (
              <GuaText trigrams={changedTrigrams} lang={lang} guaType="changed" isMobile={m} />
            )}
          </div>

          {/* 无变爻 */}
          <div
            className={`transition-all duration-1000 overflow-hidden ${
              done && !changedTrigrams ? 'max-h-[99px] opacity-100 pt-3 border-t border-black/20' : 'max-h-0 opacity-0'
            }`}
          >
            <div className={`text-black opacity-50 text-center ${m ? 'text-xs' : 'text-sm'}`}>
              {lang === 'cn' ? LABELS.noChange.cn : LABELS.noChange.en}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
