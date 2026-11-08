path = "Fontend/src/management/admin/content/components/CharacterTab.tsx"

with open(path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add currentPage state
target_state = "  const [statusFilter, setStatusFilter] = useState<'ALL' | ContentStatus>('ALL');"
replacement_state = """  const [statusFilter, setStatusFilter] = useState<'ALL' | ContentStatus>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;"""

code = code.replace(target_state, replacement_state)

# 2. Add pagedList and totalPages
target_paged = """  const levelMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((lvl) => map.set(lvl.id, lvl.name));
    return map;
  }, [levels]);"""

replacement_paged = """  const levelMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((lvl) => map.set(lvl.id, lvl.name));
    return map;
  }, [levels]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedList = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, safeCurrentPage]);"""

code = code.replace(target_paged, replacement_paged)

# 3. Replace map over filteredList in tbody with pagedList
target_tbody_map = "filteredList.map((char) => ("
replacement_tbody_map = "pagedList.map((char) => ("

code = code.replace(target_tbody_map, replacement_tbody_map, 1)

# 4. Add pagination controls below table
target_below_table = "      </div>\n\n      {/* Mobile Card List */}"
target_below_table_crlf = "      </div>\r\n\r\n      {/* Mobile Card List */}"

pagination_controls = """      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', fontSize: '13px' }}>
          <span style={{ color: 'var(--muted)' }}>
            Hiển thị {(safeCurrentPage - 1) * pageSize + 1} - {Math.min(safeCurrentPage * pageSize, filteredList.length)} trong tổng số {filteredList.length} chữ Hán
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="ds-btn ds-btn-sm ds-btn-outline"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Trang trước
            </button>
            <span style={{ fontWeight: 600 }}>
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="ds-btn ds-btn-sm ds-btn-outline"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Trang sau
            </button>
          </div>
        </div>
      )}

      {/* Mobile Card List */}"""

if target_below_table_crlf in code:
    code = code.replace(target_below_table_crlf, pagination_controls.replace("\n", "\r\n"))
elif target_below_table in code:
    code = code.replace(target_below_table, pagination_controls)

with open(path, "w", encoding="utf-8") as f:
    f.write(code)

print("[SUCCESS] CharacterTab.tsx updated with pagination!")
