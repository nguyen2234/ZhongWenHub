import type {
  VoiceSessionState,
  VoiceSessionMode,
  VoiceTurn,
  VoiceSessionReviewData,
  GuidedResponseSuggestion,
  UsefulVocabItem,
} from './voice.types';

export type VoiceSessionListener = (
  state: VoiceSessionState,
  eventData?: {
    turn?: VoiceTurn;
    metrics?: {
      durationSeconds: number;
      interruptionCount: number;
      turnCount: number;
    };
    error?: string;
  }
) => void;

interface SimulationScenario {
  topic: string;
  initialPrompt: {
    hanzi: string;
    pinyin: string;
    vietnamese: string;
  };
  sampleUserTurns: {
    hanzi: string;
    pinyin: string;
    vietnamese: string;
  }[];
  sampleAssistantResponses: {
    hanzi: string;
    pinyin: string;
    vietnamese: string;
  }[];
  suggestedResponses: GuidedResponseSuggestion[];
  usefulVocabulary: UsefulVocabItem[];
}

const DEFAULT_SCENARIOS: Record<VoiceSessionMode, SimulationScenario> = {
  daily_conversation: {
    topic: 'Gọi đồ uống tại quán cà phê (点饮料)',
    initialPrompt: {
      hanzi: '你好！欢迎光临，你想喝点什么？',
      pinyin: 'Nǐ hǎo! Huānyíng guānglín, nǐ xiǎng hē diǎn shénme?',
      vietnamese: 'Xin chào! Hoan nghênh bạn, bạn muốn uống chút gì nào?',
    },
    sampleUserTurns: [
      {
        hanzi: '我要一杯冰美式咖啡，谢谢。',
        pinyin: 'Wǒ yào yībēi bīng měishì kāfēi, xièxiè.',
        vietnamese: 'Tôi muốn một ly cà phê Americano đá, cảm ơn.',
      },
      {
        hanzi: '请问这个多少钱？',
        pinyin: 'Qǐngwèn zhège duōshǎo qián?',
        vietnamese: 'Xin hỏi món này bao nhiêu tiền?',
      },
    ],
    sampleAssistantResponses: [
      {
        hanzi: '好的，一杯冰美式！你需要加糖或者加牛奶吗？',
        pinyin: 'Hǎo de, yībēi bīng měishì! Nǐ xūyào jiā táng huòzhě jiā niúnǎi ma?',
        vietnamese: 'Được rồi, một ly Americano đá! Bạn có cần thêm đường hoặc sữa không?',
      },
      {
        hanzi: '一共是二十五块钱。请问扫码还是现金支付？',
        pinyin: 'Yīgòng shì èrshíwǔ kuài qián. Qǐngwèn sǎomǎ háishì xiànjīn zhīfù?',
        vietnamese: 'Tổng cộng là hai mươi lăm tệ. Xin hỏi bạn quét mã hay trả tiền mặt?',
      },
    ],
    suggestedResponses: [
      {
        id: 'sug-1',
        hanzi: '不用加糖，谢谢。',
        pinyin: 'Bùyòng jiā táng, xièxiè.',
        vietnamese: 'Không cần thêm đường, cảm ơn.',
      },
      {
        id: 'sug-2',
        hanzi: '请加一点牛奶。',
        pinyin: 'Qǐng jiā yīdiǎn niúnǎi.',
        vietnamese: 'Làm ơn cho chút sữa.',
      },
      {
        id: 'sug-3',
        hanzi: '我用微信支付。',
        pinyin: 'Wǒ yòng Wēixìn zhīfù.',
        vietnamese: 'Tôi dùng WeChat Pay.',
      },
    ],
    usefulVocabulary: [
      { hanzi: '一杯', pinyin: 'yībēi', vietnamese: 'Một ly/cốc' },
      { hanzi: '冰美式', pinyin: 'bīng měishì', vietnamese: 'Americano đá' },
      { hanzi: '多少钱', pinyin: 'duōshǎo qián', vietnamese: 'Bao nhiêu tiền' },
      { hanzi: '扫码', pinyin: 'sǎomǎ', vietnamese: 'Quét mã QR' },
    ],
  },
  free_talk: {
    topic: 'Tự do giao tiếp: Sở thích & Ngày cuối tuần',
    initialPrompt: {
      hanzi: '今天过得怎么样？周末你有什么打算吗？',
      pinyin: 'Jīntiān guò de zěnmeyàng? Zhōumò nǐ yǒu shénme dǎsuàn ma?',
      vietnamese: 'Hôm nay thế nào rồi? Cuối tuần bạn có dự định gì chưa?',
    },
    sampleUserTurns: [
      {
        hanzi: '我周末想去公园散步，看书。',
        pinyin: 'Wǒ zhōumò xiǎng qù gōngyuán sànbù, kànshū.',
        vietnamese: 'Cuối tuần tôi muốn đi công viên dạo bộ, đọc sách.',
      },
    ],
    sampleAssistantResponses: [
      {
        hanzi: '听起来很惬意！你平时喜欢看哪类书呢？',
        pinyin: 'Tīng qǐlái hěn qièyì! Nǐ píngshí xǐhuan kàn nǎ lèi shū ne?',
        vietnamese: 'Nghe có vẻ rất thảnh thơi! Thường ngày bạn thích đọc thể loại sách nào?',
      },
    ],
    suggestedResponses: [
      {
        id: 'sug-ft-1',
        hanzi: '我喜欢看中国历史和小说。',
        pinyin: 'Wǒ xǐhuan kàn Zhōngguó lìshǐ hé xiǎoshuō.',
        vietnamese: 'Tôi thích đọc lịch sử Trung Quốc và tiểu thuyết.',
      },
      {
        id: 'sug-ft-2',
        hanzi: '我最近在学汉语，看中文故事。',
        pinyin: 'Wǒ zuìjìn zài xué Hànyǔ, kàn Zhōngwén gùshì.',
        vietnamese: 'Gần đây tôi đang học tiếng Hán và đọc truyện tiếng Trung.',
      },
    ],
    usefulVocabulary: [
      { hanzi: '周末', pinyin: 'zhōumò', vietnamese: 'Cuối tuần' },
      { hanzi: '散步', pinyin: 'sànbù', vietnamese: 'Đi dạo' },
      { hanzi: '惬意', pinyin: 'qièyì', vietnamese: 'Thoải mái, dễ chịu' },
    ],
  },
  roleplay: {
    topic: 'Đóng vai: Hỏi đường tới Viện Bảo Tàng (问路)',
    initialPrompt: {
      hanzi: '请问去省博物馆怎么走？离这里远吗？',
      pinyin: 'Qǐngwèn qù shěng bówùguǎn zěnme zǒu? Lí zhèlǐ yuǎn ma?',
      vietnamese: 'Xin hỏi đến viện bảo tàng tỉnh đi thế nào? Có cách đây xa không?',
    },
    sampleUserTurns: [
      {
        hanzi: '一直往前走，在第二个路口向右拐。',
        pinyin: 'Yīzhí wǎng qián zǒu, zài dì èr gè lùkǒu xiàng yòu guǎi.',
        vietnamese: 'Cứ đi thẳng về phía trước, ở ngã tư thứ hai thì rẽ phải.',
      },
    ],
    sampleAssistantResponses: [
      {
        hanzi: '明白了！从这里走过去大概需要多长时间呢？',
        pinyin: 'Míngbái le! Cóng zhèlǐ zǒu guòqù dàgài xūyào duō cháng shíjiān ne?',
        vietnamese: 'Tôi hiểu rồi! Đi bộ từ đây qua đó mất chừng bao lâu vậy bạn?',
      },
    ],
    suggestedResponses: [
      {
        id: 'sug-rp-1',
        hanzi: '大概十分钟就到了。',
        pinyin: 'Dàgài shí fēnzhōng jiù dào le.',
        vietnamese: 'Chừng 10 phút là tới nơi.',
      },
      {
        id: 'sug-rp-2',
        hanzi: '你可以坐地铁一号线。',
        pinyin: 'Nǐ kěyǐ zuò dìtiě yī hào xiàn.',
        vietnamese: 'Bạn có thể đi tàu điện ngầm tuyến số 1.',
      },
    ],
    usefulVocabulary: [
      { hanzi: '一直', pinyin: 'yīzhí', vietnamese: 'Cứ thẳng' },
      { hanzi: '路口', pinyin: 'lùkǒu', vietnamese: 'Ngã tư/Giao lộ' },
      { hanzi: '向右拐', pinyin: 'xiàng yòu guǎi', vietnamese: 'Rẽ phải' },
    ],
  },
  hsk_speaking: {
    topic: 'Luyện thi nói HSK Khẩu ngữ (HSKK Trung cấp)',
    initialPrompt: {
      hanzi: '请结合你的经历，谈谈学习中文对你有什么帮助？',
      pinyin: 'Qǐng jiéhé nǐ de jīnglì, tán tán xuéxí Zhōngwén duì nǐ yǒu shénme bāngzhù?',
      vietnamese: 'Hãy kết hợp trải nghiệm của bạn, nói về việc học tiếng Trung giúp ích gì cho bạn?',
    },
    sampleUserTurns: [
      {
        hanzi: '学习中文让我了解中国文化，还能认识很多新朋友。',
        pinyin: 'Xuéxí Zhōngwén ràng wǒ liǎojiě Zhōngguó wénhuà, hái néng rènshí hěn duō xīn péngyǒu.',
        vietnamese: 'Học tiếng Trung giúp tôi hiểu văn hóa Trung Quốc, còn làm quen được nhiều bạn mới.',
      },
    ],
    sampleAssistantResponses: [
      {
        hanzi: '表达非常流畅！“了解文化”和“结识新朋友”用得很地道。',
        pinyin: 'Biǎodá fēicháng liúchàng! “Liǎojiě wénhuà” hé “jiéshí xīn péngyǒu” yòng de hěn dìdao.',
        vietnamese: 'Diễn đạt rất lưu loát! Các cụm "hiểu văn hóa" và "làm quen bạn mới" dùng rất chuẩn xác.',
      },
    ],
    suggestedResponses: [
      {
        id: 'sug-hskk-1',
        hanzi: '对我未来的工作也很有帮助。',
        pinyin: 'Duì wǒ wèilái de gōngzuò yě hěn yǒu bāngzhù.',
        vietnamese: 'Đối với công việc tương lai của tôi cũng rất hữu ích.',
      },
    ],
    usefulVocabulary: [
      { hanzi: '经历', pinyin: 'jīnglì', vietnamese: 'Trải nghiệm' },
      { hanzi: '了解', pinyin: 'liǎojiě', vietnamese: 'Thấu hiểu' },
      { hanzi: '流利', pinyin: 'liúlì', vietnamese: 'Lưu loát' },
    ],
  },
};

