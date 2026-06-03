import { englishGuaByNum, EnglishGuaData } from './englishGuaData';
import { fullGuaByNum, FullGuaText } from './fullGuaText';

export interface Trigram {
  value: number;
  yinYang: 'yin' | 'yang';
  changing: boolean;
}

export interface GuaData {
  name: string;
  code: string;
}

// 六十四卦完整数据（文王序，标准二进制：上卦+下卦，阳=1 阴=0）
// 八卦编码：乾111 兑110 离101 震001 巽011 坎010 艮100 坤000
export const sixtyFourGua: Record<string, GuaData> = {
  // 1-8
  '111111': { name: '乾为天', code: '乾' },
  '000000': { name: '坤为地', code: '坤' },
  '010001': { name: '水雷屯', code: '屯' },
  '100010': { name: '山水蒙', code: '蒙' },
  '010111': { name: '水天需', code: '需' },
  '111010': { name: '天水讼', code: '讼' },
  '000010': { name: '地水师', code: '师' },
  '010000': { name: '水地比', code: '比' },
  // 9-16
  '011111': { name: '风天小畜', code: '小畜' },
  '111110': { name: '天泽履', code: '履' },
  '000111': { name: '地天泰', code: '泰' },
  '111000': { name: '天地否', code: '否' },
  '111101': { name: '天火同人', code: '同人' },
  '101111': { name: '火天大有', code: '大有' },
  '000100': { name: '地山谦', code: '谦' },
  '001000': { name: '雷地豫', code: '豫' },
  // 17-24
  '110001': { name: '泽雷随', code: '随' },
  '100011': { name: '山风蛊', code: '蛊' },
  '000110': { name: '地泽临', code: '临' },
  '011000': { name: '风地观', code: '观' },
  '101001': { name: '火雷噬嗑', code: '噬嗑' },
  '100101': { name: '山火贲', code: '贲' },
  '100000': { name: '山地剥', code: '剥' },
  '000001': { name: '地雷复', code: '复' },
  // 25-32
  '111001': { name: '天雷无妄', code: '无妄' },
  '100111': { name: '山天大畜', code: '大畜' },
  '100001': { name: '山雷颐', code: '颐' },
  '110011': { name: '泽风大过', code: '大过' },
  '010010': { name: '坎为水', code: '坎' },
  '101101': { name: '离为火', code: '离' },
  '110100': { name: '泽山咸', code: '咸' },
  '001011': { name: '雷风恒', code: '恒' },
  // 33-40
  '111100': { name: '天山遁', code: '遁' },
  '001111': { name: '雷天大壮', code: '大壮' },
  '101000': { name: '火地晋', code: '晋' },
  '000101': { name: '地火明夷', code: '明夷' },
  '011101': { name: '风火家人', code: '家人' },
  '101110': { name: '火泽睽', code: '睽' },
  '010100': { name: '水山蹇', code: '蹇' },
  '001010': { name: '雷水解', code: '解' },
  // 41-48
  '100110': { name: '山泽损', code: '损' },
  '011001': { name: '风雷益', code: '益' },
  '110111': { name: '泽天夬', code: '夬' },
  '111011': { name: '天风姤', code: '姤' },
  '110000': { name: '泽地萃', code: '萃' },
  '000011': { name: '地风升', code: '升' },
  '110010': { name: '泽水困', code: '困' },
  '010011': { name: '水风井', code: '井' },
  // 49-56
  '110101': { name: '泽火革', code: '革' },
  '101011': { name: '火风鼎', code: '鼎' },
  '001001': { name: '震为雷', code: '震' },
  '100100': { name: '艮为山', code: '艮' },
  '011100': { name: '风山渐', code: '渐' },
  '001110': { name: '雷泽归妹', code: '归妹' },
  '001101': { name: '雷火丰', code: '丰' },
  '101100': { name: '火山旅', code: '旅' },
  // 57-64
  '011011': { name: '巽为风', code: '巽' },
  '110110': { name: '兑为泽', code: '兑' },
  '011010': { name: '风水涣', code: '涣' },
  '010110': { name: '水泽节', code: '节' },
  '011110': { name: '风泽中孚', code: '中孚' },
  '001100': { name: '雷山小过', code: '小过' },
  '010101': { name: '水火既济', code: '既济' },
  '101010': { name: '火水未济', code: '未济' },
};

// 将 trigrams（从下到上：爻1→爻6）转为标准二进制码（从上到下：爻6→爻1）
const toStandardCode = (trigrams: Trigram[]): string =>
  [...trigrams].reverse().map(t => t.yinYang === 'yang' ? '1' : '0').join('');

export const getGuaCode = (trigrams: Trigram[]): string => {
  if (trigrams.length !== 6) return '';
  return toStandardCode(trigrams);
};

export const getGuaName = (trigrams: Trigram[]): string => {
  if (trigrams.length !== 6) return '';
  const code = toStandardCode(trigrams);
  return sixtyFourGua[code]?.name || '未知卦';
};

