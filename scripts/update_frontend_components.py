import os

# 1. Update VocabularyDetailDrawer.tsx
drawer_path = r'Fontend\src\management\admin\content\components\VocabularyDetailDrawer.tsx'
with open(drawer_path, 'r', encoding='utf-8') as f:
    c = f.read().replace('\r\n', '\n')

# Add imports
old_import = "import {\n  X,\n  Edit3,\n  Save,\n  Plus,\n  Trash2,\n  ChevronLeft,\n  ChevronRight,\n  Sparkles,\n  CheckCircle,\n  ArrowRight,\n  AlertTriangle,\n} from 'lucide-react';"
new_import = """import {
  X,
  Edit3,
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Clock,
  Send,
  XCircle,
  Copy,
} from 'lucide-react';

const HSK2_AMBIGUOUS_WORDS: Record<string, string> = {
  '别': 'Từ đồng hình / đa âm HSK 2: Nghĩa HSK 2 chuẩn là "đừng, chớ" (phó từ cấm đoán) hoặc "khác" (biérén). Tuyệt đối không chọn nghĩa danh từ riêng họ Bie.',
  '打': 'Từ đa nghĩa HSK 2: Nghĩa HSK 2 chuẩn là "gọi (điện thoại: dǎ diànhuà)", "đánh, chơi (bóng)". Không chọn nghĩa đơn vị "tá [dozen]".',
  '花': 'Từ đa nghĩa / đồng hình: HSK 2 có động từ "tiêu (tiền/thời gian)" và danh từ "hoa". Cần ghi rõ cả 2 nghĩa hoặc chọn nghĩa phù hợp ngữ cảnh.',
  '等': 'Từ đa nghĩa HSK 2: Nghĩa chuẩn là "đợi, chờ" (động từ). Tránh các nghĩa cổ, loại hoặc đẳng cấp.',
  '点': 'Từ đa nghĩa HSK 2: Nghĩa chuẩn gồm "giờ" (thời gian), "một chút" (yìdiǎnr), "gọi món / thắp đèn".',
  '得': 'Từ đa âm (de/dé/děi): HSK 2 dùng trợ từ trình độ "de" (chạy nhanh) hoặc động từ "děi" (phải làm). Kiểm tra kỹ âm đọc.',
  '好': 'Từ đa nghĩa: HSK 2 ngoài nghĩa "tốt, đẹp" còn làm phó từ "rất" (hǎochī) hoặc trạng thái hoàn thành.',
  '过': 'Trợ từ động thái HSK 2: Biểu thị kinh nghiệm "đã từng (guò)", hoặc động từ "qua, đón (sinh nhật)".',
  '回': 'Động từ "về" (huíjiā) hoặc lượng từ "lần, hồi".',
  '白': 'Tính từ "trắng" hoặc phó từ "làm không công, vô ích".',
  '件': 'Lượng từ cho quần áo hoặc sự việc.',
  '次': 'Lượng từ "lần, lượt" trong HSK 2.',
  '对': 'Tính từ "đúng" hoặc giới từ "đối với" trong HSK 2.',
};"""

assert old_import in c, 'old_import not found'
c = c.replace(old_import, new_import, 1)

# Add reviewNotes state & apply CVDICT suggestion
old_state = "  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');\n  const [examples, setExamples] = useState<VocabularyExample[]>([]);"
new_state = """  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [examples, setExamples] = useState<VocabularyExample[]>([]);"""

assert old_state in c, 'old_state not found'
c = c.replace(old_state, new_state, 1)

old_use_effect = "      setStatus(vocabulary.status);\n      setExamples(vocabulary.examples.map((e) => ({ ...e })));"
new_use_effect = """      setStatus(vocabulary.status);
      setReviewNotes(vocabulary.reviewNotes || '');
      setExamples(vocabulary.examples.map((e) => ({ ...e })));"""

assert old_use_effect in c, 'old_use_effect not found'
c = c.replace(old_use_effect, new_use_effect, 1)

old_apply_sugg = """    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.meaningVi;
      return updated;
    });
  };"""

new_apply_sugg = """    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.meaningVi;
      return updated;
    });
  };

  const handleApplyCvdictSuggestion = () => {
    if (!vocabulary.suggestedMeaningVi) return;
    setMeaningVi(vocabulary.suggestedMeaningVi);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.meaningVi;
      return updated;
    });
  };"""

assert old_apply_sugg in c, 'old_apply_sugg not found'
c = c.replace(old_apply_sugg, new_apply_sugg, 1)

old_save_dto = """          sourceId: vocabulary.sourceId,
          sourceDataset: vocabulary.sourceDataset,
          sourceEntryId: vocabulary.sourceEntryId,
          entry: vocabulary.entry,
          homograph: vocabulary.homograph,
          levelLabel: vocabulary.levelLabel,
          sourcePdfPage: vocabulary.sourcePdfPage,"""

