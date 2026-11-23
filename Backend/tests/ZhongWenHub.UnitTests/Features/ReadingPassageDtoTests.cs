using System.Text.Json;
using Xunit;
using ZhongWenHub.Business.Content.DTOs;

namespace ZhongWenHub.UnitTests;

public class ReadingPassageDtoTests
{
    private static readonly JsonSerializerOptions CaseInsensitiveOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [Fact]
    public void Deserialize_FullReadingPassage_PreservesSentencesAndQuestionOptionsTranslations()
    {
        const string json = """
        {
          "unitNumber": 1,
          "lessonNumber": 1,
          "titleZh": "你好！",
          "titleVi": "Xin chào!",
          "passageZh": "早上我在学校看见王老师，我说：“老师，您好！”",
          "passagePinyin": "Zǎoshang wǒ zài xuéxiào kànjiàn Wáng lǎoshī, wǒ shuō: \"Lǎoshī, nín hǎo!\"",
          "passageVi": "Buổi sáng tôi gặp thầy Vương ở trường, tôi nói: \"Chào thầy ạ!\"",
          "sentences": [
            {
              "zh": "早上我在学校看见王老师，我说：“老师，您好！”",
              "pinyin": "Zǎoshang wǒ zài xuéxiào kànjiàn Wáng lǎoshī, wǒ shuō: \"Lǎoshī, nín hǎo!\"",
              "vi": "Buổi sáng tôi gặp thầy Vương ở trường, tôi nói: \"Chào thầy ạ!\""
            }
          ],
          "comprehensionQuestions": [
            {
              "questionZh": "“我”对王老师说了什么？",
              "questionPinyin": "“Wǒ” duì Wáng lǎoshī shuō le shénme?",
              "questionVi": "Nhân vật \"tôi\" đã nói gì với thầy Vương?",
              "options": ["老师，您好！", "对不起！", "没关系！", "再见！"],
              "optionsPinyin": ["Lǎoshī, nín hǎo!", "Duìbuqǐ!", "Méi guānxi!", "Zàijiàn!"],
              "optionsVi": ["Thầy ơi, chào thầy ạ!", "Xin lỗi!", "Không sao đâu!", "Tạm biệt!"],
              "correctIndex": 0,
              "explanation": "Nhân vật nói 老师，您好！"
            }
          ]
        }
        """;

        var dto = JsonSerializer.Deserialize<ReadingPassageDto>(json, CaseInsensitiveOptions);

        Assert.NotNull(dto);
        Assert.NotNull(dto!.Sentences);
        Assert.Single(dto.Sentences!);
        Assert.Equal("早上我在学校看见王老师，我说：“老师，您好！”", dto.Sentences![0].Zh);

        var q = Assert.Single(dto.ComprehensionQuestions);
        Assert.Equal("“Wǒ” duì Wáng lǎoshī shuō le shénme?", q.QuestionPinyin);
        Assert.NotNull(q.OptionsPinyin);
        Assert.NotNull(q.OptionsVi);
        Assert.Equal(q.Options.Count, q.OptionsPinyin!.Count);
        Assert.Equal(q.Options.Count, q.OptionsVi!.Count);
        Assert.Equal(0, q.CorrectIndex);
    }

    [Fact]
    public void Deserialize_MissingOptionalFields_RemainsBackwardCompatible()
    {
        const string json = """
        {
          "unitNumber": 1,
          "lessonNumber": 1,
          "titleZh": "你好！",
          "titleVi": "Xin chào!",
          "passageZh": "你好！",
          "passagePinyin": "Nǐ hǎo!",
          "passageVi": "Chào bạn!",
          "comprehensionQuestions": [
            {
              "questionZh": "他们说什么？",
              "questionVi": "Họ nói gì?",
              "options": ["你好！", "再见！"],
              "correctIndex": 0,
              "explanation": "Nói chào."
            }
          ]
        }
        """;

        var dto = JsonSerializer.Deserialize<ReadingPassageDto>(json, CaseInsensitiveOptions);

        Assert.NotNull(dto);
        Assert.Null(dto!.Sentences);
        var q = Assert.Single(dto.ComprehensionQuestions);
        Assert.Null(q.QuestionPinyin);
        Assert.Null(q.OptionsPinyin);
        Assert.Null(q.OptionsVi);
    }

    [Fact]
    public void Deserialize_InvalidJson_ThrowsJsonExceptionAsExpected()
    {
        const string invalidJson = "{ \"readingPassage\": ";
        Assert.ThrowsAny<JsonException>(() => JsonSerializer.Deserialize<ReadingPassageDto>(invalidJson, CaseInsensitiveOptions));
    }
}