export class VoiceSessionController {
  private state: VoiceSessionState = 'IDLE';
  private mode: VoiceSessionMode = 'daily_conversation';
  private topic: string = '';
  private hskLevel: number = 2;
  private turns: VoiceTurn[] = [];
  private interruptionCount: number = 0;
  private sessionStartTime: number = 0;
  private durationSeconds: number = 0;
  private timerInterval: any = null;
  private listeners: Set<VoiceSessionListener> = new Set();

  /**
   * Generation token to prevent stale playback timeouts from resuming playback
   * after barge-in interruption or session cancellation.
   */
  private playbackGenerationId: number = 0;
  private activeTimeouts: any[] = [];
  private mediaStream: MediaStream | null = null;
  private isMicPermissionGranted: boolean = false;

  constructor() {
    this.topic = DEFAULT_SCENARIOS.daily_conversation.topic;
  }

  getState(): VoiceSessionState {
    return this.state;
  }

  hasMicrophonePermission(): boolean {
    return this.isMicPermissionGranted;
  }

  getMode(): VoiceSessionMode {
    return this.mode;
  }

  getTopic(): string {
    return this.topic;
  }

  getTurns(): VoiceTurn[] {
    return [...this.turns];
  }

  getMetrics() {
    return {
      durationSeconds: this.durationSeconds,
      interruptionCount: this.interruptionCount,
      turnCount: this.turns.length,
    };
  }

