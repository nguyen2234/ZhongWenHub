import type {
  ListeningExercise,
  SpeakingPrompt,
  ReadingPassage,
  WritingExercise,
} from '../types/skill.types';

export const MOCK_LISTENING_EXERCISES: ListeningExercise[] = [
  {
    id: 'l-01',
    title: 'Hỏi đường tại ga tàu',
    hskLevel: 2,
    audioText: '请问，火车站离这里远吗？不远，往前走五百米就到了。',
    transcriptPinyin: 'Qǐngwèn, huǒchēzhàn lí zhèlǐ yuǎn ma? Bù yuǎn, wǎng qián zǒu wǔbǎi mǐ jiù dào le.',
    transcriptVietnamese: 'Xin hỏi, ga xe lửa cách đây xa không? Không xa, đi thẳng về phía trước 500 mét là tới.',
    question: 'Ga tàu cách vị trí người hỏi bao xa?',
    options: ['Rất xa', 'Cách 500 mét', 'Cách 5 km', 'Phải đi xe buýt'],
    correctOptionIndex: 1,
    explanation: 'Người trả lời nói: "不远，往前走五百米就到了" (Không xa, đi thẳng 500m là đến).',
  },
  {
    id: 'l-02',
    title: 'Đặt món tại quán trà sữa',
    hskLevel: 2,
    audioText: '服务员，我想点一杯热奶茶，少放糖，谢谢。',
    transcriptPinyin: 'Fúwùyuán, wǒ xiǎng diǎn yì bēi rè nǎichá, shǎo fàng táng, xièxie.',
    transcriptVietnamese: 'Phục vụ ơi, tôi muốn gọi một ly trà sữa nóng, ít đường, cảm ơn.',
    question: 'Khách hàng muốn uống đồ gì?',
    options: ['Trà đá nhiều đường', 'Cà phê nóng', 'Trà sữa nóng ít đường', 'Nước trái cây'],
    correctOptionIndex: 2,
    explanation: 'Khách hàng yêu cầu: "一杯热奶茶，少放糖" (1 ly trà sữa nóng, ít đường).',
  },
];

export const MOCK_SPEAKING_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'sp-01',
    scenario: 'Chào hỏi và giới thiệu nghề nghiệp',
    hskLevel: 1,
    promptText: '你好！我是李明，我是汉语老师。你叫什么名字？',
    targetPinyin: 'Nǐ hǎo! Wǒ shì Lǐ Míng, wǒ shì hànyǔ lǎoshī. Nǐ jiào shénme míngzi?',
    targetVietnamese: 'Hãy chào lại thầy Lý và tự giới thiệu tên của bạn bằng tiếng Trung.',
    hints: ['你好，李老师！', '我叫...', '很高兴认识你！'],
  },
  {
    id: 'sp-02',
    scenario: 'Hỏi giá hoa quả trong siêu thị',
    hskLevel: 2,
    promptText: '老板，这个苹果一斤多少钱？',
    targetPinyin: 'Lǎobǎn, zhège píngguǒ yì jīn duōshao qián?',
    targetVietnamese: 'Hãy hỏi người bán hàng xem táo này bao nhiêu tiền một cân.',
    hints: ['苹果 (píngguǒ): quả táo', '一斤 (yì jīn): một cân (500g)', '多少钱 (duōshao qián): bao nhiêu tiền'],
  },
];

export const MOCK_READING_PASSAGES: ReadingPassage[] = [
  {
    id: 'rp-01',
    title: 'Một ngày cuối tuần của Tiểu Hoa (小花的周末)',
    hskLevel: 2,
    contentChinese: '今天是个晴天。小花早上八点起床，吃了面包和鸡蛋。上午她去图书馆看书，下午和朋友一起在公园踢足球。晚上回到家，她帮妈妈做晚饭。小花觉得今天过得非常开心。',
    contentPinyin: 'Jīntiān shì gè qíngtiān. Xiǎohuā zǎoshang bā diǎn qǐchuáng, chī le miànbāo hé jīdàn. Shàngwǔ tā qù túshūguǎn kàn shū, xiàwǔ hé péngyou yìqǐ zài gōngyuán tī zúqiú. Wǎnshang huí dào jiā, tā bāng māma zuò wǎnfàn. Xiǎohuā juéde jīntiān guò de fēicháng kāixīn.',
    contentVietnamese: 'Hôm nay là một ngày trời nắng đẹp. Tiểu Hoa thức dậy lúc 8 giờ sáng, ăn bánh mì và trứng. Buổi sáng cô ấy đến thư viện đọc sách, buổi chiều cùng bạn bè đá bóng ở công viên. Buổi tối về đến nhà, cô ấy giúp mẹ nấu bữa tối. Tiểu Hoa cảm thấy hôm nay trôi qua rất vui vẻ.',
    questions: [
      {
        question: 'Tiểu Hoa làm gì vào buổi sáng?',
        options: ['Đá bóng ở công viên', 'Đi thư viện đọc sách', 'Đi siêu thị với mẹ', 'Ngủ cả buổi sáng'],
        correctIndex: 1,
        explanation: 'Trong bài có câu: "上午她去图书馆看书" (Buổi sáng cô ấy đến thư viện đọc sách).',
      },
      {
        question: 'Tiểu Hoa cảm thấy ngày hôm nay thế nào?',
        options: ['Rất mệt mỏi', 'Bình thường', 'Rất vui vẻ', 'Khá buồn chán'],
        correctIndex: 2,
        explanation: 'Câu cuối bài: "小花觉得今天过得非常开心" (Tiểu Hoa cảm thấy hôm nay trôi qua rất vui vẻ).',
      },
    ],
  },
];

export const MOCK_WRITING_EXERCISES: WritingExercise[] = [
  {
    id: 'w-01',
    type: 'sentence-order',
    hskLevel: 2,
    scrambledWords: ['去', '明天', '想', '北京', '我'],
    correctSentence: '我明天想去北京。',
    targetVietnamese: 'Ngày mai tôi muốn đi Bắc Kinh.',
  },
  {
    id: 'w-02',
    type: 'character-stroke',
    hskLevel: 1,
    hanzi: '学',
    pinyin: 'xué',
    meaning: 'Học, nghiên cứu',
    strokeCount: 8,
    radicals: '子 (Tử)',
  },
];
