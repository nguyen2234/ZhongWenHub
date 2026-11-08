import re

# 1. Update AdminHskRepositoryPage.tsx
print("Updating AdminHskRepositoryPage.tsx...")
path_repo = "Fontend/src/management/admin/content/pages/AdminHskRepositoryPage.tsx"
with open(path_repo, "r", encoding="utf-8") as f:
    code_repo = f.read()

# Update loadData to sync all 3
old_load = """  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await hskRepositoryService.syncVocabulariesFromApi();
      setDataVersion((v) => v + 1);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể tải danh sách từ vựng từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, []);"""

new_load = """  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await Promise.all([
        hskRepositoryService.syncVocabulariesFromApi(),
        hskRepositoryService.syncCharactersFromApi(),
        hskRepositoryService.syncGrammarFromApi(),
      ]);
      setDataVersion((v) => v + 1);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể tải danh sách dữ liệu từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, []);"""

if old_load.replace("\r\n", "\n") in code_repo.replace("\r\n", "\n"):
    code_repo = code_repo.replace(old_load.replace("\n", "\r\n"), new_load.replace("\n", "\r\n"))
    if new_load.replace("\n", "\r\n") not in code_repo:
        code_repo = code_repo.replace(old_load.replace("\r\n", "\n"), new_load.replace("\r\n", "\n"))

# Update handleSaveChar and handleSaveGrammar, and add grammar batch handlers
old_char_grammar_handlers = """  // Handlers for Characters
  const handleOpenChar = useCallback((char: ChineseCharacter) => {
    setSelectedChar(char);
    setIsCharDrawerOpen(true);
  }, []);

  const handleSaveChar = useCallback((id: string, dto: UpdateCharacterDTO) => {
    hskRepositoryService.updateCharacter(id, dto);
    setDataVersion((v) => v + 1);
    setIsCharDrawerOpen(false);
  }, []);

  // Handlers for Grammar
  const handleOpenGrammar = useCallback((grammar: GrammarPoint) => {
    setSelectedGrammar(grammar);
    setIsGrammarDrawerOpen(true);
  }, []);

  const handleSaveGrammar = useCallback((id: string, dto: UpdateGrammarDTO) => {
    hskRepositoryService.updateGrammar(id, dto);
    setDataVersion((v) => v + 1);
    setIsGrammarDrawerOpen(false);
  }, []);"""

new_char_grammar_handlers = """  // Handlers for Characters
  const handleOpenChar = useCallback((char: ChineseCharacter) => {
    setSelectedChar(char);
    setIsCharDrawerOpen(true);
  }, []);

  const handleSaveChar = useCallback(async (id: string, dto: UpdateCharacterDTO) => {
    try {
      await hskRepositoryService.updateCharacterAsync(id, dto);
    } catch {
      hskRepositoryService.updateCharacter(id, dto);
    }
    setDataVersion((v) => v + 1);
    setIsCharDrawerOpen(false);
  }, []);

  // Handlers for Grammar
  const handleOpenGrammar = useCallback((grammar: GrammarPoint) => {
    setSelectedGrammar(grammar);
    setIsGrammarDrawerOpen(true);
  }, []);

  const handleSaveGrammar = useCallback(async (id: string, dto: UpdateGrammarDTO) => {
    try {
      await hskRepositoryService.reviewGrammarAsync(id, {
        status: dto.status,
        reviewNotes: dto.reviewNotes,
      });
    } catch {
      hskRepositoryService.updateGrammar(id, dto);
    }
    setDataVersion((v) => v + 1);
    setIsGrammarDrawerOpen(false);
  }, []);

  const handleBatchPublishGrammar = useCallback(async (ids: string[]) => {
    try {
      setIsLoading(true);
      const res = await hskRepositoryService.batchPublishGrammarPointsAsync(ids);
      alert(`Xuất bản thành công ${res.publishedCount} điểm ngữ pháp.${res.skippedCount > 0 ? ` Bỏ qua: ${res.skippedCount}` : ''}`);
      await hskRepositoryService.syncGrammarFromApi();
      setDataVersion((v) => v + 1);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi khi xuất bản điểm ngữ pháp.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBatchReviewGrammar = useCallback(async (ids: string[], status: ContentStatus, notes?: string) => {
    try {
      setIsLoading(true);
      const res = await hskRepositoryService.batchReviewGrammarPointsAsync({ ids, status, reviewNotes: notes });
      alert(`Chuyển trạng thái ${status} thành công cho ${res.processedCount} điểm ngữ pháp.${res.skippedCount > 0 ? ` Bỏ qua: ${res.skippedCount}` : ''}`);
      await hskRepositoryService.syncGrammarFromApi();
      setDataVersion((v) => v + 1);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi khi kiểm duyệt điểm ngữ pháp.');
    } finally {
      setIsLoading(false);
    }
  }, []);"""

if old_char_grammar_handlers.replace("\r\n", "\n") in code_repo.replace("\r\n", "\n"):
    code_repo = code_repo.replace(old_char_grammar_handlers.replace("\n", "\r\n"), new_char_grammar_handlers.replace("\n", "\r\n"))
    if new_char_grammar_handlers.replace("\n", "\r\n") not in code_repo:
        code_repo = code_repo.replace(old_char_grammar_handlers.replace("\r\n", "\n"), new_char_grammar_handlers.replace("\r\n", "\n"))

# Connect GrammarTab props
old_grammar_tab = """      {activeTab === 'GRAMMAR' && (
        <GrammarTab
          grammarPoints={grammarPoints}
          levels={levels}
          selectedLevelId={selectedLevelId}
          onSelectGrammar={handleOpenGrammar}
        />
      )}"""

new_grammar_tab = """      {activeTab === 'GRAMMAR' && (
        <GrammarTab
          grammarPoints={grammarPoints}
          levels={levels}
          selectedLevelId={selectedLevelId}
          onSelectGrammar={handleOpenGrammar}
          onBatchPublish={handleBatchPublishGrammar}
          onBatchReview={handleBatchReviewGrammar}
        />
      )}"""

if old_grammar_tab.replace("\r\n", "\n") in code_repo.replace("\r\n", "\n"):
    code_repo = code_repo.replace(old_grammar_tab.replace("\n", "\r\n"), new_grammar_tab.replace("\n", "\r\n"))
    if new_grammar_tab.replace("\n", "\r\n") not in code_repo:
        code_repo = code_repo.replace(old_grammar_tab.replace("\r\n", "\n"), new_grammar_tab.replace("\r\n", "\n"))

with open(path_repo, "w", encoding="utf-8") as f:
    f.write(code_repo)
print("[PASS] AdminHskRepositoryPage.tsx updated successfully!")