  getScenario(): SimulationScenario {
    return DEFAULT_SCENARIOS[this.mode] || DEFAULT_SCENARIOS.daily_conversation;
  }

  subscribe(listener: VoiceSessionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(eventData?: Parameters<VoiceSessionListener>[1]) {
    this.listeners.forEach((fn) => {
      try {
        fn(this.state, eventData);
      } catch (e) {
        console.error('Error in voice session listener:', e);
      }
    });
  }

  private setState(newState: VoiceSessionState, eventData?: Parameters<VoiceSessionListener>[1]) {
    this.state = newState;
    this.notify(eventData);
  }

  /**
   * Requests audio media stream from browser, handles permission denial gracefully.
   */
  async requestMicrophone(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.isMicPermissionGranted = false;
      return false;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.isMicPermissionGranted = true;
      return true;
    } catch {
      this.isMicPermissionGranted = false;
      return false;
    }
  }

  /**
   * Starts a new interactive voice session
   */
  async startSession(
    mode: VoiceSessionMode = 'daily_conversation',
    topic?: string,
    hskLevel: number = 2
  ): Promise<void> {
    this.cancelPlayback();
    this.mode = mode;
    this.hskLevel = hskLevel;
    this.turns = [];
    this.interruptionCount = 0;
    this.durationSeconds = 0;
    this.sessionStartTime = Date.now();

    const scenario = DEFAULT_SCENARIOS[mode] || DEFAULT_SCENARIOS.daily_conversation;
    this.topic = topic || scenario.topic;

    // Start session timer
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state !== 'PAUSED' && this.state !== 'ENDED') {
        this.durationSeconds += 1;
        this.notify({ metrics: this.getMetrics() });
      }
    }, 1000);

    // Initial AI greeting turn
    const initialTurn: VoiceTurn = {
      id: 'turn-ai-' + Date.now(),
      speaker: 'assistant',
      hanzi: scenario.initialPrompt.hanzi,
      pinyin: scenario.initialPrompt.pinyin,
      vietnamese: scenario.initialPrompt.vietnamese,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    this.turns.push(initialTurn);
    this.playbackGenerationId += 1;
    const currentGen = this.playbackGenerationId;

    // Transition to SPEAKING the greeting
    this.setState('SPEAKING', { turn: initialTurn, metrics: this.getMetrics() });

    // After greeting completes (simulated ~3s speech), transition to LISTENING
    const timeout = setTimeout(() => {
      if (this.playbackGenerationId === currentGen && this.state === 'SPEAKING') {
        this.setState('LISTENING', { metrics: this.getMetrics() });
      }
    }, 2800);
    this.activeTimeouts.push(timeout);
  }

  /**
   * Starts listening to user input
   */
  startListening(): void {
    if (this.state === 'ENDED' || this.state === 'PAUSED') return;
    this.cancelPlayback();
    this.setState('LISTENING', { metrics: this.getMetrics() });
  }

  /**
   * Stops listening to user input
   */
  stopListening(): void {
    if (this.state === 'LISTENING') {
      this.setState('IDLE', { metrics: this.getMetrics() });
    }
  }

  /**
   * BARGE-IN INTERRUPTION FOUNDATION
   * Interrupts AI while it is speaking:
   * 1. Stops current audio / mock playback immediately.
   * 2. Cancels queued assistant speech and pending timers.
   * 3. Invalidates playbackGenerationId to guarantee stale speech cannot resume.
   * 4. Transitions state: SPEAKING -> INTERRUPTED -> LISTENING.
   * 5. Increments interruption count for telemetry.
   * 6. Preserves conversation turns.
   */
  interruptAssistant(): void {
    if (this.state !== 'SPEAKING' && this.state !== 'PROCESSING') {
      return;
    }

    this.interruptionCount += 1;
    this.cancelPlayback();

    // Momentary interrupted state for visual particle effect
    this.setState('INTERRUPTED', { metrics: this.getMetrics() });

    const timeout = setTimeout(() => {
      // Immediately open the microphone for user speech
      this.setState('LISTENING', { metrics: this.getMetrics() });
    }, 200);
    this.activeTimeouts.push(timeout);
  }

  /**
   * Cancels active playback and invalidates generation token
   */
  cancelPlayback(): void {
    this.playbackGenerationId += 1;
    this.activeTimeouts.forEach((t) => clearTimeout(t));
    this.activeTimeouts = [];

    // If browser speech synthesis is active, cancel it
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Simulates user sending a speech utterance (either via voice VAD, suggested response chip, or mic tap)
   */
  sendUserUtterance(turnData?: { hanzi: string; pinyin: string; vietnamese: string }): void {
    if (this.state === 'PAUSED' || this.state === 'ENDED') return;

    this.cancelPlayback();
    const scenario = this.getScenario();
    const payload =
      turnData ||
      scenario.sampleUserTurns[this.turns.filter((t) => t.speaker === 'user').length % scenario.sampleUserTurns.length];

    const userTurn: VoiceTurn = {
      id: 'turn-user-' + Date.now(),
      speaker: 'user',
      hanzi: payload.hanzi,
      pinyin: payload.pinyin,
      vietnamese: payload.vietnamese,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    this.turns.push(userTurn);
    this.setState('PROCESSING', { turn: userTurn, metrics: this.getMetrics() });

    // Simulate AI thinking and generating answer
    const currentGen = this.playbackGenerationId;
    const aiResponseTimeout = setTimeout(() => {
      if (this.playbackGenerationId !== currentGen || this.state !== 'PROCESSING') return;

      const responses = scenario.sampleAssistantResponses;
      const respIdx = (this.turns.filter((t) => t.speaker === 'assistant').length - 1) % responses.length;
      const respData = responses[Math.max(0, respIdx)];

      const aiTurn: VoiceTurn = {
        id: 'turn-ai-' + Date.now(),
        speaker: 'assistant',
        hanzi: respData.hanzi,
        pinyin: respData.pinyin,
        vietnamese: respData.vietnamese,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      this.turns.push(aiTurn);
      this.setState('SPEAKING', { turn: aiTurn, metrics: this.getMetrics() });

      // Simulate assistant speech duration (~3.2s)
      const speechTimeout = setTimeout(() => {
        if (this.playbackGenerationId === currentGen && this.state === 'SPEAKING') {
          this.setState('LISTENING', { metrics: this.getMetrics() });
        }
      }, 3200);
      this.activeTimeouts.push(speechTimeout);
    }, 1200);

    this.activeTimeouts.push(aiResponseTimeout);
  }

  /**
   * Pauses the active voice session
   */
  pauseSession(): void {
    if (this.state === 'ENDED') return;
    this.cancelPlayback();
    this.setState('PAUSED', { metrics: this.getMetrics() });
  }

  /**
   * Resumes a paused voice session
   */
  resumeSession(): void {
    if (this.state !== 'PAUSED') return;
    this.setState('LISTENING', { metrics: this.getMetrics() });
  }

  /**
   * Ends session and produces structured post-session review data
   */
  stopSession(): VoiceSessionReviewData {
    this.cancelPlayback();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.setState('ENDED', { metrics: this.getMetrics() });

    const scenario = this.getScenario();
    const durationMins = Math.max(1, Math.round(this.durationSeconds / 60));

    const review: VoiceSessionReviewData = {
      sessionId: 'voice-session-' + this.sessionStartTime,
      mode: this.mode,
      topic: this.topic,
      hskLevel: this.hskLevel,
      durationSeconds: this.durationSeconds,
      turnCount: this.turns.length,
      interruptionCount: this.interruptionCount,
      vocabularyPracticed: scenario.usefulVocabulary,
      grammarPointsObserved: [
        'Cấu trúc nguyện vọng 想 + Động từ',
        'Cách hỏi giá tiền 多少钱',
        'Lượng từ đi kèm danh từ đồ uống: 一杯...',
      ],
      completedAt: new Date().toISOString(),
      feedbackSummary: `Hoàn thành xuất sắc phiên luyện nói phản xạ "${this.topic}" trong ${durationMins} phút với ${this.turns.length} lượt tương tác. Bạn đã phản xạ rất tự nhiên với các mẫu câu giao tiếp!`,
      isDemoEvaluation: true,
      demoPronunciationScore: 88, // Clearly labeled demo score
      suggestedNextPractice: 'Luyện tập thêm bài hội thoại "Hỏi đường và Chỉ đường" để củng cố lượng từ chỉ phương hướng.',
    };

    return review;
  }
}

export const voiceSessionController = new VoiceSessionController();
