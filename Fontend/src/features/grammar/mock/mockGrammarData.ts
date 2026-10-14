import type { GrammarPoint } from '../types/grammar.types';

export const MOCK_GRAMMAR_POINTS: GrammarPoint[] = [
  {
    id: 'g-hsk1-01',
    title: 'Câu phán đoán với 是 (shì)',
    pinyinTitle: 'shì zì jù',
    hskLevel: 1,
    category: 'câu chữ',
    structure: 'Chủ ngữ + 是 + Danh từ / Đoản ngữ danh từ',
    explanation: 'Dùng để khẳng định một người hoặc vật nào đó thuộc về một đối tượng hoặc danh tính xác định (tương đương với từ "là" trong tiếng Việt). Phủ định dùng 不是 (bú shì).',
    difficulty: 'Dễ',
    examples: [
      {
        chinese: '我是学生。',
        pinyin: 'Wǒ shì xuésheng.',
        vietnamese: 'Tôi là học sinh.',
      },
      {
        chinese: '他不是中国人，他是越南人。',
        pinyin: 'Tā bú shì Zhōngguó rén, tā shì Yuènán rén.',
        vietnamese: 'Anh ấy không phải người Trung Quốc, anh ấy là người Việt Nam.',
      },
    ],
    usageNote: 'Lưu ý: Phía trước tính từ thông thường KHÔNG dùng 是, mà dùng phó từ chỉ mức độ như 很 (hěn). Ví dụ: 他很高, không nói 他是高.',
  },
  {
    id: 'g-hsk1-02',
    title: 'Trợ từ sở hữu 的 (de)',
    pinyinTitle: 'de zì jiégòu',
    hskLevel: 1,
    category: 'trợ từ',
    structure: 'Định ngữ (Đại từ / Danh từ) + 的 + Trung tâm ngữ (Danh từ)',
    explanation: 'Biểu thị mối quan hệ sở hữu, hạn định tính chất của danh từ đi sau (tương đương với "của" trong tiếng Việt).',
    difficulty: 'Dễ',
    examples: [
      {
        chinese: '这是我的汉语老师。',
        pinyin: 'Zhè shì wǒ de hànyǔ lǎoshī.',
        vietnamese: 'Đây là giáo viên tiếng Trung của tôi.',
      },
      {
        chinese: '她的衣服很漂亮。',
        pinyin: 'Tā de yīfu hěn piàoliang.',
        vietnamese: 'Quần áo của cô ấy rất đẹp.',
      },
    ],
    usageNote: 'Khi biểu thị quan hệ gia đình thân thiết hoặc tập thể trực thuộc (bố mẹ, trường học), có thể lược bỏ 的 (Ví dụ: 我爸爸, 我家).',
  },
  {
    id: 'g-hsk2-01',
    title: 'Trợ từ động thái 了 (le) biểu thị hoàn thành',
    pinyinTitle: 'dòngtài zhùcí le',
    hskLevel: 2,
    category: 'trợ từ',
    structure: 'Động từ + 了 + Tân ngữ',
    explanation: 'Đứng sau động từ để biểu thị hành động đã xảy ra hoặc hoàn tất. Phủ định dùng 没 / 没有 + Động từ (lược bỏ 了).',
    difficulty: 'Trung bình',
    examples: [
      {
        chinese: '我吃了早饭就去学校。',
        pinyin: 'Wǒ chī le zǎofàn jiù qù xuéxiào.',
        vietnamese: 'Tôi ăn xong bữa sáng là đến trường ngay.',
      },
      {
        chinese: '昨天我买了两本书。',
        pinyin: 'Zuótiān wǒ mǎi le liǎng běn shū.',
        vietnamese: 'Hôm qua tôi đã mua hai cuốn sách.',
      },
    ],
    usageNote: 'Phủ định không dùng 不...了 khi nói về quá khứ, phải dùng 没... (Ví dụ: 我没吃早饭).',
  },
  {
    id: 'g-hsk2-02',
    title: 'Cấu trúc so sánh hơn với 比 (bǐ)',
    pinyinTitle: 'bǐ zì jù',
    hskLevel: 2,
    category: 'cơ bản',
    structure: 'A + 比 + B + Tính từ (+ Số lượng / 多了 / 一点儿)',
    explanation: 'Dùng để so sánh sự chênh lệch tính chất hoặc mức độ giữa đối tượng A và đối tượng B.',
    difficulty: 'Trung bình',
    examples: [
      {
        chinese: '哥哥比我高。',
        pinyin: 'Gēge bǐ wǒ gāo.',
        vietnamese: 'Anh trai cao hơn tôi.',
      },
      {
        chinese: '今天比昨天冷一点儿。',
        pinyin: 'Jīntiān bǐ zuótiān lěng yìdiǎnr.',
        vietnamese: 'Hôm nay lạnh hơn hôm qua một chút.',
      },
    ],
    usageNote: 'Không dùng 很, 非常 sau tính từ trong câu chữ 比. Không nói: 哥哥比我很高 (sai).',
  },
  {
    id: 'g-hsk3-01',
    title: 'Cấu trúc đồng thời 一边...一边... (yìbiān... yìbiān...)',
    pinyinTitle: 'yìbiān... yìbiān...',
    hskLevel: 3,
    category: 'liên từ',
    structure: 'Chủ ngữ + 一边 + Động từ 1 + 一边 + Động từ 2',
    explanation: 'Diễn tả hai hành động diễn ra song song cùng một thời điểm ("vừa... vừa...").',
    difficulty: 'Trung bình',
    examples: [
      {
        chinese: '我们一边喝茶一边聊天。',
        pinyin: 'Wǒmen yìbiān hē chá yìbiān liáotiān.',
        vietnamese: 'Chúng tôi vừa uống trà vừa trò chuyện.',
      },
      {
        chinese: '他喜欢一边听音乐一边做作业。',
        pinyin: 'Tā xǐhuan yìbiān tīng yīnyuè yìbiān zuò zuòyè.',
        vietnamese: 'Cậu ấy thích vừa nghe nhạc vừa làm bài tập.',
      },
    ],
  },
  {
    id: 'g-hsk3-02',
    title: 'Câu chữ 把 (bǎ) căn bản',
    pinyinTitle: 'bǎ zì jù',
    hskLevel: 3,
    category: 'câu chữ',
    structure: 'Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác (了/ở đâu/cho ai)',
    explanation: 'Nhấn mạnh hành động tác động lên đối tượng làm thay đổi trạng thái hoặc vị trí của nó.',
    difficulty: 'Khá',
    examples: [
      {
        chinese: '请把门关上。',
        pinyin: 'Qǐng bǎ mén guān shàng.',
        vietnamese: 'Xin hãy đóng cửa lại.',
      },
      {
        chinese: '我已经把作业做完了。',
        pinyin: 'Wǒ yǐjīng bǎ zuòyè zuò wán le.',
        vietnamese: 'Tôi đã làm xong bài tập rồi.',
      },
    ],
    usageNote: 'Động từ trong câu chữ 把 bắt buộc phải mang theo thành phần bổ ngữ hoặc biến đổi (như 了, 在, 给...).',
  },
];