new_save_dto = """          sourceId: vocabulary.sourceId,
          sourceDataset: vocabulary.sourceDataset,
          sourceEntryId: vocabulary.sourceEntryId,
          suggestedMeaningVi: vocabulary.suggestedMeaningVi,
          reviewNotes: reviewNotes.trim() || undefined,
          entry: vocabulary.entry,
          homograph: vocabulary.homograph,
          levelLabel: vocabulary.levelLabel,
          sourcePdfPage: vocabulary.sourcePdfPage,"""

assert old_save_dto in c, 'old_save_dto not found'
c = c.replace(old_save_dto, new_save_dto, 1)

# Add CVDICT suggestion banner & Homograph warning banner
old_meaning_section = """          {/* Section: Giải nghĩa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              2. Giải nghĩa tiếng Việt & Gợi ý từ điển
            </h4>"""

new_meaning_section = """          {/* Section: Giải nghĩa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              2. Giải nghĩa tiếng Việt & Gợi ý từ điển
            </h4>

            {/* CVDICT Suggestion Banner */}
            {vocabulary.suggestedMeaningVi && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f766e', fontWeight: 600, fontSize: '12px' }}>
                    <Sparkles size={14} color="#0d9488" />
                    <span>Gợi ý Từ điển CVDICT (CC BY-SA 4.0):</span>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      className="ds-btn ds-btn-sm"
                      style={{
                        backgroundColor: '#0d9488',
                        color: '#fff',
                        border: 'none',
                        padding: '3px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onClick={handleApplyCvdictSuggestion}
                      title="Chép nghĩa gợi ý vào ô nhập (Chưa tự động lưu)"
                    >
                      <Copy size={12} /> Sử dụng nghĩa gợi ý
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#134e4a', fontWeight: 500, lineHeight: 1.4 }}>
                  {vocabulary.suggestedMeaningVi}
                </div>
                <div style={{ fontSize: '11px', color: '#0f766e', fontStyle: 'italic' }}>
                  Nguồn: CVDICT. Cần kiểm duyệt thủ công phù hợp ngữ cảnh bài học trước khi xuất bản.
                </div>
              </div>
            )}

            {/* HSK 2 Ambiguous & Homograph Warning Banner */}
            {(HSK2_AMBIGUOUS_WORDS[simplified.trim()] || vocabulary.homograph) && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: 700, fontSize: '12px' }}>
                  <AlertTriangle size={15} color="#d97706" />
                  <span>CẢNH BÁO TỪ ĐỒNG HÌNH / ĐA NGHĨA HSK:</span>
                </div>
                <div style={{ fontSize: '12px', color: '#92400e', lineHeight: 1.4 }}>
                  {HSK2_AMBIGUOUS_WORDS[simplified.trim()] || `Mục từ có nhãn đồng hình: ${vocabulary.homograph}. Cần kiểm tra kỹ ngữ cảnh HSK trước khi duyệt.`}
                </div>
              </div>
            )}"""

assert old_meaning_section in c, 'old_meaning_section not found'
c = c.replace(old_meaning_section, new_meaning_section, 1)

# Add Review Notes field and audit info in section 3
old_sec3 = """              <div className="lcm-form-group">
                <label className="lcm-form-label">Trạng thái xuất bản</label>
                {isEditing ? (
                  <select
                    className="lcm-form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                  >
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                    <option value="PENDING_REVIEW">Chờ duyệt (PENDING_REVIEW)</option>
                    <option value="PUBLISHED" disabled={!meaningVi.trim()}>
                      Đã xuất bản (PUBLISHED) {!meaningVi.trim() ? '- Cần có nghĩa tiếng Việt' : ''}
                    </option>
                    <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
                  </select>
                ) : (
                  <ContentStatusBadge status={status} />
                )}
              </div>
            </div>"""

