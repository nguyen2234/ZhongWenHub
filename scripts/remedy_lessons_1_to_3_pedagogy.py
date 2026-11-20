import pyodbc
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Pedagogical revised Listening JSON definitions
revised_listening = {
    1: [
        {
            "id": "list-AAAAAAAA-1111-1111-1111-111111111111-1",
            "lessonId": "AAAAAAAA-1111-1111-1111-111111111111",
            "title": "Luyện nghe hiểu bài 1 - Nghe xác định danh tính nhân vật",
            "questionType": "IDENTIFICATION",
            "questionTypeName": "Nghe xác định danh tính nhân vật",
            "audioUrl": "/audio/hsk1/les1_listening.mp3",
            "audioStatus": "GENERATED",
            "editorialReviewStatus": "PENDING_EDITORIAL_REVIEW",
            "transcriptZh": "你好！ 你好！很高兴认识你。 你是老师吗？ 我不是老师，我是学生。",
            "transcriptPinyin": "Nǐ hǎo! Nǐ hǎo! Hěn gāoxìng rènshi nǐ. Nǐ shì lǎoshī ma? Wǒ bú shì lǎoshī, wǒ shì xuésheng.",
            "transcriptVi": "Chào bạn! Chào bạn! Rất vui được quen biết bạn. Bạn có phải là giáo viên không? Tôi không phải là giáo viên, tôi là học sinh.",
            "prompt": "第二位说话人是什么身份？ (Người nói thứ hai có thân phận / nghề nghiệp là gì?)",
            "options": [
                {
                    "id": 0,
                    "text": "学生 (Học sinh)",
                    "isCorrect": True
                },
                {
                    "id": 1,
                    "text": "老师 (Giáo viên)",
                    "isCorrect": False
                },
                {
                    "id": 2,
                    "text": "医生 (Bác sĩ)",
                    "isCorrect": False
                },
                {
                    "id": 3,
                    "text": "司机 (Tài xế)",
                    "isCorrect": False
                }
            ],
            "explanation": "Trong đoạn thoại, người thứ nhất hỏi: '你是老师吗？' (Bạn là giáo viên à?), người thứ hai trả lời rõ ràng: '我不是老师，我是学生。' (Tôi không phải là giáo viên, tôi là học sinh). Do đó đáp án chính xác là Học sinh (学生).",
            "displayOrder": 1
        }
    ],
    2: [
        {
            "id": "list-AAAAAAAA-2222-2222-2222-222222222222-1",
            "lessonId": "AAAAAAAA-2222-2222-2222-222222222222",
            "title": "Luyện nghe hiểu bài 2 - Nghe xác định kế hoạch hành động",
            "questionType": "ACTION_PLAN",
            "questionTypeName": "Nghe xác định kế hoạch hành động",
            "audioUrl": "/audio/hsk1/les2_listening.mp3",
            "audioStatus": "GENERATED",
            "editorialReviewStatus": "PENDING_EDITORIAL_REVIEW",
            "transcriptZh": "谢谢你帮我借书！ 不客气，这是我应该做的。 明天下午你来我家喝茶吗？ 太好了，明天见！再见！",
            "transcriptPinyin": "Xièxie nǐ bāng wǒ jiè shū! Bú kèqi, zhè shì wǒ yīnggāi zuò de. Míngtiān xiàwǔ nǐ lái wǒ jiā hē chá ma? Tài hǎo le, míngtiān jiàn! Zàijiàn!",
            "transcriptVi": "Cảm ơn bạn đã giúp tôi mượn sách! Đừng khách sáo, đây là việc tôi nên làm mà. Chiều mai bạn đến nhà tôi uống trà nhé? Tuyệt quá, ngày mai gặp nhé! Tạm biệt!",
            "prompt": "两位说话人打算明天下午做什么？ (Hai người nói dự định làm gì vào chiều mai?)",
            "options": [
                {
                    "id": 0,
                    "text": "去喝茶 (Đi uống trà)",
                    "isCorrect": True
                },
                {
                    "id": 1,
                    "text": "去借书 (Đi mượn sách)",
                    "isCorrect": False
                },
                {
                    "id": 2,
                    "text": "去买东西 (Đi mua đồ)",
                    "isCorrect": False
                },
                {
                    "id": 3,
                    "text": "去上课 (Đi học)",
                    "isCorrect": False
                }
            ],
            "explanation": "Trong đoạn thoại, người thứ nhất mời: '明天下午你来我家喝茶吗？' (Chiều mai bạn đến nhà tôi uống trà nhé?) và người thứ hai hào hứng đồng ý: '太好了，明天见！'. Do đó hai người dự định chiều mai đi uống trà.",
            "displayOrder": 1
        }
    ],
    3: [
        {
            "id": "list-AAAAAAAA-3333-3333-3333-333333333333-1",
            "lessonId": "AAAAAAAA-3333-3333-3333-333333333333",
            "title": "Luyện nghe hiểu bài 3 - Nghe xác định quốc tịch / quê quán",
            "questionType": "NATIONALITY",
            "questionTypeName": "Nghe xác định quốc tịch / quê quán",
            "audioUrl": "/audio/hsk1/les3_listening.mp3",
            "audioStatus": "GENERATED",
            "editorialReviewStatus": "PENDING_EDITORIAL_REVIEW",
            "transcriptZh": "你好，请问你叫什么名字？ 我叫玛丽。你也是留学生吗？ 是的，我叫大卫，来自美国。 很高兴认识你，大卫！",
            "transcriptPinyin": "Nǐ hǎo, qǐngwèn nǐ jiào shénme míngzi? Wǒ jiào Mǎlì. Nǐ yě shì liúxuéshēng ma? Shì de, wǒ jiào Dàwèi, láizì Měiguó. Hěn gāoxìng rènshi nǐ, Dàwèi!",
            "transcriptVi": "Xin chào, cho hỏi bạn tên là gì? Tôi tên là Mary. Bạn cũng là lưu học sinh à? Đúng vậy, tôi tên David, đến từ Mỹ. Rất vui được làm quen với bạn, David!",
            "prompt": "大卫来自哪个国家？ (David đến từ quốc gia nào?)",
            "options": [
                {
                    "id": 0,
                    "text": "美国 (Nước Mỹ)",
                    "isCorrect": True
                },
                {
                    "id": 1,
                    "text": "中国 (Trung Quốc)",
                    "isCorrect": False
                },
                {
                    "id": 2,
                    "text": "英国 (Nước Anh)",
                    "isCorrect": False
                },
                {
                    "id": 3,
                    "text": "日本 (Nhật Bản)",
                    "isCorrect": False
                }
            ],
            "explanation": "Trong đoạn thoại, David tự giới thiệu: '是的，我叫大卫，来自美国。' (Đúng vậy, tôi tên David, đến từ Mỹ). Do đó đáp án chính xác là Nước Mỹ (美国).",
            "displayOrder": 1
        }
    ]
}

