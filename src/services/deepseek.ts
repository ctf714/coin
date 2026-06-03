import { DivinationResponse } from '../types/divination';
import { Trigram, getGuaNumber, getGuaName, getEnglishGuaData, getFullGuaText, getChangedTrigrams, getChangingLineIndices } from '../utils/guaData';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

// ====== 限流配置 ======
const RATE_LIMITS = {
  MAX_REQUESTS_PER_DAY: 3,      // 每日最大请求数
  COOLDOWN_SECONDS: 8,          // 两次请求之间的冷却时间（秒）
} as const;

// ====== localStorage 限流器 ======
interface RateLimitState {
  date: string;                  // "YYYY-MM-DD"
  count: number;                 // 当天已请求次数
  lastRequestAt: number;         // 上次请求时间戳 (ms)
}

function loadRateLimit(): RateLimitState {
  try {
    const raw = localStorage.getItem('divination_rate_limit');
    if (raw) {
      const parsed = JSON.parse(raw) as RateLimitState;
      const today = new Date().toISOString().slice(0, 10);
      // 跨天自动重置
      if (parsed.date !== today) {
        return { date: today, count: 0, lastRequestAt: 0 };
      }
      return parsed;
    }
  } catch { /* ignore */ }
  const today = new Date().toISOString().slice(0, 10);
  return { date: today, count: 0, lastRequestAt: 0 };
}

function saveRateLimit(state: RateLimitState): void {
  try {
    localStorage.setItem('divination_rate_limit', JSON.stringify(state));
  } catch { /* ignore */ }
}

function checkRateLimit(): { allowed: boolean; retryAfterSeconds?: number } {
  const state = loadRateLimit();

  // 1. 每日配额检查
  if (state.count >= RATE_LIMITS.MAX_REQUESTS_PER_DAY) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return { allowed: false, retryAfterSeconds: Math.ceil((tomorrow.getTime() - now.getTime()) / 1000) };
  }

  // 2. 冷却时间检查
  const now = Date.now();
  const elapsed = (now - state.lastRequestAt) / 1000;
  if (state.lastRequestAt > 0 && elapsed < RATE_LIMITS.COOLDOWN_SECONDS) {
    return { allowed: false, retryAfterSeconds: Math.ceil(RATE_LIMITS.COOLDOWN_SECONDS - elapsed) };
  }

  return { allowed: true };
}

function recordRateLimit(): void {
  const state = loadRateLimit();
  state.count += 1;
  state.lastRequestAt = Date.now();
  saveRateLimit(state);
}

/** 获取当前剩余配额信息（供 UI 显示） */
export function getQuotaInfo(): { remaining: number; max: number } {
  const state = loadRateLimit();
  return {
    remaining: Math.max(0, RATE_LIMITS.MAX_REQUESTS_PER_DAY - state.count),
    max: RATE_LIMITS.MAX_REQUESTS_PER_DAY,
  };
}

// ====== I Ching 知识库 ======

