import xinChao from './01_xin_chao.png';
import hocBai from './02_hoc_bai.png';
import flashcard from './03_flashcard.png';
import vietChuHan from './04_viet_chu_han.png';
import luyenNghe from './05_luyen_nghe.png';
import luyenNoi from './06_luyen_noi.png';
import aiTutor from './07_ai_tutor.png';
import hoanThanhBai from './08_hoan_thanh_bai.png';
import traLoiDung from './09_tra_loi_dung.png';
import traLoiSai from './10_tra_loi_sai.png';
import coVu from './11_co_vu.png';
import suyNghi from './12_suy_nghi.png';
import goiY from './13_goi_y.png';
import cupThanhTich from './14_cup_thanh_tich.png';
import chuoiNgayHoc from './15_chuoi_ngay_hoc.png';
import onTap from './16_on_tap.png';
import trangTrong from './17_trang_trong.png';
import dangTai from './18_dang_tai.png';
import chucNguNgon from './19_chuc_ngu_ngon.png';
import yTuong from './20_y_tuong.png';

/**
 * Registry of all Chibi Ao Dai mascot stickers with semantic keys
 */
export const STICKERS = {
  welcome: xinChao,
  learning: hocBai,
  vocabulary: flashcard,
  writing: vietChuHan,
  listening: luyenNghe,
  speaking: luyenNoi,
  aiTutor: aiTutor,
  completion: hoanThanhBai,
  correct: traLoiDung,
  incorrect: traLoiSai,
  cheering: coVu,
  thinking: suyNghi,
  hint: goiY,
  trophy: cupThanhTich,
  streak: chuoiNgayHoc,
  review: onTap,
  empty: trangTrong,
  loading: dangTai,
  goodnight: chucNguNgon,
  idea: yTuong,
} as const;

export type StickerName = keyof typeof STICKERS;

/**
 * Standard sticker size presets (in pixels)
 */
export const STICKER_SIZES = {
  xs: 32,
  sm: 48,
  md: 72,
  lg: 104,
  xl: 136,
} as const;

export type StickerSizePreset = keyof typeof STICKER_SIZES;

export interface StickerMeta {
  name: StickerName;
  label: string;
  category: 'welcome' | 'learning' | 'skill' | 'ai' | 'gamification' | 'system';
}

export const STICKER_METADATA: Record<StickerName, StickerMeta> = {
  welcome: { name: 'welcome', label: 'Bé Chibi chào mừng (Xin chào)', category: 'welcome' },
  learning: { name: 'learning', label: 'Bé Chibi học bài chăm chỉ', category: 'learning' },
  vocabulary: { name: 'vocabulary', label: 'Bé Chibi cầm flashcard từ vựng', category: 'skill' },
  writing: { name: 'writing', label: 'Bé Chibi cầm cọ viết chữ Hán', category: 'skill' },
  listening: { name: 'listening', label: 'Bé Chibi đeo tai nghe luyện nghe', category: 'skill' },
  speaking: { name: 'speaking', label: 'Bé Chibi cầm micro luyện nói', category: 'skill' },
  aiTutor: { name: 'aiTutor', label: 'Bé Chibi trợ lý AI ZhongWen', category: 'ai' },
  completion: { name: 'completion', label: 'Bé Chibi hoàn thành bài học', category: 'gamification' },
  correct: { name: 'correct', label: 'Bé Chibi trả lời đúng', category: 'gamification' },
  incorrect: { name: 'incorrect', label: 'Bé Chibi trả lời sai', category: 'gamification' },
  cheering: { name: 'cheering', label: 'Bé Chibi cổ vũ cố lên', category: 'gamification' },
  thinking: { name: 'thinking', label: 'Bé Chibi suy nghĩ', category: 'learning' },
  hint: { name: 'hint', label: 'Bé Chibi gợi ý học tập', category: 'learning' },
  trophy: { name: 'trophy', label: 'Bé Chibi ôm cúp thành tích', category: 'gamification' },
  streak: { name: 'streak', label: 'Bé Chibi với ngọn lửa chuỗi ngày streak', category: 'gamification' },
  review: { name: 'review', label: 'Bé Chibi ôn tập kiến thức', category: 'learning' },
  empty: { name: 'empty', label: 'Bé Chibi trang trống chưa có dữ liệu', category: 'system' },
  loading: { name: 'loading', label: 'Bé Chibi đang tải dữ liệu', category: 'system' },
  goodnight: { name: 'goodnight', label: 'Bé Chibi chúc ngủ ngon', category: 'system' },
  idea: { name: 'idea', label: 'Bé Chibi có ý tưởng mới', category: 'learning' },
};
