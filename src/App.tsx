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

const MYSTICAL_SAYINGS = [
  { cn: '易有太极，是生两仪，两仪生四象，四象生八卦。', en: 'In the Yi there is the Supreme Polarity, which gives rise to the Two Modes; the Two Modes give rise to the Four Images; the Four Images give rise to the Eight Trigrams.' },
  { cn: '一阴一阳之谓道，继之者善也，成之者性也。', en: 'One yin and one yang — this is called the Dao. To follow it is goodness; to fulfill it is innate nature.' },
  { cn: '天地感而万物化生，圣人感人心而天下和平。', en: 'Heaven and Earth resonate, and all things are born. The sage resonates with the human heart, and the world is at peace.' },
  { cn: '穷则变，变则通，通则久。', en: 'When pushed to the limit, one changes; through change, one finds passage; through passage, one endures.' },
  { cn: '吉凶悔吝者，生乎动者也。', en: 'Fortune and misfortune, regret and remorse — all arise from movement.' },
  { cn: '天尊地卑，乾坤定矣。', en: 'Heaven is noble and Earth is humble; thus Qian and Kun are fixed.' },
  { cn: '方以类聚，物以群分，吉凶生矣。', en: 'Affinities gather by kind; things divide by nature. Thus fortune and misfortune arise.' },
  { cn: '君子居则观其象而玩其辞，动则观其变而玩其占。', en: 'At rest, the noble one observes the images and ponders the words. In action, he observes the changes and contemplates the oracle.' },
  { cn: '亢龙有悔，盈不可久也。', en: 'The overreaching dragon shall have cause to repent. Fullness cannot endure.' },
  { cn: '见龙在田，利见大人。', en: 'The dragon appears in the field. It is favorable to see the great person.' },
  { cn: '君子终日乾乾，夕惕若厉，无咎。', en: 'The noble one is vigilant all day, and at night remains alert as if in danger. No blame.' },
  { cn: '天行健，君子以自强不息。', en: 'The movement of Heaven is powerful. Thus the noble one ceaselessly strengthens himself.' },
  { cn: '地势坤，君子以厚德载物。', en: 'The Earth\'s disposition is receptive. Thus the noble one sustains all things with profound virtue.' },
  { cn: '否极泰来，循环往复。', en: 'When obstruction reaches its limit, peace returns. All things cycle without end.' },
  { cn: '善不积不足以成名，恶不积不足以灭身。', en: 'Goodness unaccumulated makes no name. Evil unaccumulated brings no ruin. All things grow in silence.' },
  { cn: '大哉乾元，万物资始，乃统天。', en: 'Great indeed is Qian the Originator! All things take their beginning from it, and it governs Heaven.' },
  { cn: '至哉坤元，万物资生，乃顺承天。', en: 'Perfect indeed is Kun the Receptive! All things draw life from it, and it obediently receives Heaven.' },
  { cn: '乾道变化，各正性命，保合太和，乃利贞。', en: 'The Way of Qian changes and transforms, bringing all beings to their true nature, preserving the Great Harmony. This is favorable and correct.' },
  { cn: '云行雨施，品物流形。', en: 'Clouds move and rain falls; the myriad things flow into form.' },
  { cn: '履霜，坚冰至。', en: 'Treading on frost — the solid ice will soon arrive. All things grow from the subtle.' },
  { cn: '含弘光大，品物咸亨。', en: 'All-embracing, vast in capacity, great in brilliance — all beings flourish together.' },
  { cn: '谦谦君子，卑以自牧也。', en: 'The truly humble noble one governs himself with modesty.' },
  { cn: '观乎天文以察时变，观乎人文以化成天下。', en: 'Observe the patterns of Heaven to discern the changes of the seasons; observe the patterns of humanity to transform and perfect the world.' },
  { cn: '积善之家必有余庆，积不善之家必有余殃。', en: 'The house that accumulates goodness will surely have abundant blessings; the house that accumulates evil will surely have abundant calamity.' },
  { cn: '德薄而位尊，知小而谋大，力小而任重，鲜不及矣。', en: 'Small virtue in a high place, meager wisdom for a grand scheme, little strength bearing a great load — rarely does this escape disaster.' },
  { cn: '君子敬以直内，义以方外。', en: 'The noble one rectifies the inner self with reverence, and shapes the outer conduct with righteousness.' },
  { cn: '君子藏器于身，待时而动。', en: 'The noble one keeps the tool hidden within, and acts only when the moment is ripe.' },
  { cn: '时止则止，时行则行，动静不失其时，其道光明。', en: 'When it is time to halt, halt. When it is time to advance, advance. Neither rest nor movement misses its season — thus the Way shines bright.' },
  { cn: '往者屈也，来者信也，屈信相感而利生焉。', en: 'What retreats bends; what approaches extends. Bending and extending stir each other, and benefit arises.' },
  { cn: '尺蠖之屈，以求信也。龙蛇之蛰，以存身也。', en: 'The inchworm bends to stretch farther. The dragon and serpent hibernate to preserve life.' },
  { cn: '君子进德修业，欲及时也。', en: 'The noble one advances in virtue and refines his work, for he desires to be ready when the time arrives.' },
  { cn: '君子上交不谄，下交不渎。', en: 'The noble one flatters none above and scorns none below.' },
  { cn: '君子安其身而后动，易其心而后语，定其交而后求。', en: 'The noble one steadies himself before acting, calms his heart before speaking, and secures trust before making a request.' },
  { cn: '日月得天而能久照，四时变化而能久成。', en: 'The sun and moon rely on Heaven and thus shine forever. The four seasons change and thus forever renew.' },
  { cn: '山下有泽，损。君子以惩忿窒欲。', en: 'The lake below the mountain — Diminishing. Thus the noble one restrains anger and curbs desire.' },
  { cn: '风雷，益。君子以见善则迁，有过则改。', en: 'Wind and thunder — Increasing. Thus the noble one, seeing good, moves toward it; having fault, corrects it.' },
  { cn: '二人同心，其利断金。同心之言，其臭如兰。', en: 'When two hearts are one, their sharpness can cut through metal. Words from a united heart carry the fragrance of orchids.' },
  { cn: '慢藏诲盗，冶容诲淫。', en: 'Carelessly storing valuables teaches others to steal; painting the face too seductively teaches others to lust.' },
  { cn: '知几其神乎。君子见几而作，不俟终日。', en: 'To perceive the subtle seed — is this not divine? The noble one, seeing the seed, acts at once and does not wait a whole day.' },
  { cn: '变动以利言，吉凶以情迁。', en: 'Change and movement speak of advantage; fortune and misfortune shift according to one\'s disposition.' },
  { cn: '书不尽言，言不尽意。', en: 'Writing cannot fully capture speech; speech cannot fully capture meaning.' },
  { cn: '形而上者谓之道，形而下者谓之器。', en: 'That which is above form is called the Dao; that which is below form is called the vessel.' },
  { cn: '化而裁之谓之变，推而行之谓之通。', en: 'To transform and shape is called change; to extend and practice is called passage.' },
  { cn: '默而成之，不言而信，存乎德行。', en: 'Silently fulfill; be trusted without words. This rests in virtue and conduct.' },
  { cn: '和顺于道德而理于义，穷理尽性以至于命。', en: 'Harmonize with the Way and Virtue, align with righteousness. Exhaust principle, fulfill nature, and arrive at destiny.' },
  { cn: '探赜索隐，钩深致远。', en: 'Plumb the mysterious, search out the hidden. Hook the deep and draw the distant near.' },
  { cn: '以通天下之志，以定天下之业，以断天下之疑。', en: 'To comprehend the will of all under Heaven, to establish the great work under Heaven, to resolve all doubts under Heaven.' },
  { cn: '阴阳合德而刚柔有体。', en: 'Yin and yang unite their virtues, and the firm and yielding take form.' },
  { cn: '变动不居，周流六虚。', en: 'Change never rests, flowing ceaselessly through the six empty places.' },
  { cn: '不可为典要，唯变所适。', en: 'There is no fixed rule — only what fits the change.' },
];

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
  const [showDonate, setShowDonate] = useState(false);
  const [sayingIndex, setSayingIndex] = useState(0);

  useEffect(() => {
    document.body.style.overflow = (showSplash || showMeditation || showInstruction || showDonate) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showSplash, showMeditation, showInstruction, showDonate]);

  // 开屏页随机箴言轮播 + 主界面铜钱上方
  useEffect(() => {
    if (showSplash || (!showSplash && !showMeditation)) {
      const pick = () => {
        let next: number;
        do { next = Math.floor(Math.random() * MYSTICAL_SAYINGS.length); }
        while (next === sayingIndex && MYSTICAL_SAYINGS.length > 1);
        setSayingIndex(next);
      };
      const id = setInterval(pick, 5000);
      return () => clearInterval(id);
    }
  }, [showSplash, showMeditation, sayingIndex]);

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
          <div className={`text-center text-white ${m ? 'px-4' : 'px-6'} max-w-xl w-full`}>
            <h1 className={m ? 'mb-8' : 'mb-10'}>
              <div className={`tracking-[0.3em] text-white/50 ${m ? 'text-xs mb-1' : 'text-base mb-2'}`}>WEN WANG GUA</div>
              <div className={`font-bold tracking-widest ${m ? 'text-3xl' : 'text-5xl'}`}>金 钱 卦</div>
              <div className={`text-white/50 ${m ? 'text-sm mt-1' : 'text-base mt-2'}`}>Money Hexagram Divination</div>
            </h1>

            {/* 箴言轮播区 — 较大空白 */}
            <div className={`flex flex-col items-center justify-center ${m ? 'h-32 mb-4' : 'h-40 mb-6'}`}>
              <div
                key={sayingIndex}
                className="animate-[fadeInUp_0.8s_ease-out]"
              >
                <div className={`text-white/70 font-medium tracking-[0.08em] leading-relaxed mb-2 ${m ? 'text-sm px-2' : 'text-lg px-4'}`}>
                  "{MYSTICAL_SAYINGS[sayingIndex].cn}"
                </div>
                <div className={`text-white/30 tracking-[0.05em] leading-relaxed italic ${m ? 'text-[10px] px-2' : 'text-xs px-6'}`}>
                  "{MYSTICAL_SAYINGS[sayingIndex].en}"
                </div>
              </div>
            </div>

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
            <div className={`h-px bg-white/20 mx-auto ${m ? 'w-10 my-4' : 'w-12 my-5'}`} />
            <button
              onClick={() => setShowDonate(true)}
              className={`text-amber-300/60 hover:text-amber-300 transition-all tracking-[0.15em] bg-transparent border-none ${m ? 'text-[10px]' : 'text-xs'}`}
            >
              隨  喜  讚  賞
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

      {/* 赞赏弹窗 */}
      {showDonate && (
        <div className="absolute inset-0 z-[65] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`relative bg-white/95 flex flex-col items-center max-w-sm w-full ${m ? 'p-5' : 'p-8'}`}>
            <button
              onClick={() => setShowDonate(false)}
              className="absolute top-2 right-3 text-black/40 hover:text-black text-xl leading-none"
            >
              ×
            </button>
            <p className={`text-black/50 tracking-wider mb-1 ${m ? 'text-[10px]' : 'text-xs'}`}>
              {lang === 'cn' ? '天 機 不 可 輕 洩' : 'H E A V E N  ·  R E V E A L S  ·  N O T'}
            </p>
            <p className={`text-black font-bold tracking-widest mb-4 ${m ? 'text-base' : 'text-lg'}`}>
              {lang === 'cn' ? '有緣之人 隨心讚賞' : 'A Gift from the Heart'}
            </p>
            <p className={`text-black/30 italic mb-4 text-center leading-relaxed ${m ? 'text-[10px]' : 'text-xs'}`}>
              {lang === 'cn'
                ? '卦不敢盡言，天機微露，所得皆為冥冥指引。若有所感，隨緣樂助，心誠則靈。'
                : 'The oracle speaks but in whispers. What is revealed is but a glimpse. If moved, give freely — sincerity is the truest offering.'}
            </p>
            <img
              src={`${import.meta.env.BASE_URL}赞赏.jpg`}
              alt="赞赏码"
              className={`${m ? 'w-52' : 'w-60'} rounded`}
            />
            <p className={`text-black/20 mt-3 ${m ? 'text-[10px]' : 'text-xs'}`}>
              感恩隨喜 · 福生無量
            </p>
          </div>
        </div>
      )}

      {/* 静心页 — 水墨淡开 */}
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
        {/* 铜钱上方箴言 */}
        {!showSplash && !showMeditation && (
          <div className={`absolute left-0 right-0 z-[5] flex flex-col items-center text-center pointer-events-none ${m ? 'top-4 px-3' : 'top-6 px-4'}`}>
            <div key={sayingIndex + '_main'} className="animate-[fadeInUp_0.8s_ease-out]">
              <div className={`text-white/25 font-medium tracking-[0.08em] leading-relaxed mb-1 ${m ? 'text-[11px]' : 'text-sm'}`}>
                "{MYSTICAL_SAYINGS[sayingIndex].cn}"
              </div>
              <div className={`text-white/10 tracking-[0.05em] leading-relaxed italic ${m ? 'text-[9px]' : 'text-[11px]'}`}>
                "{MYSTICAL_SAYINGS[sayingIndex].en}"
              </div>
            </div>
          </div>
        )}
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
