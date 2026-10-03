import type {
  AITutorContext,
  AITutorMode,
  StructuredAIResponse,
} from '../types';

export interface ChatRequest {
  conversationId: string;
  message: string;
  mode: AITutorMode;
  context: AITutorContext;
}

export interface ChatStreamChunk {
  deltaText?: string;
  isCompleted?: boolean;
  structuredResponse?: StructuredAIResponse;
}

export class AITutorService {
  /**
   * Mock generation of contextual structured responses
   * Designed to easily swap out with `fetch('/api/ai-tutor/chat')` or WebSocket streaming.
   */
  static async sendChatMessage(
    request: ChatRequest,
    onChunk?: (chunk: ChatStreamChunk) => void
  ): Promise<StructuredAIResponse> {
    const { message, context } = request;
    const lower = message.toLowerCase();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // 1. PRACTICE ERROR USE CASE: "Tại sao tôi sai" or asking about error
    if (
      context.exerciseContext ||
      lower.includes('tại sao') ||
      lower.includes('sai') ||
      lower.includes('đáp án')
    ) {
      const ex = context.exerciseContext;
      const userAns = ex?.userAnswer || 'là';
      const rightAns = ex?.correctAnswer || '想 (xiǎng)';

      const response: StructuredAIResponse = {
        type: 'structured',
        summary: 'Phân tích lỗi sai bài tập',
        blocks: [
          {
            type: 'explanation',
            title: 'TẠI SAO CÂU CỦA BẠN CHƯA ĐÚNG?',
            content: `Trong câu "${ex?.promptHanzi || '我 ___ 喝茶。'}", bạn đã chọn "${userAns}". Tuy nhiên, đáp án đúng phải là "${rightAns}". 是 (shì) là động từ liên kết mang nghĩa "là", không thể đứng trực tiếp trước một động từ chính khác như 喝 (hē - uống).`,
            note: 'Công thức chuẩn: Chủ ngữ + 想 + Động từ + Tân ngữ (Muốn làm gì).',
          },
          {
            type: 'chinese_example',
            hanzi: '我想喝茶。',
            pinyin: 'Wǒ xiǎng hē chá.',
            vietnamese: 'Tôi muốn uống trà.',
            highlightWords: ['想', '喝'],
          },
          {
            type: 'explanation',
            title: 'LƯU Ý NGỮ PHÁP QUAN TRỌNG',
            content: 'Muốn diễn đạt ý phủ định "Không muốn", ta dùng 不想 (bù xiǎng), ví dụ: 我不想喝茶 (Tôi không muốn uống trà), tuyệt đối không nói 我不喝茶了 với nghĩa muốn.',
          },
          {
            type: 'practice',
            instruction: 'Thử sức ngay với 1 câu tương tự để kiểm tra độ hiểu:',
            exercise: {
              id: 'ai-mini-drill-1',
              type: 'fill-blank',
              title: 'Bài tập tương tự do AI đề xuất',
              instruction: 'Chọn từ chính xác để hoàn thành câu: "Tôi muốn học tiếng Trung."',
              promptHanzi: '我 ___ 学习中文。',
              promptPinyin: 'Wǒ ___ xuéxí Zhōngwén.',
              promptVietnamese: 'Tôi muốn học tiếng Trung.',
              options: ['想', '是', '有', '在'],
              correctOptionIndex: 0,
              explanation: 'Chính xác! Dùng 想 (xiǎng) trước động từ 学习 (xuéxí - học) để diễn đạt mong muốn học.',
              xpReward: 5,
            },
          },
        ],
        suggestedActions: [
          'Cho thêm 2 câu tương tự',
          'Phân biệt 想 và 要',
          'Luyện hội thoại gọi đồ uống',
        ],
      };

      if (onChunk) {
        onChunk({ isCompleted: true, structuredResponse: response });
      }
      return response;
    }

    // 2. CORRECTION USE CASE: User submits a sentence to check
    if (
      lower.includes('sửa') ||
      lower.includes('đúng chưa') ||
      lower.includes('我想喝咖啡了') ||
      lower.includes('câu này') ||
      message.includes('咖啡')
    ) {
      const response: StructuredAIResponse = {
        type: 'structured',
        summary: 'Sửa lỗi và tối ưu câu',
        blocks: [
          {
            type: 'correction',
            originalSentence: message.includes('了') ? message : '我想喝咖啡了',
            correctedSentence: '我想喝咖啡。',
            pinyin: 'Wǒ xiǎng hē kāfēi.',
            vietnamese: 'Tôi muốn uống cà phê.',
            explanation:
              'Trong ngữ cảnh biểu đạt nguyện vọng thuần túy ở hiện tại, trợ từ ngữ khí 了 (le) là dư thừa. 了 thường biểu thị hành động đã hoàn tất hoặc có sự thay đổi trạng thái đột ngột.',
            diffItems: [
              { type: 'same', text: '我想喝咖啡' },
              { type: 'removed', text: '了' },
              { type: 'added', text: '。' },
            ],
          },
          {
            type: 'chinese_example',
            hanzi: '你想喝冰咖啡还是热咖啡？',
            pinyin: 'Nǐ xiǎng hē bīng kāfēi háishi rè kāfēi?',
            vietnamese: 'Bạn muốn uống cà phê đá hay cà phê nóng?',
          },
        ],
        suggestedActions: [
          'Thử đặt câu khác với 想',
          'Khi nào thì dùng 了?',
          'Luyện hội thoại quán cà phê',
        ],
      };

      if (onChunk) {
        onChunk({ isCompleted: true, structuredResponse: response });
      }
      return response;
    }

    // 3. VOCABULARY COMPARISON / GENERAL: "Phân biệt 想 và 要"
    if (lower.includes('phân biệt') || lower.includes('想') || lower.includes('要')) {
      const response: StructuredAIResponse = {
        type: 'structured',
        summary: 'Phân biệt điểm ngữ pháp',
        blocks: [
          {
            type: 'explanation',
            title: 'SO SÁNH BẢN CHẤT: 想 (xiǎng) vs 要 (yào)',
            content:
              'Cả hai từ đều có thể dịch là "muốn", nhưng mức độ quyết tâm và sắc thái hoàn toàn khác biệt:\n\n• 想 (xiǎng): Mong muốn trong suy nghĩ, nguyện vọng chủ quan nhẹ nhàng, lịch sự ("tôi muốn / tôi dự định").\n• 要 (yào): Ý định dứt khoát, quyết tâm thực hiện, hoặc yêu cầu mạnh mẽ ("tôi muốn / tôi sẽ / tôi cần").',
          },
          {
            type: 'chinese_example',
            hanzi: '我想去中国旅游。',
            pinyin: 'Wǒ xiǎng qù Zhōngguó lǚyóu.',
            vietnamese: 'Tôi muốn đi Trung Quốc du lịch (mong muốn, kế hoạch).',
          },
          {
            type: 'chinese_example',
            hanzi: '我要一杯美式咖啡。',
            pinyin: 'Wǒ yào yībēi Měishì kāfēi.',
            vietnamese: 'Cho tôi một ly cà phê Americano (yêu cầu gọi món rõ ràng).',
          },
          {
            type: 'practice',
            instruction: 'Chọn từ phù hợp nhất cho ngữ cảnh gọi món tại quầy:',
            exercise: {
              id: 'ai-mini-drill-2',
              type: 'fill-blank',
              title: 'Gọi món ở quầy',
              instruction: 'Chọn từ diễn đạt ý dứt khoát khi gọi đồ uống:',
              promptHanzi: '你好，服务员！我 ___ 一杯热茶。',
              promptPinyin: 'Nǐ hǎo, fúwùyuán! Wǒ ___ yībēi rè chá.',
              promptVietnamese: 'Xin chào, phục vụ! Cho tôi một ly trà nóng.',
              options: ['要', '想', '看', '在'],
              correctOptionIndex: 0,
              explanation: 'Tuyệt vời! Khi gọi món trực tiếp với phục vụ, dùng 我要 (Cho tôi...) là cách nói tự nhiên và dứt khoát nhất.',
              xpReward: 5,
            },
          },
        ],
        suggestedActions: [
          'Thử đặt 1 câu với 要',
          'Luyện nghe phân biệt 想 và 要',
          'Luyện hội thoại gọi đồ uống',
        ],
      };

      if (onChunk) {
        onChunk({ isCompleted: true, structuredResponse: response });
      }
      return response;
    }

    // 4. DEFAULT CONTEXTUAL EXPLANATION
    const defaultResponse: StructuredAIResponse = {
      type: 'structured',
      summary: 'Trợ giảng giải thích',
      blocks: [
        {
          type: 'explanation',
          title: 'HƯỚNG DẪN TỪ TRỢ GIẢNG',
          content: `Về câu hỏi "${message}": Đối với trình độ HSK ${context.hskLevel || 2}, bạn nên chú trọng vào việc hình thành phản xạ câu hoàn chỉnh trước khi học sâu vào các từ hiếm.`,
        },
        {
          type: 'chinese_example',
          hanzi: '每天练习一点点，进步看得见。',
          pinyin: 'Měitiān liànxí yīdiǎndiǎn, jìnbù kàndéjiàn.',
          vietnamese: 'Mỗi ngày luyện tập một chút, tiến bộ sẽ thấy rõ.',
        },
      ],
      suggestedActions: [
        'Giải thích ngữ pháp bài đang học',
        'Cho câu luyện tập tương tự',
        'Luyện hội thoại tình huống',
      ],
    };

    if (onChunk) {
      onChunk({ isCompleted: true, structuredResponse: defaultResponse });
    }
    return defaultResponse;
  }
}