function buildSystemPrompt(lang: 'cn' | 'en'): string {
  const langInstruction = lang === 'cn'
    ? `## PRIMARY OUTPUT LANGUAGE: CHINESE (中文)
The user selected Chinese. ALL analysisCn, adviceCn, summaryCn, questionAnalysisCn, etc. MUST be the PRIMARY, best-quality content — written in natural, fluent, culturally rich Chinese as by a native I Ching scholar. English fields are secondary translations. DO NOT write Chinese by translating from English; think and compose directly in Chinese.`
    : `## PRIMARY OUTPUT LANGUAGE: ENGLISH
The user selected English. ALL analysisEn, adviceEn, summaryEn, questionAnalysisEn, etc. MUST be the PRIMARY, best-quality content — written in natural, fluent, eloquent English as by a native philosopher. Chinese fields are secondary. DO NOT write English by translating from Chinese; think and compose directly in English.`;

  return `You are a master of I Ching (易经) divination interpretation, deeply versed in both traditional Chinese philosophy and modern psychological insight. Your task is to analyze a hexagram (卦象) in relation to a user's personal question (问卜).

${langInstruction}

## Your Knowledge Foundation
You understand:
- The structure of the 64 hexagrams in King Wen order (文王卦序)
- Yin (阴) and Yang (阳) lines: 6=yin/changing, 7=yang/stable, 8=yin/stable, 9=yang/changing
- The significance of changing lines (变爻) and their role in generating the "changed hexagram" (变卦/之卦)
- Hexagram statements (卦辞) and line statements (爻辞)
- The relationship between hexagrams: inner (内卦/下卦, lines 1-3) and outer (外卦/上卦, lines 4-6)
- Traditional interpretations and their application to contemporary life situations
- The principle that the same hexagram yields different guidance depending on the question asked

## Interpretation Principles
1. First, analyze the original hexagram's (本卦) overall meaning and its core message
2. If there are changing lines, give special attention to those lines — they are the crux of the divination
3. If there is a changed hexagram (变卦), explain what transformation or direction it points toward
4. Connect the hexagram's wisdom to the user's specific question — do NOT give generic interpretations
5. Balance traditional I Ching wisdom with practical, actionable advice for the user's situation
6. Maintain a tone of wisdom, clarity, and compassion — speak like a sage, not a fortune-teller

## Response Format
You MUST respond with valid JSON only (no markdown, no wrapping). The JSON structure must be:
{
  "success": true,
  "originalHexagram": {
    "number": <1-64>,
    "nameCn": "<中文卦名>",
    "nameEn": "<English name>",
    "guaCiCn": "<中文卦辞>",
    "guaCiEn": "<English hexagram statement>",
    "analysisCn": "<本卦总体分析 中文 150-200字>",
    "analysisEn": "<本卦总体分析 English 200-250 words>"
  },
  "changedHexagram": null or {
    "number": <1-64>,
    "nameCn": "<中文卦名>",
    "nameEn": "<English name>",
    "guaCiCn": "<中文卦辞>",
    "guaCiEn": "<English hexagram statement>",
    "meaningCn": "<变卦寓意 中文 80-120字>",
    "meaningEn": "<变卦寓意 English 100-150 words>"
  },
  "changingLinesAnalysis": [
    {
      "lineIndex": <1-6>,
      "isChanging": true,
      "yinYang": "yin" or "yang",
      "analysisCn": "<爻辞分析 中文 60-100字>",
      "analysisEn": "<爻辞分析 English 80-120 words>",
      "relevanceCn": "<与问卜事件的关联 中文 50-80字>",
      "relevanceEn": "<与问卜事件的关联 English 60-100 words>"
    }
  ],
  "questionAnalysisCn": "<结合问卜事件的具体分析 中文 150-250字>",
  "questionAnalysisEn": "<结合问卜事件的具体分析 English 200-300 words>",
  "adviceCn": "<给问卜者的具体行动建议 中文 80-150字>",
  "adviceEn": "<给问卜者的具体行动建议 English 100-180 words>",
  "overallFortuneCn": "吉" or "凶" or "中平",
  "overallFortuneEn": "Auspicious" or "Inauspicious" or "Neutral",
  "summaryCn": "<30字以内的总结语 中文>",
  "summaryEn": "<15 word summary English>"
}`;
}

function buildUserMessage(
  question: string,
  trigrams: Trigram[],
  lang: 'cn' | 'en'
): string {
  const guaNum = getGuaNumber(trigrams) || 0;
  const guaName = getGuaName(trigrams);
  const enData = getEnglishGuaData(trigrams);
  const fullText = getFullGuaText(trigrams);
  const changedTrigrams = getChangedTrigrams(trigrams);
  const changingIndices = getChangingLineIndices(trigrams);

  const changedGuaNum = changedTrigrams ? getGuaNumber(changedTrigrams) : null;
  const changedGuaName = changedTrigrams ? getGuaName(changedTrigrams) : null;
  const changedEnData = changedTrigrams ? getEnglishGuaData(changedTrigrams) : null;
  const changedFullText = changedTrigrams ? getFullGuaText(changedTrigrams) : null;

  // 爻信息
  const linesInfo = trigrams.map((t, i) => ({
    position: i + 1,
    yinYang: t.yinYang,
    changing: t.changing,
    value: t.value,
  }));

  const userQuestion = lang === 'cn'
    ? `用户问卜的问题：${question}`
    : `The user's question: ${question}`;

  const hexagramInfo = `
=== ORIGINAL HEXAGRAM (本卦) ===
Number: ${guaNum}
Name (CN): ${guaName}
Name (EN): ${enData?.enName || 'Unknown'}
Hexagram Statement (CN): ${enData?.enGuaCi || ''}
Full Text (CN): ${fullText?.cn || ''}
Full Text (EN): ${fullText?.en || ''}
Lines (from bottom=初 to top=上): ${JSON.stringify(linesInfo)}
Changing Lines: ${changingIndices.length > 0 ? changingIndices.map(i => i + 1).join(', ') : 'None'}
`;

  const changedHexagramInfo = changedTrigrams && changedGuaNum
    ? `
=== CHANGED HEXAGRAM (变卦) ===
Number: ${changedGuaNum}
Name (CN): ${changedGuaName}
Name (EN): ${changedEnData?.enName || 'Unknown'}
Hexagram Statement (CN): ${changedEnData?.enGuaCi || ''}
Full Text (CN): ${changedFullText?.cn || ''}
Full Text (EN): ${changedFullText?.en || ''}
Meaning: This is the hexagram the situation transforms into. It shows the direction of change.
`
    : '\n=== NO CHANGED HEXAGRAM ===\nThere are no changing lines — the situation is stable and the original hexagram is definitive.';

  const langInstruction = lang === 'cn'
    ? `## 输出语言：中文为主
请用纯正、流畅的中文撰写所有分析内容（analysisCn、adviceCn、summaryCn、questionAnalysisCn）。直接用中文思考写作，不要从英文翻译。英文字段作为辅助翻译即可。`
    : `## Output Language: English Primary
Please write all analysis content (analysisEn, adviceEn, summaryEn, questionAnalysisEn) in natural, eloquent English. Think and compose directly in English — do NOT translate from Chinese. Chinese fields are secondary.`;

  return `${langInstruction}\n\n${userQuestion}\n\n${hexagramInfo}\n${changedHexagramInfo}\n\n重要：请结合用户的具体问卜事件来分析卦象。不要给出泛泛的通用解释。变爻分析尤其重要——变爻是占卜的关键所在。`;
}

