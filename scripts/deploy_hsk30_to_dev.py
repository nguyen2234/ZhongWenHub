#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZHONGWENHUB - HSK 3.0 DEPLOYMENT SCRIPT FOR SQL SERVER
Target Database: ZhongWenHub_Dev
Safety: Transaction-wrapped, Pre-migration Backup, Idempotent, Zero loss of existing data.
"""

import os
import sys
import csv
import json
import uuid
import re
import argparse
from datetime import datetime, timezone
import pyodbc

sys.stdout.reconfigure(encoding='utf-8')

# Paths
BASE_DIR = r"D:\ZhongWenHub"
SCRATCH_DIR = r"C:\Users\nguyen\.gemini\antigravity\brain\cd186fce-5c0e-4fe7-82e2-2c0cf85214c4\scratch"
HSK30_DATA = os.path.join(SCRATCH_DIR, "hsk30", "data")
URAN_DATA = os.path.join(SCRATCH_DIR, "uranbekanarbaev", "data", "by-level")
CVDICT_PATH = os.path.join(SCRATCH_DIR, "CVDICT.u8")
BACKUP_PATH = os.path.join(BASE_DIR, "ZhongWenHub_Dev_PreImport_Backup.bak")

# 9 initial seed words that must keep SourceDataset = NULL for test compatibility
SEED_WORDS_HSK1 = {"你", "好", "您", "谢谢", "不客气", "对不起", "叫", "什么", "名字"}

def main():
    parser = argparse.ArgumentParser(description="ZhongWenHub HSK 3.0 Production/Dev Deployment Script")
    parser.add_argument("--database", default="ZhongWenHub_Dev", choices=["ZhongWenHub_Dev", "ZhongWenHub_Test"], help="Target database")
    parser.add_argument("--confirm-deploy-dev", action="store_true", help="Safety flag required to execute on ZhongWenHub_Dev")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without committing transaction")
    parser.add_argument("--skip-backup", action="store_true", help="Skip pre-migration SQL backup (test only)")
    args = parser.parse_args()

    target_db = args.database
    print("=" * 80)
    print(f"ZHONGWENHUB — HSK 3.0 DEPLOYMENT ENGINE")
    print(f"Target Database : {target_db}")
    print(f"Dry Run Mode    : {args.dry_run}")
    print("=" * 80)

    if target_db == "ZhongWenHub_Dev" and not args.confirm_deploy_dev and not args.dry_run:
        print("\n[CHẶN AN TOÀN] Bạn chưa cung cấp cờ --confirm-deploy-dev!")
        print("Lệnh triển khai lên ZhongWenHub_Dev đã bị dừng để bảo vệ dữ liệu.")
        print("Sử dụng --dry-run để chạy kiểm tra thử, hoặc cung cấp --confirm-deploy-dev khi đã được duyệt.")
        sys.exit(1)

    # 1. Connect
    conn_str = f"Driver={{ODBC Driver 18 for SQL Server}};Server=.\\SQLEXPRESS;Database={target_db};Trusted_Connection=Yes;TrustServerCertificate=Yes;"
    conn = pyodbc.connect(conn_str)
    conn.autocommit = True
    cursor = conn.cursor()

    cursor.execute("SELECT DB_NAME();")
    active_db = cursor.fetchone()[0]
    assert active_db == target_db, f"LỖI: Kết nối sai database ({active_db} != {target_db})!"
    print(f"\n[1/7] Kết nối thành công đến database: {active_db}")

    # 2. Automated Pre-Migration Timestamped Backup & Verification
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(BASE_DIR, f"ZhongWenHub_Dev_Backup_{timestamp_str}.bak")

    if target_db == "ZhongWenHub_Dev" and not args.skip_backup and not args.dry_run:
        print(f"\n[2/7] Đang kiểm tra phiên làm việc và tạo bản sao lưu mới ({backup_file})...")

        # Check for active writing sessions
        cursor.execute("""
            SELECT session_id, status, open_transaction_count 
            FROM sys.dm_exec_sessions 
            WHERE database_id = DB_ID(?) AND is_user_process = 1 AND session_id != @@SPID AND open_transaction_count > 0;
        """, (target_db,))
        active_writers = cursor.fetchall()
        if active_writers:
            raise RuntimeError(f"PHÁT HIỆN PHIÊN GHI ĐANG HOẠT ĐỘNG TRÊN {target_db}: {active_writers}")
        print("   [PASS] Xác nhận không có phiên nghiệp vụ nào đang ghi dữ liệu vào database.")

        backup_sql = f"""
            BACKUP DATABASE [{target_db}]
            TO DISK = '{backup_file}'
            WITH FORMAT, INIT, NAME = 'ZhongWenHub_Dev Pre-HSK30 Deploy Backup {timestamp_str}';
        """
        cursor.execute(backup_sql)
        while cursor.nextset():
            pass
        print(f"   [PASS] Đã tạo file sao lưu an toàn tại: {backup_file}")

        # RESTORE VERIFYONLY
        cursor.execute(f"RESTORE VERIFYONLY FROM DISK = '{backup_file}';")
        while cursor.nextset():
            pass
        print(f"   [PASS] RESTORE VERIFYONLY xác nhận bản sao lưu hợp lệ 100%.")
    else:
        print(f"\n[2/7] Bỏ qua bước backup (Target={target_db}, DryRun={args.dry_run}).")

    # 3. Pre-migration Assertions
    print(f"\n[3/7] Kiểm tra tính toàn vẹn dữ liệu trước triển khai...")
    cursor.execute("""
        SELECT COUNT(*) AS Total,
               SUM(CASE WHEN MeaningVi IS NOT NULL AND LEN(MeaningVi) > 0 THEN 1 ELSE 0 END) AS HasMeaningVi,
               SUM(CASE WHEN Status = 'PUBLISHED' THEN 1 ELSE 0 END) AS PublishedCount,
               SUM(CASE WHEN Status = 'DRAFT' THEN 1 ELSE 0 END) AS DraftCount
        FROM vocabularies WHERE HskLevel = 1;
    """)
    pre_total, pre_meaning, pre_pub, pre_draft = cursor.fetchone()
    print(f"   HSK 1 hiện tại: Tổng={pre_total}, Có MeaningVi={pre_meaning}, PUBLISHED={pre_pub}, DRAFT={pre_draft}")
    assert pre_total == 300, f"LỖI TOÀN VẸN: Số lượng từ HSK 1 không phải 300 (Thực tế: {pre_total})!"
    if target_db == "ZhongWenHub_Dev":
        assert pre_meaning == 300, f"LỖI TOÀN VẸN: Dev bị thiếu MeaningVi ({pre_meaning} != 300)!"
        assert pre_pub == 10, f"LỖI TOÀN VẸN: Số từ PUBLISHED trên Dev ({pre_pub} != 10)!"

    # Assert all business tables baseline
    cursor.execute("SELECT COUNT(*) FROM users;")
    u_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM roles;")
    r_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM grammar_points;")
    g_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM courses;")
    c_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM lessons;")
    l_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM user_wallets;")
    w_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM wallet_transactions;")
    wt_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM user_subscriptions;")
    sub_count = cursor.fetchone()[0]
    print(f"   Baseline kiểm tra: Users={u_count}, Roles={r_count}, Grammar={g_count}, Courses={c_count}, Lessons={l_count}, Wallets={w_count}, Transactions={wt_count}, Subs={sub_count}")
    if target_db == "ZhongWenHub_Dev":
        assert u_count == 23, f"Sai lệch users ({u_count} != 23)"
        assert r_count == 5, f"Sai lệch roles ({r_count} != 5)"
        assert g_count in (2, 461), f"Sai lệch grammar_points ({g_count} not in (2, 461))"
        assert c_count == 6, f"Sai lệch courses ({c_count} != 6)"
        assert l_count == 4, f"Sai lệch lessons ({l_count} != 4)"
        assert w_count == 10, f"Sai lệch user_wallets ({w_count} != 10)"
        assert wt_count == 16, f"Sai lệch wallet_transactions ({wt_count} != 16)"
        assert sub_count == 10, f"Sai lệch user_subscriptions ({sub_count} != 10)"
    print("   [PASS] Toàn bộ chỉ số nghiệp vụ nền tảng (Baseline) đạt chuẩn 100%.")

    # 4. Start Transaction for Schema DDL & Data Import
    print(f"\n[4/7] Bắt đầu TRANSACTION kiểm tra và chuẩn hóa cấu trúc schema (DDL)...")
    conn.autocommit = False
    ddl_statements = [
        # vocabularies.SuggestedMeaningVi
        """
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'vocabularies' AND COLUMN_NAME = 'SuggestedMeaningVi')
        BEGIN
            ALTER TABLE vocabularies ADD SuggestedMeaningVi NVARCHAR(1000) NULL;
        END
        """,
        # grammar_points columns
        """
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'grammar_points' AND COLUMN_NAME = 'GrammarType')
        BEGIN
            ALTER TABLE grammar_points ADD GrammarType NVARCHAR(100) NULL;
            ALTER TABLE grammar_points ADD CategoryType NVARCHAR(100) NULL;
            ALTER TABLE grammar_points ADD RawExplanationCn NVARCHAR(MAX) NULL;
            ALTER TABLE grammar_points ADD SourceDataset NVARCHAR(100) NULL;
            ALTER TABLE grammar_points ADD SourceEntryId NVARCHAR(50) NULL;
        END
        """,
        # hanzi_characters table
        """
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'hanzi_characters')
        BEGIN
            CREATE TABLE hanzi_characters (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                Character NVARCHAR(10) NOT NULL,
                Pinyin NVARCHAR(100) NULL,
                SinoVietnamese NVARCHAR(100) NULL,
                StrokeCount INT NULL,
                Radical NVARCHAR(10) NULL,
                FirstHskLevel INT NOT NULL,
                CreatedAt DATETIME2 NOT NULL,
                UpdatedAt DATETIME2 NULL
            );
            CREATE UNIQUE INDEX idx_hanzi_characters_character ON hanzi_characters (Character);
            CREATE INDEX idx_hanzi_characters_first_level ON hanzi_characters (FirstHskLevel);
        END
        """,
        # hanzi_level_requirements table
        """
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'hanzi_level_requirements')
        BEGIN
            CREATE TABLE hanzi_level_requirements (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                CharacterId UNIQUEIDENTIFIER NOT NULL,
                Character NVARCHAR(10) NOT NULL,
                HskLevel INT NOT NULL,
                Type INT NOT NULL,
                TypeName NVARCHAR(50) NOT NULL,
                SourceDataset NVARCHAR(100) NULL,
                CreatedAt DATETIME2 NOT NULL,
                UpdatedAt DATETIME2 NULL,
                CONSTRAINT FK_hanzi_level_requirements_hanzi_characters_CharacterId 
                    FOREIGN KEY (CharacterId) REFERENCES hanzi_characters (Id) ON DELETE CASCADE
            );
            CREATE UNIQUE INDEX idx_hanzi_req_char_level_type ON hanzi_level_requirements (Character, HskLevel, Type);
            CREATE INDEX idx_hanzi_req_level_type ON hanzi_level_requirements (HskLevel, Type);
        END
        """,
        # __EFMigrationsHistory
        """
        IF NOT EXISTS (SELECT * FROM __EFMigrationsHistory WHERE MigrationId = '20261105161541_AddHsk30GrammarAndHanziTables')
        BEGIN
            INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
            VALUES ('20261105161541_AddHsk30GrammarAndHanziTables', '8.0.10');
        END
        """
    ]
    for ddl in ddl_statements:
        cursor.execute(ddl)
    print("   [PASS] Schema DDL đã được thực thi bên trong TRANSACTION.")

    # 5. Load Source Datasets
    print(f"\n[5/7] Nạp dữ liệu nguồn từ điển và đề cương HSK 3.0...")
    # CVDICT
    cedict_regex = re.compile(r'^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.*)/$')
    cvdict_suggestions = {}
    with open(CVDICT_PATH, mode='r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            m = cedict_regex.match(line)
            if m:
                trad, simp, pinyin, gloss = m.groups()
                meanings = [g.strip() for g in gloss.split('/') if g.strip()]
                if simp not in cvdict_suggestions:
                    cvdict_suggestions[simp] = "; ".join(meanings)
    print(f"   Đã nạp {len(cvdict_suggestions)} mục gợi ý nghĩa CVDICT (CC BY-SA 4.0).")

    # Vocabularies
    all_vocab = []
    for i in range(1, 7):
        fpath = os.path.join(URAN_DATA, f"hsk-{i}.csv")
        with open(fpath, mode='r', encoding='utf-8-sig') as f:
            all_vocab.extend(list(csv.DictReader(f)))
    assert len(all_vocab) == 5400, f"LỖI NGUỒN: Số từ vựng không phải 5.400 ({len(all_vocab)})!"

    # Grammar
    grammar_path = os.path.join(HSK30_DATA, "hsk_grammar.csv")
    with open(grammar_path, mode='r', encoding='utf-8-sig') as f:
        all_grammar = [r for r in csv.DictReader(f) if r['examLevelId'] in [f"HSK{i}" for i in range(1, 7)]]
    assert len(all_grammar) == 459, f"LỖI NGUỒN: Số điểm ngữ pháp không phải 459 ({len(all_grammar)})!"

    # Hanzi
    hanzi_path = os.path.join(HSK30_DATA, "hsk_hanzi.csv")
    with open(hanzi_path, mode='r', encoding='utf-8-sig') as f:
        all_hanzi = [r for r in csv.DictReader(f) if r['examLevelId'] in [f"HSK{i}" for i in range(1, 7)]]
    assert len(all_hanzi) == 2640, f"LỖI NGUỒN: Số lượt yêu cầu chữ Hán không phải 2.640 ({len(all_hanzi)})!"

    # 6. Execute Import Transaction
    print(f"\n[6/7] Thực thi Import dữ liệu trong TRANSACTION...")
    now = datetime.now(timezone.utc)

    vocab_inserted = 0
    vocab_updated = 0
    grammar_inserted = 0
    hanzi_chars_inserted = 0
    hanzi_reqs_inserted = 0

    try:
        # A. Upsert 5,400 Vocabularies
        for item in all_vocab:
            sid = item['id'].strip()
            lvl = int(item['level'])
            hanzi = item['hanzi'].strip()
            pinyin = item['pinyin'].strip()
            pos = item.get('part_of_speech', '').strip()
            entry = item.get('entry', '').strip()
            homo = item.get('homograph', '').strip()
            label = item.get('level_label', '').strip()
            page = int(item['source_pdf_page']) if item.get('source_pdf_page') else None

            # Check if exists
            cursor.execute("""
                SELECT Id, Status, MeaningVi, SourceDataset
                FROM vocabularies
                WHERE (SourceDataset = 'HSK 3.0' AND SourceEntryId = ?)
                   OR (HskLevel = ? AND Hanzi = ? AND Pinyin = ? AND ISNULL(Homograph, '') = ?);
            """, (sid, lvl, hanzi, pinyin, homo))
            existing = cursor.fetchone()

            if existing:
                ex_id, ex_status, ex_meaning, ex_dataset = existing
                # If it's one of the 9 seed words, preserve SourceDataset = NULL
                is_seed = (lvl == 1 and hanzi in SEED_WORDS_HSK1)
                dataset_val = None if is_seed else "HSK 3.0"
                entry_id_val = None if is_seed else sid

                cursor.execute("""
                    UPDATE vocabularies
                    SET SourceDataset = ?,
                        SourceEntryId = ?,
                        Entry = ?,
                        Homograph = ?,
                        LevelLabel = ?,
                        SourcePdfPage = ?,
                        UpdatedAt = ?
                    WHERE Id = ?;
                """, (dataset_val, entry_id_val, entry, homo, label, page, now, ex_id))
                vocab_updated += 1
            else:
                # Insert new HSK 2-6 word
                new_id = str(uuid.uuid4())
                suggested_vi = cvdict_suggestions.get(hanzi, "")
                cursor.execute("""
                    INSERT INTO vocabularies (
                        Id, HskLevel, Hanzi, Pinyin, MeaningVi, SuggestedMeaningVi, PartOfSpeech,
                        Status, SourceDataset, SourceEntryId, Entry, Homograph, LevelLabel, SourcePdfPage,
                        CreatedAt, UpdatedAt
                    ) VALUES (
                        ?, ?, ?, ?, '', ?, ?,
                        'DRAFT', 'HSK 3.0 (2025-11)', ?, ?, ?, ?, ?,
                        ?, ?
                    );
                """, (new_id, lvl, hanzi, pinyin, suggested_vi, pos, sid, entry, homo, label, page, now, now))
                vocab_inserted += 1

        # B. Upsert 459 Grammar Points (EXCLUDING copyrighted CTI text per Req 6)
        for idx, g in enumerate(all_grammar, 1):
            lvl_num = int(g['examLevelId'].replace("HSK", ""))
            code = f"GR30-HSK{lvl_num}-{idx:03d}"
            content = g.get('content', '').strip()
            g_type = g.get('grammarType', '').strip()
            cat_type = g.get('categoryType', '').strip()

            cursor.execute("SELECT Id FROM grammar_points WHERE Code = ?;", (code,))
            ex_g = cursor.fetchone()
            if not ex_g:
                new_gid = str(uuid.uuid4())
                # Exclude CTI raw Chinese explanation and copyrighted cases per Requirement 6
                cursor.execute("""
                    INSERT INTO grammar_points (
                        Id, Code, Title, PinyinTitle, HskLevel, Category, StructureFormula,
                        Explanation, Difficulty, ExamplesJson, Status, GrammarType, CategoryType,
                        RawExplanationCn, SourceDataset, SourceEntryId, CreatedAt, UpdatedAt
                    ) VALUES (
                        ?, ?, ?, '', ?, ?, ?,
                        '', 'Trung bình', '[]', 'DRAFT', ?, ?,
                        NULL, 'HSK 3.0 (2025-11)', ?, ?, ?
                    );
                """, (
                    new_gid, code, content or code, lvl_num, cat_type or "Ngữ pháp", content,
                    g_type, cat_type, str(idx), now, now
                ))
                grammar_inserted += 1

        # C. Upsert 1,940 Hanzi Characters & 2,640 Level Requirements
        unique_characters = {}
        for r in all_hanzi:
            char = r['word'].strip()
            lvl = int(r['examLevelId'].replace("HSK", ""))
            if char not in unique_characters or lvl < unique_characters[char]:
                unique_characters[char] = lvl

        char_id_map = {}
        for char, first_lvl in unique_characters.items():
            cursor.execute("SELECT Id FROM hanzi_characters WHERE Character = ?;", (char,))
            ex_c = cursor.fetchone()
            if ex_c:
                char_id_map[char] = ex_c[0]
            else:
                new_cid = str(uuid.uuid4())
                char_id_map[char] = new_cid
                cursor.execute("""
                    INSERT INTO hanzi_characters (Id, Character, FirstHskLevel, CreatedAt, UpdatedAt)
                    VALUES (?, ?, ?, ?, ?);
                """, (new_cid, char, first_lvl, now, now))
                hanzi_chars_inserted += 1

        for r in all_hanzi:
            char = r['word'].strip()
            lvl = int(r['examLevelId'].replace("HSK", ""))
            t = int(r['type'])
            t_name = "Handwriting" if t == 1 else "Recognition"
            cid = char_id_map[char]

            cursor.execute("""
                SELECT Id FROM hanzi_level_requirements 
                WHERE Character = ? AND HskLevel = ? AND Type = ?;
            """, (char, lvl, t))
            ex_req = cursor.fetchone()
            if not ex_req:
                new_rid = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO hanzi_level_requirements (
                        Id, CharacterId, Character, HskLevel, Type, TypeName, SourceDataset, CreatedAt, UpdatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, 'HSK 3.0 (2025-11)', ?, ?);
                """, (new_rid, cid, char, lvl, t, t_name, now, now))
                hanzi_reqs_inserted += 1

        print(f"   Kết quả xử lý: Vocab mới={vocab_inserted}, Vocab cập nhật={vocab_updated}, Grammar mới={grammar_inserted}, Hanzi mới={hanzi_chars_inserted}, HanziReqs mới={hanzi_reqs_inserted}")

        # 7. Verification Read-Back inside Transaction
        print(f"\n[7/7] Đọc kiểm chứng (SQL Read-Back) dữ liệu sau khi xử lý...")
        cursor.execute("""
            SELECT HskLevel, Status, COUNT(*) AS Total,
                   SUM(CASE WHEN MeaningVi IS NOT NULL AND LEN(MeaningVi) > 0 THEN 1 ELSE 0 END) AS HasMeaningVi,
                   SUM(CASE WHEN SuggestedMeaningVi IS NOT NULL AND LEN(SuggestedMeaningVi) > 0 THEN 1 ELSE 0 END) AS HasSuggestedVi
            FROM vocabularies GROUP BY HskLevel, Status ORDER BY HskLevel, Status;
        """)
        print("\nThống kê bảng vocabularies:")
        for row in cursor.fetchall():
            print(f"   HSK {row[0]} | Status: {row[1]:<10} | Tổng: {row[2]:>5} | Có MeaningVi: {row[3]:>5} | Có SuggestedVi: {row[4]:>5}")

        cursor.execute("SELECT COUNT(*), SUM(CASE WHEN Status = 'PUBLISHED' THEN 1 ELSE 0 END) FROM grammar_points;")
        total_g, pub_g = cursor.fetchone()
        print(f"\nThống kê grammar_points: Tổng={total_g} (Kỳ vọng: 461), PUBLISHED={pub_g} (Kỳ vọng: 2)")

        cursor.execute("SELECT COUNT(*) FROM hanzi_characters;")
        total_hc = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*), SUM(CASE WHEN Type=1 THEN 1 ELSE 0 END), SUM(CASE WHEN Type=2 THEN 1 ELSE 0 END) FROM hanzi_level_requirements;")
        total_hr, t1_hr, t2_hr = cursor.fetchone()
        print(f"Thống kê Chữ Hán: Duy nhất={total_hc} (Kỳ vọng: 1.940), Lượt yêu cầu={total_hr} (Type 1 Viết={t1_hr}, Type 2 Nhận={t2_hr})")

        # Strict Security & Copyright Compliance Assertions
        cursor.execute("SELECT COUNT(*) FROM hanzi_level_requirements r LEFT JOIN hanzi_characters c ON r.CharacterId = c.Id WHERE c.Id IS NULL;")
        orphan_hanzi = cursor.fetchone()[0]
        assert orphan_hanzi == 0, f"LỖI TOÀN VẸN: Phát hiện {orphan_hanzi} quan hệ chữ Hán mồ côi!"

        cursor.execute("SELECT COUNT(*) FROM grammar_points WHERE SourceDataset = 'HSK 3.0 (2025-11)' AND RawExplanationCn IS NOT NULL;")
        raw_cn_count = cursor.fetchone()[0]
        assert raw_cn_count == 0, f"LỖI BẢN QUYỀN: Phát hiện {raw_cn_count} ngữ pháp chứa RawExplanationCn CTI!"

        cursor.execute("SELECT COUNT(*) FROM grammar_points WHERE SourceDataset = 'HSK 3.0 (2025-11)' AND ExamplesJson != '[]';")
        cases_count = cursor.fetchone()[0]
        assert cases_count == 0, f"LỖI BẢN QUYỀN: Phát hiện {cases_count} ngữ pháp chứa ExamplesJson CTI!"

        cursor.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel >= 2 AND MeaningVi != '';")
        invalid_meaning = cursor.fetchone()[0]
        assert invalid_meaning == 0, f"LỖI NGHIỆP VỤ: Phát hiện {invalid_meaning} từ HSK 2-6 có MeaningVi khác rỗng!"

        cursor.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel >= 2 AND Status != 'DRAFT';")
        invalid_status = cursor.fetchone()[0]
        assert invalid_status == 0, f"LỖI BẢO MẬT: Phát hiện {invalid_status} từ HSK 2-6 không phải DRAFT!"

        cursor.execute("SELECT COUNT(*) FROM grammar_points WHERE SourceDataset = 'HSK 3.0 (2025-11)' AND Status != 'DRAFT';")
        invalid_g_status = cursor.fetchone()[0]
        assert invalid_g_status == 0, f"LỖI BẢO MẬT: Phát hiện {invalid_g_status} ngữ pháp HSK 3.0 không phải DRAFT!"

        print("   [PASS] Toàn bộ các tiêu chí Bản quyền, Toàn vẹn Khóa ngoại và Trạng thái DRAFT đều ĐẠT 100%.")

        if args.dry_run:
            conn.rollback()
            print(f"\n   [DRY-RUN] Giao dịch đã được ROLLBACK 100% thành công. Toàn bộ schema và dữ liệu trên {target_db} được giữ nguyên tuyệt đối.")
        else:
            conn.commit()
            print(f"\n   [PASS] Giao dịch đã được COMMIT thành công vào cơ sở dữ liệu {target_db}.")

    except Exception as e:
        conn.rollback()
        print(f"\n[LỖI NGHIÊM TRỌNG] Đã tự động ROLLBACK giao dịch: {e}")
        conn.close()
        sys.exit(1)

    conn.close()
    print("\n" + "=" * 80)
    print("HOÀN THÀNH KIỂM CHỨNG GÓI TRIỂN KHAI!")
    print("=" * 80)

if __name__ == "__main__":
    main()
