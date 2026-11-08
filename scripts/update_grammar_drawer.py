import sys

path = r'Fontend\src\management\admin\content\components\AdminGrammarDetailDrawer.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace lucide imports
if 'CheckCircle,' not in c:
    c = c.replace('AlertTriangle,', 'AlertTriangle,\n  CheckCircle,\n  Send,\n  Clock,')

# Add reviewNotes state
target_state = '  const [commonMistakeNote, setCommonMistakeNote] = useState(\'\');'
repl_state = '''  const [commonMistakeNote, setCommonMistakeNote] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);'''
if target_state in c:
    c = c.replace(target_state, repl_state, 1)

# Add to useEffect
target_effect = 'setCommonMistakeNote(grammar.commonMistake?.note || \'\');'
repl_effect = '''setCommonMistakeNote(grammar.commonMistake?.note || '');
      setReviewNotes(grammar.reviewNotes || '');
      setValidationError(null);'''
if target_effect in c:
    c = c.replace(target_effect, repl_effect, 1)

# Update handleSave to validate and include reviewNotes
target_save = """    onSave(grammar.id, {
      code,
      title,
      pinyinTitle,
      hskLevel,
      category,
      structureFormula,
      explanation,
      difficulty,
      status,"""

repl_save = """    if (status === 'PUBLISHED' && (!title.trim() || !structureFormula.trim() || !explanation.trim())) {
      setValidationError('Cần điền đủ Tên ngữ pháp, Công thức và Giải thích trước khi xuất bản.');
      return;
    }
    setValidationError(null);
    onSave(grammar.id, {
      code,
      title,
      pinyinTitle,
      hskLevel,
      category,
      structureFormula,
      explanation,
      difficulty,
      status,
      reviewNotes: reviewNotes.trim() || undefined,"""
if target_save in c:
    c = c.replace(target_save, repl_save, 1)

# Add handleQuickReview helper
quick_review_fn = """
  const handleQuickReview = (targetStatus: ContentStatus) => {
    if (targetStatus === 'PUBLISHED' && (!title.trim() || !structureFormula.trim() || !explanation.trim())) {
      setValidationError('Không thể xuất bản: Điểm ngữ pháp phải có đầy đủ Tên, Công thức cấu trúc và Giải thích.');
      return;
    }
    setValidationError(null);
    onSave(grammar.id, {
      code,
      title,
      pinyinTitle,
      hskLevel,
      category,
      structureFormula,
      explanation,
      difficulty,
      status: targetStatus,
      reviewNotes: reviewNotes.trim() || (targetStatus === 'PUBLISHED' ? 'Đã phê duyệt qua CMS' : targetStatus === 'PENDING_REVIEW' ? 'Gửi chờ duyệt qua CMS' : 'Chuyển về bản nháp'),
      examples,
      commonMistake:
        commonMistakeWrong.trim() || commonMistakeRight.trim()
          ? {
              wrong: commonMistakeWrong.trim(),
              right: commonMistakeRight.trim(),
              note: commonMistakeNote.trim(),
            }
          : undefined,
    });
    setStatus(targetStatus);
    setIsEditing(false);
  };
"""

if 'const handleQuickReview =' not in c:
    c = c.replace('  const handleAddExample = () => {', quick_review_fn + '\n  const handleAddExample = () => {', 1)

# Add reviewNotes field in INFO tab in edit mode
target_edit_info = """                    <textarea
                      className="ds-input"
                      rows={4}
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>
                </>"""

repl_edit_info = """                    <textarea
                      className="ds-input"
                      rows={4}
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                      Ghi chú kiểm duyệt (Review Notes)
                    </label>
                    <textarea
                      className="ds-input"
                      rows={2}
                      placeholder="Ghi chú cho Content Manager / Admin khi kiểm duyệt..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>
                </>"""
if target_edit_info in c:
    c = c.replace(target_edit_info, repl_edit_info, 1)

# Add Audit Info card in view mode
target_view_info = """                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Giải thích ngữ nghĩa:
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', lineHeight: 1.6, color: 'var(--text-main)', margin: 0 }}>
                      {grammar.explanation}
                    </p>
                  </div>"""

repl_view_info = """                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Giải thích ngữ nghĩa:
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', lineHeight: 1.6, color: 'var(--text-main)', margin: 0 }}>
                      {grammar.explanation}
                    </p>
                  </div>

                  {(grammar.reviewedAt || grammar.reviewNotes || grammar.reviewedByUserId) && (
                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#334155' }}>
                        <Clock size={14} color="#64748b" />
                        <span>Thông tin kiểm duyệt (Review Audit):</span>
                      </div>
                      {grammar.reviewedAt && (
                        <div style={{ color: '#64748b' }}>
                          Thời gian duyệt: <strong>{new Date(grammar.reviewedAt).toLocaleString('vi-VN')}</strong>
                        </div>
                      )}
                      {grammar.reviewNotes && (
                        <div style={{ color: '#0f172a' }}>
                          Ghi chú: <em>{grammar.reviewNotes}</em>
                        </div>
                      )}
                    </div>
                  )}"""
if target_view_info in c:
    c = c.replace(target_view_info, repl_view_info, 1)

# Footer actions enhancement
target_footer = """        {/* Drawer Footer */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-5)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--background)',
          }}
        >"""

repl_footer = """        {validationError && (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '12px',
              borderTop: '1px solid #fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={14} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Drawer Footer */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-5)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--background)',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {grammar.status === 'DRAFT' && (
              <>
                <button
                  type="button"
                  className="ds-btn ds-btn-sm"
                  style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => handleQuickReview('PENDING_REVIEW')}
                  title="Gửi điểm ngữ pháp này vào hàng đợi chờ duyệt"
                >
                  <Send size={13} /> Gửi chờ duyệt
                </button>
                <button
                  type="button"
                  className="ds-btn ds-btn-primary ds-btn-sm"
                  style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => handleQuickReview('PUBLISHED')}
                  title="Phê duyệt và xuất bản điểm ngữ pháp"
                >
                  <CheckCircle size={13} /> Duyệt & Xuất bản
                </button>
              </>
            )}

            {grammar.status === 'PENDING_REVIEW' && (
              <>
                <button
                  type="button"
                  className="ds-btn ds-btn-outline ds-btn-sm"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => handleQuickReview('DRAFT')}
                  title="Từ chối duyệt và chuyển về Bản nháp"
                >
                  Từ chối (Trả về Nháp)
                </button>
                <button
                  type="button"
                  className="ds-btn ds-btn-primary ds-btn-sm"
                  style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => handleQuickReview('PUBLISHED')}
                  title="Phê duyệt và xuất bản điểm ngữ pháp"
                >
                  <CheckCircle size={13} /> Phê duyệt & Xuất bản
                </button>
              </>
            )}

            {grammar.status === 'PUBLISHED' && (
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                style={{ color: '#64748b', borderColor: '#cbd5e1' }}
                onClick={() => handleQuickReview('DRAFT')}
                title="Chuyển điểm ngữ pháp về DRAFT để hiệu chỉnh"
              >
                Chuyển về Nháp
              </button>
            )}
          </div>"""
if target_footer in c:
    c = c.replace(target_footer, repl_footer, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print('Successfully enhanced AdminGrammarDetailDrawer.tsx')
