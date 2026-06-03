/** DeepSeek 占卜分析响应格式 */

export interface DivinationLineAnalysis {
  /** 爻位序号 (初九=1, 九二=2, ..., 上九=6) */
  lineIndex: number;
  /** 是否为变爻 */
  isChanging: boolean;
  /** 爻的阴阳 */
  yinYang: 'yin' | 'yang';
  /** 本爻分析（中文） */
  analysisCn: string;
  /** 本爻分析（英文） */
  analysisEn: string;
  /** 与问卜事件的关联（中文） */
  relevanceCn: string;
  /** 与问卜事件的关联（英文） */
  relevanceEn: string;
}

export interface DivinationResponse {
  /** 分析是否成功 */
  success: boolean;
  /** 是否触发限流 */
  rateLimited?: boolean;
  /** 限流剩余秒数（仅 cooldown 时） */
  retryAfterSeconds?: number;
  /** 本卦信息 */
  originalHexagram: {
    /** 卦序（文王卦序 1-64） */
    number: number;
    /** 中文名 */
    nameCn: string;
    /** 英文名 */
    nameEn: string;
    /** 中文卦辞 */
    guaCiCn: string;
    /** 英文卦辞 */
    guaCiEn: string;
    /** 卦象总体分析（中文） */
    analysisCn: string;
    /** 卦象总体分析（英文） */
    analysisEn: string;
  };
  /** 变卦信息（若无变爻则为 null） */
  changedHexagram: {
    number: number;
    nameCn: string;
    nameEn: string;
    guaCiCn: string;
    guaCiEn: string;
    /** 变卦寓意（中文） */
    meaningCn: string;
    /** 变卦寓意（英文） */
    meaningEn: string;
  } | null;
  /** 变爻分析列表 */
  changingLinesAnalysis: DivinationLineAnalysis[];
  /** 问卜事件结合分析（中文） */
  questionAnalysisCn: string;
  /** 问卜事件结合分析（英文） */
  questionAnalysisEn: string;
  /** 综合建议（中文） */
  adviceCn: string;
  /** 综合建议（英文） */
  adviceEn: string;
  /** 吉凶总体倾向（中文）：吉 / 凶 / 中平 */
  overallFortuneCn: string;
  /** 吉凶总体倾向（英文） */
  overallFortuneEn: string;
  /** 总结语（中文） */
  summaryCn: string;
  /** 总结语（英文） */
  summaryEn: string;
}
