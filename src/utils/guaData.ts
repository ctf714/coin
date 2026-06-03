export interface Trigram {
  value: number;
  yinYang: 'yin' | 'yang';
  changing: boolean;
}

export interface GuaData {
  name: string;
  code: string;
}

// 六十四卦完整数据（无重复键）
export const sixtyFourGua: Record<string, GuaData> = {
  '111111': { name: '乾为天', code: '乾' },
  '000000': { name: '坤为地', code: '坤' },
  '010001': { name: '水雷屯', code: '屯' },
  '100010': { name: '山水蒙', code: '蒙' },
  '010111': { name: '水天需', code: '需' },
  '111010': { name: '天水讼', code: '讼' },
  '000010': { name: '地水师', code: '师' },
  '010000': { name: '水地比', code: '比' },
  '110111': { name: '风天小畜', code: '小畜' },
  '111011': { name: '天泽履', code: '履' },
  '000111': { name: '地天泰', code: '泰' },
  '111000': { name: '天地否', code: '否' },
  '101111': { name: '天火同人', code: '同人' },
  '111101': { name: '火天大有', code: '大有' },
  '000100': { name: '地山谦', code: '谦' },
  '001000': { name: '雷地豫', code: '豫' },
  '011001': { name: '泽雷随', code: '随' },
  '100110': { name: '山风蛊', code: '蛊' },
  '000011': { name: '地泽临', code: '临' },
  '110000': { name: '风地观', code: '观' },
  '101001': { name: '火雷噬嗑', code: '噬嗑' },
  '100101': { name: '山火贲', code: '贲' },
  '100000': { name: '山地剥', code: '剥' },
  '000001': { name: '地雷复', code: '复' },
  '100111': { name: '山天大畜', code: '大畜' },
  '111001': { name: '天泽履', code: '天泽履' },
  '001001': { name: '山雷颐', code: '颐' },
  '110110': { name: '泽风大过', code: '大过' },
  '010010': { name: '坎为水', code: '坎' },
  '101101': { name: '离为火', code: '离' },
  '011101': { name: '泽山咸', code: '咸' },
  '001110': { name: '雷风恒', code: '恒' },
  '111100': { name: '天山遁', code: '遁' },
  '001111': { name: '雷天大壮', code: '大壮' },
  '101000': { name: '火地晋', code: '晋' },
  '000101': { name: '地火明夷', code: '明夷' },
  '110101': { name: '风火家人', code: '家人' },
  '101011': { name: '火泽睽', code: '睽' },
  '010100': { name: '水山蹇', code: '蹇' },
  '001101': { name: '雷水解', code: '解' },
  '100011': { name: '山泽损', code: '损' },
  '110001': { name: '风雷益', code: '益' },
  '011111': { name: '泽天夬', code: '夬' },
  '111110': { name: '天风姤', code: '姤' },
  '011000': { name: '泽地萃', code: '萃' },
  '000110': { name: '地风升', code: '升' },
  '011010': { name: '泽水困', code: '困' },
  '010110': { name: '水风井', code: '井' },
  '011110': { name: '泽火革', code: '革' },
  '101110': { name: '火风鼎', code: '鼎' },
  '001010': { name: '震为雷', code: '震' },
  '100100': { name: '艮为山', code: '艮' },
  '110100': { name: '风山渐', code: '渐' },
  '001011': { name: '雷泽归妹', code: '归妹' },
  '101100': { name: '火山旅', code: '旅' },
  '011011': { name: '兑为泽', code: '兑' },
  '110010': { name: '风水涣', code: '涣' },
  '010011': { name: '水泽节', code: '节' },
  '110011': { name: '风泽中孚', code: '中孚' },
  '001100': { name: '雷山小过', code: '小过' },
  '010101': { name: '水火既济', code: '既济' },
  '101010': { name: '火水未济', code: '未济' },
};

export const getGuaName = (trigrams: Trigram[]): string => {
  if (trigrams.length !== 6) return '';
  const code = trigrams.map(t => t.yinYang === 'yang' ? '1' : '0').join('');
  return sixtyFourGua[code]?.name || '未知卦';
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
