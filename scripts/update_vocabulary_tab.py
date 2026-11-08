path = "Fontend/src/management/admin/content/components/VocabularyTab.tsx"

with open(path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add auditRiskFilter state
target_state = "  const [manualReviewOnly, setManualReviewOnly] = useState(false);"
replacement_state = """  const [manualReviewOnly, setManualReviewOnly] = useState(false);
  const [auditRiskFilter, setAuditRiskFilter] = useState<'ALL' | 'NEEDS_REVIEW' | 'HOMOGRAPH_DUOYINZI' | 'MISSING_MEANING'>('ALL');"""

code = code.replace(target_state, replacement_state)

# 2. Add auditRiskFilter to filteredList
target_filter = """    if (manualReviewOnly) {
      result = result.filter((v) => {
        const entry = HSK1_DICTIONARY_SUGGESTIONS[v.simplified.trim()];
        return entry?.manualReviewRequired || entry?.isAmbiguous;
      });
    }"""

replacement_filter = """    if (manualReviewOnly) {
      result = result.filter((v) => {
        const entry = HSK1_DICTIONARY_SUGGESTIONS[v.simplified.trim()];
        return entry?.manualReviewRequired || entry?.isAmbiguous;
      });
    }

    if (auditRiskFilter === 'NEEDS_REVIEW') {
      result = result.filter((v) => v.status === 'PENDING_REVIEW' || !v.meaningVi);
    } else if (auditRiskFilter === 'HOMOGRAPH_DUOYINZI') {
      result = result.filter((v) => !!v.homograph || (v.entry && v.entry.includes('(')));
    } else if (auditRiskFilter === 'MISSING_MEANING') {
      result = result.filter((v) => !v.meaningVi || v.meaningVi.trim() === '');
    }"""

code = code.replace(target_filter, replacement_filter)

# 3. Add auditRiskFilter to dependencies
target_deps = "[vocabularies, selectedLevelId, statusFilter, posFilter, missingMeaningOnly, manualReviewOnly, search]"
replacement_deps = "[vocabularies, selectedLevelId, statusFilter, posFilter, missingMeaningOnly, manualReviewOnly, auditRiskFilter, search]"

code = code.replace(target_deps, replacement_deps)

# 4. Add dropdown in toolbar
target_dropdown = """          <select
            className="lcm-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ContentStatus)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="PENDING_REVIEW">Chờ duyệt</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>"""

replacement_dropdown = """          <select
            className="lcm-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ContentStatus)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="PENDING_REVIEW">Chờ duyệt (PENDING_REVIEW)</option>
            <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
          </select>

          <select
            className="lcm-select-filter"
            value={auditRiskFilter}
            onChange={(e) => setAuditRiskFilter(e.target.value as any)}
            title="Lọc theo mức độ rủi ro kiểm toán sư phạm"
            style={{ minWidth: '170px' }}
          >
            <option value="ALL">Mọi mức độ rủi ro</option>
            <option value="NEEDS_REVIEW">Cần kiểm tra sâu (Needs Review)</option>
            <option value="HOMOGRAPH_DUOYINZI">Từ đa âm / Đồng hình</option>
            <option value="MISSING_MEANING">Thiếu nghĩa tiếng Việt</option>
          </select>"""

code = code.replace(target_dropdown, replacement_dropdown)

with open(path, "w", encoding="utf-8") as f:
    f.write(code)

print("[SUCCESS] VocabularyTab.tsx updated with audit risk filter!")