new_sec3 = """              <div className="lcm-form-group">
                <label className="lcm-form-label">Trạng thái xuất bản</label>
                {isEditing ? (
                  <select
                    className="lcm-form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                  >
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                    <option value="PENDING_REVIEW">Chờ duyệt (PENDING_REVIEW)</option>
                    <option value="PUBLISHED" disabled={!meaningVi.trim()}>
                      Đã xuất bản (PUBLISHED) {!meaningVi.trim() ? '- Cần có nghĩa tiếng Việt' : ''}
                    </option>
                    <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
                  </select>
                ) : (
                  <ContentStatusBadge status={status} />
                )}
              </div>
            </div>

            {/* Review Notes field */}
            <div className="lcm-form-group">
              <label className="lcm-form-label">Ghi chú kiểm duyệt / Biên tập</label>
              {isEditing ? (
                <input
                  className="lcm-form-input"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ghi chú lý do duyệt, lưu ý ngữ cảnh bài học..."
                />
              ) : (
                <span style={{ fontSize: '12px', color: vocabulary.reviewNotes ? '#1e293b' : 'var(--muted)', fontStyle: vocabulary.reviewNotes ? 'normal' : 'italic' }}>
                  {vocabulary.reviewNotes || 'Chưa có ghi chú kiểm duyệt'}
                </span>
              )}
            </div>

            {/* Audit Review metadata */}
            {vocabulary.reviewedAt && (
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} />
                <span>Kiểm duyệt lúc: {new Date(vocabulary.reviewedAt).toLocaleString('vi-VN')}</span>
              </div>
            )}"""

assert old_sec3 in c, 'old_sec3 not found'
c = c.replace(old_sec3, new_sec3, 1)

# Update footer review action buttons
old_footer = """              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                disabled={isSaving}
                style={{ borderColor: 'var(--border)' }}
                onClick={() => handleSaveWithStatus('DRAFT', false)}
                title="Lưu nghĩa tiếng Việt và giữ trạng thái Bản nháp (DRAFT)"
              >
                <Save size={14} /> Lưu bản nháp
              </button>

              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                disabled={isSaving || !meaningVi.trim()}
                title={!meaningVi.trim() ? 'Phải có nghĩa tiếng Việt mới có thể xuất bản' : 'Lưu và xuất bản từ vựng'}
                onClick={() => handleSaveWithStatus('PUBLISHED', false)}
              >
                <CheckCircle size={14} /> Lưu & Xuất bản
              </button>"""

new_footer = """              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                disabled={isSaving}
                style={{ borderColor: 'var(--border)' }}
                onClick={() => handleSaveWithStatus('DRAFT', false)}
                title="Lưu nghĩa tiếng Việt và giữ trạng thái Bản nháp (DRAFT)"
              >
                <Save size={14} /> Lưu bản nháp
              </button>

              <button
                type="button"
                className="ds-btn ds-btn-sm"
                disabled={isSaving || !meaningVi.trim()}
                style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleSaveWithStatus('PENDING_REVIEW', false)}
                title="Gửi từ vựng vào hàng đợi chờ duyệt"
              >
                <Send size={14} /> Gửi chờ duyệt
              </button>

              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                disabled={isSaving || !meaningVi.trim()}
                title={!meaningVi.trim() ? 'Phải có nghĩa tiếng Việt mới có thể xuất bản' : 'Lưu và xuất bản từ vựng'}
                onClick={() => handleSaveWithStatus('PUBLISHED', false)}
              >
                <CheckCircle size={14} /> Phê duyệt & Xuất bản
              </button>"""

assert old_footer in c, 'old_footer not found'
c = c.replace(old_footer, new_footer, 1)

# Update read-only buttons
old_readonly = """              {vocabulary.status === 'DRAFT' && meaningVi.trim() && (
                <button
                  type="button"
                  className="ds-btn ds-btn-primary ds-btn-sm"
                  disabled={isSaving}
                  onClick={() => handleSaveWithStatus('PUBLISHED', false)}
                >
                  <CheckCircle size={14} /> Xuất bản từ này
                </button>
              )}"""

new_readonly = """              {vocabulary.status === 'DRAFT' && meaningVi.trim() && (
                <button
                  type="button"
                  className="ds-btn ds-btn-sm"
                  style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  disabled={isSaving}
                  onClick={() => handleSaveWithStatus('PENDING_REVIEW', false)}
                >
                  <Send size={14} /> Gửi chờ duyệt
                </button>
              )}

              {vocabulary.status === 'PENDING_REVIEW' && (
                <>
                  <button
                    type="button"
                    className="ds-btn ds-btn-outline ds-btn-sm"
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    disabled={isSaving}
                    onClick={() => handleSaveWithStatus('DRAFT', false)}
                    title="Từ chối duyệt và trả về Bản nháp"
                  >
                    <XCircle size={14} /> Trả về Nháp
                  </button>

                  <button
                    type="button"
                    className="ds-btn ds-btn-primary ds-btn-sm"
                    disabled={isSaving || !meaningVi.trim()}
                    onClick={() => handleSaveWithStatus('PUBLISHED', false)}
                  >
                    <CheckCircle size={14} /> Phê duyệt & Xuất bản
                  </button>
                </>
              )}"""

assert old_readonly in c, 'old_readonly not found'
c = c.replace(old_readonly, new_readonly, 1)

with open(drawer_path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(c)

print('SUCCESS: Updated VocabularyDetailDrawer.tsx')