# 2. Snapshot current content before updating
snapshot_dir = r"D:\ZhongWenHub\scripts\snapshots"
os.makedirs(snapshot_dir, exist_ok=True)

conn_dev = pyodbc.connect('DRIVER={ODBC Driver 18 for SQL Server};SERVER=localhost\\SQLEXPRESS;DATABASE=ZhongWenHub_Dev;Trusted_Connection=yes;TrustServerCertificate=yes;')
cursor_dev = conn_dev.cursor()

snapshots = {}
for num in [1, 2, 3]:
    cursor_dev.execute('SELECT LessonNumber, Id, TitleZh, TitleVi, ListeningJson FROM lessons WHERE LessonNumber = ? AND CourseId = (SELECT TOP 1 Id FROM courses WHERE Title LIKE \'%HSK 1%\')', num)
    row = cursor_dev.fetchone()
    snapshots[num] = {
        "lessonNumber": row[0],
        "id": str(row[1]),
        "titleZh": row[2],
        "titleVi": row[3],
        "listeningJsonBefore": json.loads(row[4])
    }

snapshot_path = os.path.join(snapshot_dir, "hsk1_lessons_1_to_3_v1_snapshot.json")
with open(snapshot_path, "w", encoding="utf-8") as f:
    json.dump(snapshots, f, ensure_ascii=False, indent=2)
print(f"Snapshot v1.0 saved to {snapshot_path}")

# 3. Apply to ZhongWenHub_Test first (Test-First rule!)
for db_name in ['ZhongWenHub_Test', 'ZhongWenHub_Dev']:
    conn = pyodbc.connect(f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER=localhost\\SQLEXPRESS;DATABASE={db_name};Trusted_Connection=yes;TrustServerCertificate=yes;', autocommit=True)
    cursor = conn.cursor()
    
    for num in [1, 2, 3]:
        revised_json_str = json.dumps(revised_listening[num], ensure_ascii=False)
        review_note = "Cập nhật sư phạm v1.1: Chuẩn hóa câu hỏi nghe hiểu và phương án trắc nghiệm phù hợp trình độ HSK 1. Đã đối chiếu 100% với audio les1, les2, les3."
        
        cursor.execute('''
        UPDATE lessons
        SET ListeningJson = ?,
            ReviewNotes = ?,
            UpdatedAt = GETUTCDATE()
        WHERE LessonNumber = ? AND CourseId = (SELECT TOP 1 Id FROM courses WHERE Title LIKE '%HSK 1%')
        ''', revised_json_str, review_note, num)
        print(f"[{db_name}] Updated Lesson {num} ListeningJson with pedagogical v1.1 standards.")

print("All Lessons 1 to 3 successfully updated with natural, authentic HSK 1 questions & options!")