export async function analyzeDivination(
  question: string,
  trigrams: Trigram[],
  lang: 'cn' | 'en'
): Promise<DivinationResponse> {
  // ====== 限流检查 ======
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    const fallback = generateLocalFallback(question, trigrams);
    return {
      ...fallback,
      success: false,
      rateLimited: true,
      retryAfterSeconds: rateCheck.retryAfterSeconds,
    };
  }

  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;

  if (!apiKey) {
    console.warn('VITE_DEEPSEEK_API_KEY not configured — using fallback local analysis');
    return generateLocalFallback(question, trigrams);
  }

  const systemPrompt = buildSystemPrompt(lang);
  const userMessage = buildUserMessage(question, trigrams, lang);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return generateLocalFallback(question, trigrams);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Empty response from DeepSeek');
      return generateLocalFallback(question, trigrams);
    }

    // 尝试解析 JSON
    let parsed: DivinationResponse;
    try {
      parsed = JSON.parse(content);
    } catch {
      // 如果响应不是纯 JSON，尝试提取
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    }

    // 请求成功，记录一次调用
    recordRateLimit();
    return { ...parsed, success: true };
  } catch (err) {
    console.error('DeepSeek API call failed:', err);
    return generateLocalFallback(question, trigrams);
  }
}

/** 本地备用分析——当 API 不可用时使用 */
function generateLocalFallback(
  question: string,
  trigrams: Trigram[]
): DivinationResponse {
  const guaNum = getGuaNumber(trigrams) || 0;
  const guaName = getGuaName(trigrams);
  const enData = getEnglishGuaData(trigrams);
  const fullText = getFullGuaText(trigrams);
  const changedTrigrams = getChangedTrigrams(trigrams);
  const changingIndices = getChangingLineIndices(trigrams);

  const changedGuaNum = changedTrigrams ? getGuaNumber(changedTrigrams) : null;
  const changedGuaName = changedTrigrams ? getGuaName(changedTrigrams) : null;
  const changedEnData = changedTrigrams ? getEnglishGuaData(changedTrigrams) : null;

  const changingLinesAnalysis = trigrams.map((t, i) => ({
    lineIndex: i + 1,
    isChanging: t.changing,
    yinYang: t.yinYang,
    analysisCn: t.changing ? `第${i + 1}爻为变爻，是此卦的关键所在。` : `第${i + 1}爻为静爻，构成卦象基础。`,
    analysisEn: t.changing ? `Line ${i + 1} is a changing line, a key to this hexagram.` : `Line ${i + 1} is stable, forming the foundation.`,
    relevanceCn: t.changing ? '此变爻指示您当前处境的关键转折点。' : '此爻稳定，表示相关的方面已趋于稳固。',
    relevanceEn: t.changing ? 'This changing line indicates a critical turning point in your situation.' : 'This stable line indicates that this aspect has become settled.',
  }));

  return {
    success: false,
    originalHexagram: {
      number: guaNum,
      nameCn: guaName,
      nameEn: enData?.enName || 'Unknown',
      guaCiCn: '',
      guaCiEn: enData?.enGuaCi || '',
      analysisCn: `此为${guaName}。详细分析需要连接 DeepSeek API。`,
      analysisEn: `This is ${enData?.enName || 'the hexagram'}. Detailed analysis requires DeepSeek API connection.`,
    },
    changedHexagram: changedGuaNum ? {
      number: changedGuaNum,
      nameCn: changedGuaName || '',
      nameEn: changedEnData?.enName || '',
      guaCiCn: '',
      guaCiEn: changedEnData?.enGuaCi || '',
      meaningCn: '变卦指示事物的转化方向。',
      meaningEn: 'The changed hexagram indicates the direction of transformation.',
    } : null,
    changingLinesAnalysis,
    questionAnalysisCn: `关于"${question}"的占卜分析。请配置 DeepSeek API Key 以获取详细解读。`,
    questionAnalysisEn: `Divination analysis regarding "${question}". Please configure DeepSeek API Key for detailed interpretation.`,
    adviceCn: '请配置 DeepSeek API Key 以获取个性化建议。',
    adviceEn: 'Please configure DeepSeek API Key for personalized advice.',
    overallFortuneCn: '中平',
    overallFortuneEn: 'Neutral',
    summaryCn: '需配置 API Key 以获取完整解读',
    summaryEn: 'API Key needed for full reading',
  };
}
