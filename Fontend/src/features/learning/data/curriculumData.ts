export interface CurriculumLesson {
  id: string; // e.g. 'les-1', 'les-8'
  lessonNumber: number;
  hskLevel: number;
  unitNumber: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  summary: string;
  durationMinutes: number;
  xpReward: number;
  grammarPointIds: string[];
  vocabularyIds: string[];
}

export interface CurriculumUnit {
  id: number;
  unitNumber: number;
  hskLevel: number;
  hanziTitle: string;
  pinyinTitle: string;
  vietnameseTitle: string;
  milestoneBadge: string;
  milestoneXp: number;
  unlockCondition?: string;
  lessons: CurriculumLesson[];
}

export interface CurriculumHskLevel {
  level: number;
  name: string;
  code: string;
  vietnameseName: string;
  totalLessons: number;
  totalWords: number;
  color: string;
  units: CurriculumUnit[];
}

export const HSK_CURRICULUM: Record<number, CurriculumHskLevel> = {
  1: {
    level: 1,
    name: 'HSK 1',
    code: 'HSK1',
    vietnameseName: 'Nhập môn',
    totalLessons: 15,
    totalWords: 150,
    color: 'var(--hsk1, #10b981)',
    units: [
      {
        id: 101,
        unitNumber: 1,
        hskLevel: 1,
        hanziTitle: '你好与问候',
        pinyinTitle: 'Nǐ hǎo yǔ wènhòu',
        vietnameseTitle: 'Chào hỏi & Làm quen',
        milestoneBadge: 'Huy hiệu Khởi đầu thuận lợi',
        milestoneXp: 80,
        lessons: [
          {
            id: 'les-hsk1-1',
            lessonNumber: 1,
            hskLevel: 1,
            unitNumber: 1,
            hanzi: '你好！',
            pinyin: 'Nǐ hǎo!',
            meaning: 'Xin chào',
            summary: 'Làm quen với đại từ xưng hô cơ bản và cách chào hỏi lịch sự.',
            durationMinutes: 10,
            xpReward: 20,
            grammarPointIds: ['gp-hsk1-1'],
            vocabularyIds: ['vocab-hsk1-1'],
          },
          {
            id: 'les-hsk1-2',
            lessonNumber: 2,
            hskLevel: 1,
            unitNumber: 1,
            hanzi: '谢谢你！',
            pinyin: 'Xièxie nǐ!',
            meaning: 'Cảm ơn bạn',
            summary: 'Học cách nói cảm ơn và đáp lại 不客气 (không có gì).',
            durationMinutes: 10,
            xpReward: 20,
            grammarPointIds: ['gp-hsk1-2'],
            vocabularyIds: ['vocab-hsk1-2', 'vocab-hsk1-3'],
          },
          {
            id: 'les-hsk1-3',
            lessonNumber: 3,
            hskLevel: 1,
            unitNumber: 1,
            hanzi: '你是哪国人？',
            pinyin: 'Nǐ shì nǎ guó rén?',
            meaning: 'Bạn là người nước nào?',
            summary: 'Hỏi quốc tịch, tên các nước thông dụng và giới thiệu bản thân.',
            durationMinutes: 12,
            xpReward: 20,
            grammarPointIds: ['gp-hsk1-3'],
            vocabularyIds: ['vocab-hsk1-4'],
          },
          {
            id: 'les-hsk1-4',
            lessonNumber: 4,
            hskLevel: 1,
            unitNumber: 1,
            hanzi: '她是谁？',
            pinyin: 'Tā shì shéi?',
            meaning: 'Cô ấy là ai?',
            summary: 'Đại từ nhân xưng ngôi thứ 3 và từ để hỏi 谁 (ai).',
            durationMinutes: 12,
            xpReward: 20,
            grammarPointIds: ['gp-hsk1-4'],
            vocabularyIds: ['vocab-hsk1-5'],
          },
          {
            id: 'les-hsk1-5',
            lessonNumber: 5,
            hskLevel: 1,
            unitNumber: 1,
            hanzi: '今天几号？',
            pinyin: 'Jīntiān jǐ hào?',
            meaning: 'Hôm nay ngày mấy?',
            summary: 'Cách nói ngày tháng trong tuần và số đếm cơ bản trong tiếng Trung.',
            durationMinutes: 12,
            xpReward: 25,
            grammarPointIds: ['gp-hsk1-5'],
            vocabularyIds: ['vocab-hsk1-6'],
          },
          {
            id: 'les-hsk1-6',
            lessonNumber: 6,
            hskLevel: 1,
            unitNumber: 1,
            hanzi: '你想喝什么？',
            pinyin: 'Nǐ xiǎng hē shénme?',
            meaning: 'Bạn muốn uống gì?',
            summary: 'Hội thoại gọi món, đồ uống và cách dùng động từ năng nguyện 想.',
            durationMinutes: 15,
            xpReward: 30,
            grammarPointIds: ['gp-hsk1-6'],
            vocabularyIds: ['vocab-hsk1-7'],
          },
        ],
      },
    ],
  },
  2: {
    level: 2,
    name: 'HSK 2',
    code: 'HSK2',
    vietnameseName: 'Sơ cấp',
    totalLessons: 18,
    totalWords: 300,
    color: 'var(--hsk2, #0d9488)',
    units: [
      {
        id: 1,
        unitNumber: 1,
        hskLevel: 2,
        hanziTitle: '日常问候与介绍',
        pinyinTitle: 'Rìcháng wènhòu yǔ jièshào',
        vietnameseTitle: 'Chào hỏi & Giới thiệu trang trọng',
        milestoneBadge: 'Huy hiệu Khéo ăn nói',
        milestoneXp: 100,
        lessons: [
          {
            id: 'les-1',
            lessonNumber: 1,
            hskLevel: 2,
            unitNumber: 1,
            hanzi: '您贵姓？',
            pinyin: 'Nín guìxìng?',
            meaning: 'Hỏi họ và xưng hô lịch sự',
            summary: 'Cách dùng đại từ kính trọng 您 (nín) và cấu trúc hỏi họ trang trọng.',
            durationMinutes: 10,
            xpReward: 20,
            grammarPointIds: ['gp-1'],
            vocabularyIds: ['vocab-1-1'],
          },
          {
            id: 'les-2',
            lessonNumber: 2,
            hskLevel: 2,
            unitNumber: 1,
            hanzi: '好久不见！',
            pinyin: 'Hǎojiǔ bùjiàn!',
            meaning: 'Lâu ngày không gặp',
            summary: 'Mẫu câu chào hỏi khi gặp lại người quen và hỏi thăm sức khỏe.',
            durationMinutes: 12,
            xpReward: 20,
            grammarPointIds: ['gp-2'],
            vocabularyIds: ['vocab-2-1', 'vocab-2-2'],
          },
          {
            id: 'les-3',
            lessonNumber: 3,
            hskLevel: 2,
            unitNumber: 1,
            hanzi: '认识你很高兴',
            pinyin: 'Rènshi nǐ hěn gāoxìng',
            meaning: 'Rất vui được làm quen với bạn',
            summary: 'Cách đáp lại lời giới thiệu và mở rộng các mối quan hệ bạn bè.',
            durationMinutes: 15,
            xpReward: 25,
            grammarPointIds: ['gp-3'],
            vocabularyIds: ['vocab-3-1', 'vocab-3-2'],
          },
          {
            id: 'les-4',
            lessonNumber: 4,
            hskLevel: 2,
            unitNumber: 1,
            hanzi: '第一单元复习与测验',
            pinyin: 'Dì-yī dānyuán fùxí yǔ cèyàn',
            meaning: 'Ôn tập & Kiểm tra Unit 1',
            summary: 'Tổng hợp 30 từ vựng và 4 mẫu câu then chốt của Unit 1.',
            durationMinutes: 15,
            xpReward: 35,
            grammarPointIds: ['gp-4'],
            vocabularyIds: ['vocab-4-1'],
          },
        ],
      },
      {
        id: 2,
        unitNumber: 2,
        hskLevel: 2,
        hanziTitle: '餐厅与买东西',
        pinyinTitle: 'Cāntīng yǔ mǎi dōngxi',
        vietnameseTitle: 'Ẩm thực & Mua sắm hàng ngày',
        milestoneBadge: 'Huy hiệu Mua sắm sành sỏi',
        milestoneXp: 120,
        lessons: [
          {
            id: 'les-5',
            lessonNumber: 5,
            hskLevel: 2,
            unitNumber: 2,
            hanzi: '这个多少钱？',
            pinyin: 'Zhège duōshǎo qián?',
            meaning: 'Cái này bao nhiêu tiền?',
            summary: 'Cách dùng từ để hỏi 多少 (duōshǎo) và các đơn vị tiền tệ cơ bản.',
            durationMinutes: 15,
            xpReward: 25,
            grammarPointIds: ['gp-5'],
            vocabularyIds: ['vocab-5-1', 'vocab-5-2'],
          },
          {
            id: 'les-6',
            lessonNumber: 6,
            hskLevel: 2,
            unitNumber: 2,
            hanzi: '我要买苹果',
            pinyin: 'Wǒ yào mǎi píngguǒ',
            meaning: 'Tôi muốn mua táo',
            summary: 'Tên các loại hoa quả thông dụng và cách dùng lượng từ chỉ cân nặng.',
            durationMinutes: 12,
            xpReward: 20,
            grammarPointIds: ['gp-6'],
            vocabularyIds: ['vocab-6-1', 'vocab-6-2'],
          },
          {
            id: 'les-7',
            lessonNumber: 7,
            hskLevel: 2,
            unitNumber: 2,
            hanzi: '一共多少钱？',
            pinyin: 'Yīgòng duōshǎo qián?',
            meaning: 'Tổng cộng hết bao nhiêu tiền?',
            summary: 'Cách tính tổng hóa đơn, trả tiền mặt và hỏi phương thức thanh toán.',
            durationMinutes: 15,
            xpReward: 25,
            grammarPointIds: ['gp-7'],
            vocabularyIds: ['vocab-7-1', 'vocab-7-2'],
          },
          {
            id: 'les-8',
            lessonNumber: 8,
            hskLevel: 2,
            unitNumber: 2,
            hanzi: '你想喝什么？',
            pinyin: 'Nǐ xiǎng hē shénme?',
            meaning: 'Bạn muốn uống gì?',
            summary: 'Hỏi đồ uống tại quán cà phê/trà sữa, cách dùng trợ động từ 想 (muốn) và lượng từ 杯 (ly/cốc).',
            durationMinutes: 15,
            xpReward: 30,
            grammarPointIds: ['gp-xiang', 'gp-bei'],
            vocabularyIds: ['vocab-8-1', 'vocab-8-2', 'vocab-8-3', 'vocab-8-4', 'vocab-8-5', 'vocab-8-6'],
          },
          {
            id: 'les-9',
            lessonNumber: 9,
            hskLevel: 2,
            unitNumber: 2,
            hanzi: '来两杯冰绿茶',
            pinyin: 'Lái liǎng bēi bīng lǜchá',
            meaning: 'Cho tôi hai ly trà xanh đá',
            summary: 'Cách dùng động từ 来 trong gọi món và số từ 两 trước lượng từ.',
            durationMinutes: 15,
            xpReward: 30,
            grammarPointIds: ['gp-lai', 'gp-liang'],
            vocabularyIds: ['vocab-8-3', 'vocab-8-6'],
          },
        ],
      },
      {
        id: 3,
        unitNumber: 3,
        hskLevel: 2,
        hanziTitle: '时间与日程安排',
        pinyinTitle: 'Shíjiān yǔ rìchéng ānpái',
        vietnameseTitle: 'Thời gian & Lịch trình sinh hoạt',
        milestoneBadge: 'Huy hiệu Quản lý thời gian',
        milestoneXp: 130,
        unlockCondition: 'Hoàn thành Bài 8 trong Unit 2 để mở khóa',
        lessons: [
          {
            id: 'les-10',
            lessonNumber: 10,
            hskLevel: 2,
            unitNumber: 3,
            hanzi: '现在几点？',
            pinyin: 'Xiànzài jǐ diǎn?',
            meaning: 'Bây giờ là mấy giờ?',
            summary: 'Cách xem giờ, phút, rưỡi (半) và các khoảng thời gian sáng, trưa, tối.',
            durationMinutes: 15,
            xpReward: 25,
            grammarPointIds: ['gp-time'],
            vocabularyIds: ['vocab-5-1'],
          },
          {
            id: 'les-11',
            lessonNumber: 11,
            hskLevel: 2,
            unitNumber: 3,
            hanzi: '你的生日是几月几号？',
            pinyin: 'Nǐ de shēngrì shì jǐ yuè jǐ hào?',
            meaning: 'Sinh nhật bạn là ngày mấy tháng mấy?',
            summary: 'Cách nói ngày tháng năm trong tiếng Trung theo trật tự Năm - Tháng - Ngày.',
            durationMinutes: 12,
            xpReward: 20,
            grammarPointIds: ['gp-date'],
            vocabularyIds: ['vocab-5-2'],
          },
          {
            id: 'les-12',
            lessonNumber: 12,
            hskLevel: 2,
            unitNumber: 3,
            hanzi: '星期天你做什么？',
            pinyin: 'Xīngqītiān nǐ zuò shénme?',
            meaning: 'Chủ nhật bạn làm gì?',
            summary: 'Thứ trong tuần và diễn đạt các hoạt động ngày nghỉ.',
            durationMinutes: 15,
            xpReward: 25,
            grammarPointIds: ['gp-week'],
            vocabularyIds: ['vocab-6-1'],
          },
        ],
      },
      {
        id: 4,
        unitNumber: 4,
        hskLevel: 2,
        hanziTitle: '交通与出行',
        pinyinTitle: 'Jiāotōng yǔ chūxíng',
        vietnameseTitle: 'Phương tiện giao thông & Đi lại',
        milestoneBadge: 'Huy hiệu Nhà du hành',
        milestoneXp: 140,
        unlockCondition: 'Hoàn thành Unit 3 để mở khóa',
        lessons: [
          {
            id: 'les-13',
            lessonNumber: 13,
            hskLevel: 2,
            unitNumber: 4,
            hanzi: '你怎么去学校？',
            pinyin: 'Nǐ zěnme qù xuéxiào?',
            meaning: 'Bạn đến trường bằng phương tiện gì?',
            summary: 'Cách dùng các động từ di chuyển 坐, 骑, 开.',
            durationMinutes: 15,
            xpReward: 25,
            grammarPointIds: ['gp-transport'],
            vocabularyIds: ['vocab-7-1'],
          },
          {
            id: 'les-14',
            lessonNumber: 14,
            hskLevel: 2,
            unitNumber: 4,
            hanzi: '请问，地铁站在哪儿？',
            pinyin: 'Qǐngwèn, dìtiězhàn zài nǎr?',
            meaning: 'Xin hỏi, ga tàu điện ngầm ở đâu?',
            summary: 'Hỏi phương hướng, vị trí và cách chỉ đường.',
            durationMinutes: 15,
            xpReward: 25,
            grammarPointIds: ['gp-direction'],
            vocabularyIds: ['vocab-7-2'],
          },
        ],
      },
    ],
  },
  3: {
    level: 3,
    name: 'HSK 3',
    code: 'HSK3',
    vietnameseName: 'Trung cấp 1',
    totalLessons: 24,
    totalWords: 600,
    color: 'var(--hsk3, #0284c7)',
    units: [
      {
        id: 301,
        unitNumber: 1,
        hskLevel: 3,
        hanziTitle: '周末与旅行计划',
        pinyinTitle: 'Zhōumò yǔ lǚxíng jìhuà',
        vietnameseTitle: 'Kế hoạch cuối tuần & Du lịch',
        milestoneBadge: 'Huy hiệu Khám phá',
        milestoneXp: 150,
        unlockCondition: 'Đạt chuẩn HSK 2 để mở khóa',
        lessons: [
          {
            id: 'les-hsk3-1',
            lessonNumber: 1,
            hskLevel: 3,
            unitNumber: 1,
            hanzi: '周末你有什么打算？',
            pinyin: 'Zhōumò nǐ yǒu shénme dǎsuan?',
            meaning: 'Cuối tuần bạn có dự định gì?',
            summary: 'Lên kế hoạch đi chơi, sử dụng câu chữ 打算 và phó từ 一直.',
            durationMinutes: 18,
            xpReward: 35,
            grammarPointIds: ['gp-hsk3-1'],
            vocabularyIds: [],
          },
        ],
      },
    ],
  },
  4: {
    level: 4,
    name: 'HSK 4',
    code: 'HSK4',
    vietnameseName: 'Trung cấp 2',
    totalLessons: 30,
    totalWords: 1200,
    color: 'var(--hsk4, #6366f1)',
    units: [
      {
        id: 401,
        unitNumber: 1,
        hskLevel: 4,
        hanziTitle: '爱情与人际关系',
        pinyinTitle: 'Àiqíng yǔ rénjì guānxì',
        vietnameseTitle: 'Tình cảm & Mối quan hệ',
        milestoneBadge: 'Huy hiệu Tri kỷ',
        milestoneXp: 180,
        unlockCondition: 'Hoàn thành HSK 3',
        lessons: [
          {
            id: 'les-hsk4-1',
            lessonNumber: 1,
            hskLevel: 4,
            unitNumber: 1,
            hanzi: '简单的爱情',
            pinyin: 'Jiǎndān de àiqíng',
            meaning: 'Tình yêu giản dị',
            summary: 'Bày tỏ quan điểm về tình yêu và hôn nhân, cách dùng 不仅...而且...',
            durationMinutes: 20,
            xpReward: 40,
            grammarPointIds: ['gp-hsk4-1'],
            vocabularyIds: [],
          },
        ],
      },
    ],
  },
  5: {
    level: 5,
    name: 'HSK 5',
    code: 'HSK5',
    vietnameseName: 'Cao cấp 1',
    totalLessons: 36,
    totalWords: 2500,
    color: 'var(--hsk5, #d97706)',
    units: [
      {
        id: 501,
        unitNumber: 1,
        hskLevel: 5,
        hanziTitle: '职场与商业沟通',
        pinyinTitle: 'Zhíchǎng yǔ shāngyè gōutōng',
        vietnameseTitle: 'Công sở & Đàm phán kinh doanh',
        milestoneBadge: 'Huy hiệu Doanh nhân',
        milestoneXp: 220,
        unlockCondition: 'Hoàn thành HSK 4',
        lessons: [
          {
            id: 'les-hsk5-1',
            lessonNumber: 1,
            hskLevel: 5,
            unitNumber: 1,
            hanzi: '面试的艺术',
            pinyin: 'Miànshì de yìshù',
            meaning: 'Nghệ thuật phỏng vấn xin việc',
            summary: 'Kỹ năng trả lời câu hỏi tuyển dụng chuyên nghiệp.',
            durationMinutes: 25,
            xpReward: 50,
            grammarPointIds: ['gp-hsk5-1'],
            vocabularyIds: [],
          },
        ],
      },
    ],
  },
  6: {
    level: 6,
    name: 'HSK 6',
    code: 'HSK6',
    vietnameseName: 'Cao cấp 2',
    totalLessons: 40,
    totalWords: 5000,
    color: 'var(--hsk6, #dc2626)',
    units: [
      {
        id: 601,
        unitNumber: 1,
        hskLevel: 6,
        hanziTitle: '文学与社会哲学',
        pinyinTitle: 'Wénxué yǔ shèhuì zhéxué',
        vietnameseTitle: 'Văn học & Triết học xã hội',
        milestoneBadge: 'Huy hiệu Học giả',
        milestoneXp: 260,
        unlockCondition: 'Hoàn thành HSK 5',
        lessons: [
          {
            id: 'les-hsk6-1',
            lessonNumber: 1,
            hskLevel: 6,
            unitNumber: 1,
            hanzi: '阅读古典名著',
            pinyin: 'Yuèdú gǔdiǎn míngzhù',
            meaning: 'Đọc tác phẩm văn học cổ điển',
            summary: 'Phân tích văn phong cổ thư và cấu trúc thành ngữ 4 chữ.',
            durationMinutes: 30,
            xpReward: 60,
            grammarPointIds: ['gp-hsk6-1'],
            vocabularyIds: [],
          },
        ],
      },
    ],
  },
  7: {
    level: 7,
    name: 'HSK 7–9',
    code: 'HSK7-9',
    vietnameseName: 'Chuyên gia & Dịch thuật',
    totalLessons: 50,
    totalWords: 11000,
    color: 'var(--hsk7-9, #7c3aed)',
    units: [
      {
        id: 701,
        unitNumber: 1,
        hskLevel: 7,
        hanziTitle: '同声传译与专业学术',
        pinyinTitle: 'Tóngshēng chuányì yǔ zhuānyè xuéshù',
        vietnameseTitle: 'Biên phiên dịch & Luận văn học thuật',
        milestoneBadge: 'Huy hiệu Chuyên gia Quốc tế',
        milestoneXp: 300,
        unlockCondition: 'Hoàn thành HSK 6',
        lessons: [
          {
            id: 'les-hsk7-1',
            lessonNumber: 1,
            hskLevel: 7,
            unitNumber: 1,
            hanzi: '汉越学术文献互译',
            pinyin: 'Hàn-Yuè xuéshù wénxiàn hùyì',
            meaning: 'Dịch thuật tài liệu học thuật Hán - Việt',
            summary: 'Quy chuẩn dịch thuật chuyên ngành văn bản học thuật và kinh tế đối ngoại.',
            durationMinutes: 35,
            xpReward: 80,
            grammarPointIds: ['gp-hsk7-1'],
            vocabularyIds: [],
          },
        ],
      },
    ],
  },
};

export function getAllCurriculumLessons(): CurriculumLesson[] {
  const result: CurriculumLesson[] = [];
  Object.values(HSK_CURRICULUM).forEach((level) => {
    level.units.forEach((unit) => {
      result.push(...unit.lessons);
    });
  });
  return result;
}

export function findLessonMetadata(lessonId: string): CurriculumLesson | undefined {
  const all = getAllCurriculumLessons();
  return all.find((l) => l.id === lessonId || String(l.lessonNumber) === lessonId || l.id === `les-${lessonId}`);
}

export function findNextLessonId(currentLessonId: string): string | null {
  const all = getAllCurriculumLessons();
  const idx = all.findIndex((l) => l.id === currentLessonId || String(l.lessonNumber) === currentLessonId || l.id === `les-${currentLessonId}`);
  if (idx >= 0 && idx < all.length - 1) {
    return all[idx + 1].id;
  }
  return null;
}
