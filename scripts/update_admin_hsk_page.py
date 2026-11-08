import os

page_path = r'Fontend\src\management\admin\content\pages\AdminHskRepositoryPage.tsx'
with open(page_path, 'r', encoding='utf-8') as f:
    c = f.read().replace('\r\n', '\n')

# 1. Add ContentStatus import
old_import = """import type {
  ChineseCharacter,
  CreateVocabularyDTO,
  GrammarPoint,
  HskLevel,"""

new_import = """import type {
  ContentStatus,
  ChineseCharacter,
  CreateVocabularyDTO,
  GrammarPoint,
  HskLevel,"""

assert old_import in c, 'old_import not found'
c = c.replace(old_import, new_import, 1)

# 2. Add handleBatchReview
old_batch = """  const handleBatchPublish = useCallback(async (ids: string[]) => {
    try {
      const result = await hskRepositoryService.batchPublishVocabulariesAsync(ids);
      alert(`Đã xuất bản thành công ${result.publishedCount} từ vựng!${result.skippedCount > 0 ? ` (Bỏ qua ${result.skippedCount} từ chưa có nghĩa tiếng Việt)` : ''}`);
      await loadData();
    } catch (err: any) {
      console.error('Lỗi xuất bản hàng loạt:', err);
      alert(err?.message || 'Không thể xuất bản hàng loạt từ vựng.');
    }
  }, [loadData]);"""

new_batch = """  const handleBatchPublish = useCallback(async (ids: string[]) => {
    try {
      const result = await hskRepositoryService.batchPublishVocabulariesAsync(ids);
      alert(`Đã xuất bản thành công ${result.publishedCount} từ vựng!${result.skippedCount > 0 ? ` (Bỏ qua ${result.skippedCount} từ chưa có nghĩa tiếng Việt)` : ''}`);
      await loadData();
    } catch (err: any) {
      console.error('Lỗi xuất bản hàng loạt:', err);
      alert(err?.message || 'Không thể xuất bản hàng loạt từ vựng.');
    }
  }, [loadData]);

  const handleBatchReview = useCallback(async (ids: string[], status: ContentStatus, notes?: string) => {
    try {
      const result = await hskRepositoryService.batchReviewVocabulariesAsync({ ids, status, reviewNotes: notes });
      alert(`Đã cập nhật trạng thái (${status}) cho ${result.processedCount} từ vựng!${result.skippedCount > 0 ? ` (Bỏ qua ${result.skippedCount} từ)` : ''}`);
      await loadData();
    } catch (err: any) {
      console.error('Lỗi duyệt hàng loạt:', err);
      alert(err?.message || 'Không thể cập nhật trạng thái hàng loạt.');
    }
  }, [loadData]);"""

assert old_batch in c, 'old_batch not found'
c = c.replace(old_batch, new_batch, 1)

# 3. Add onBatchReview to VocabularyTab
old_vocab_tab = """        <VocabularyTab
          vocabularies={vocabularies}
          levels={levels}
          selectedLevelId={selectedLevelId}
          onSelectVocabulary={handleOpenVocab}
          onOpenCreate={handleOpenCreateVocab}
          onBatchPublish={handleBatchPublish}
        />"""

new_vocab_tab = """        <VocabularyTab
          vocabularies={vocabularies}
          levels={levels}
          selectedLevelId={selectedLevelId}
          onSelectVocabulary={handleOpenVocab}
          onOpenCreate={handleOpenCreateVocab}
          onBatchPublish={handleBatchPublish}
          onBatchReview={handleBatchReview}
        />"""

assert old_vocab_tab in c, 'old_vocab_tab not found'
c = c.replace(old_vocab_tab, new_vocab_tab, 1)

# 4. Add License Attribution footer
old_end = """      {/* Import Wizard Modal */}
      <ImportDataWizardModal
        isOpen={isImportModalOpen}
        levels={levels}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};"""

new_end = """      {/* Footer License Attribution */}
      <footer style={{ marginTop: 'var(--space-6)', padding: '12px 16px', backgroundColor: 'var(--background-secondary, #f8fafc)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <strong>Bản quyền học liệu:</strong> Danh mục từ vựng và ngữ pháp đối chiếu theo chuẩn HSK 3.0. Dữ liệu nghĩa gợi ý tham khảo từ dự án <em>CVDICT (Giấy phép CC BY-SA 4.0)</em>.
        </div>
        <div>
          Hệ thống yêu cầu kiểm duyệt thủ công đối với 100% học liệu HSK trước khi chuyển sang trạng thái <code>PUBLISHED</code>.
        </div>
      </footer>

      {/* Import Wizard Modal */}
      <ImportDataWizardModal
        isOpen={isImportModalOpen}
        levels={levels}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};"""

assert old_end in c, 'old_end not found'
c = c.replace(old_end, new_end, 1)

with open(page_path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(c)

print('SUCCESS: Updated AdminHskRepositoryPage.tsx')