// 二进制码（标准序：爻6→爻1）→ 卦序号（1-64，King Wen 序）
// 必须显式列出顺序，因为 JS 的 Object.keys() 会对纯数字字符串键重新排序
const guaCodeOrder = [
  '111111','000000','010001','100010','010111','111010','000010','010000',
  '011111','111110','000111','111000','111101','101111','000100','001000',
  '110001','100011','000110','011000','101001','100101','100000','000001',
  '111001','100111','100001','110011','010010','101101','110100','001011',
  '111100','001111','101000','000101','011101','101110','010100','001010',
  '100110','011001','110111','111011','110000','000011','110010','010011',
  '110101','101011','001001','100100','011100','001110','001101','101100',
  '011011','110110','011010','010110','011110','001100','010101','101010',
];
const codeToNum: Record<string, number> = {};
guaCodeOrder.forEach((code, i) => { codeToNum[code] = i + 1; });

export const getGuaNumber = (trigrams: Trigram[]): number | null => {
  if (trigrams.length !== 6) return null;
  const code = toStandardCode(trigrams);
  return codeToNum[code] ?? null;
};

export const getEnglishGuaData = (trigrams: Trigram[]): EnglishGuaData | null => {
  if (trigrams.length !== 6) return null;
  const code = toStandardCode(trigrams);
  const num = codeToNum[code];
  if (!num) return null;
  return englishGuaByNum[num] || null;
};

export const getFullGuaText = (trigrams: Trigram[]): FullGuaText | null => {
  if (trigrams.length !== 6) return null;
  const code = toStandardCode(trigrams);
  const num = codeToNum[code];
  if (!num) return null;
  return fullGuaByNum[num] || null;
};

// 变卦：有变爻则翻转变爻的阴阳得到之卦，无变爻返回 null
export const getChangedTrigrams = (trigrams: Trigram[]): Trigram[] | null => {
  if (trigrams.length !== 6) return null;
  const hasChanging = trigrams.some(t => t.changing);
  if (!hasChanging) return null;
  return trigrams.map(t =>
    t.changing
      ? { ...t, yinYang: t.yinYang === 'yang' ? 'yin' as const : 'yang' as const, changing: false }
      : t
  );
};

// 获取变爻位置（从下到上 0-based）
export const getChangingLineIndices = (trigrams: Trigram[]): number[] =>
  trigrams.reduce<number[]>((acc, t, i) => t.changing ? [...acc, i] : acc, []);

// 爻辞行标记（从下到上 0→5）
const cnLinePrefixes = ['初九','初六','九二','六二','九三','六三','九四','六四','九五','六五','上九','上六'];
const enLinePrefixes = [
  'Initial Nine','Initial Six','Second Nine','Second Six','Third Nine','Third Six',
  'Fourth Nine','Fourth Six','Fifth Nine','Fifth Six','Top Nine','Top Six',
];

// 将文本中对应变爻的爻辞行加粗（返回 HTML 字符串）
export const boldChangingLines = (text: string, changingIndices: number[], lang: 'cn' | 'en'): string => {
  const prefixes = lang === 'cn' ? cnLinePrefixes : enLinePrefixes;
  return text.split('\n').map(line => {
    const trimmed = line.trimStart();
    for (const idx of changingIndices) {
      const p1 = prefixes[idx * 2];
      const p2 = prefixes[idx * 2 + 1];
      if (trimmed.startsWith(p1) || trimmed.startsWith(p2)) {
        return `<b>${line}</b>`;
      }
    }
    return line;
  }).join('\n');
};

export const tossCoins = (): { result: number; yinYang: 'yin' | 'yang'; changing: boolean } => {
  const coin1 = Math.random() > 0.5 ? 3 : 2;
  const coin2 = Math.random() > 0.5 ? 3 : 2;
  const coin3 = Math.random() > 0.5 ? 3 : 2;
  const sum = coin1 + coin2 + coin3;
  
  return calculateTrigram(sum);
};

// 根据三个铜钱的结果计算卦象（true正面=字=2，false反面=背=3）
export const calculateFromCoinResults = (coinResults: boolean[]): { result: number; yinYang: 'yin' | 'yang'; changing: boolean } => {
  const sum = coinResults.reduce((acc, isHead) => acc + (isHead ? 2 : 3), 0);
  return calculateTrigram(sum);
};

// 根据总和计算卦象
const calculateTrigram = (sum: number): { result: number; yinYang: 'yin' | 'yang'; changing: boolean } => {
  let yinYang: 'yin' | 'yang';
  let changing: boolean;
  
  switch (sum) {
    case 6:
      yinYang = 'yin';
      changing = true;
      break;
    case 7:
      yinYang = 'yang';
      changing = false;
      break;
    case 8:
      yinYang = 'yin';
      changing = false;
      break;
    case 9:
      yinYang = 'yang';
      changing = true;
      break;
    default:
      yinYang = 'yang';
      changing = false;
  }
  
  return { result: sum, yinYang, changing };
};
