namespace ZhongWenHub.Business.Learning.DTOs;

public class UserVocabularyStateDto
{
    public string VocabularyId { get; set; } = string.Empty;
    public string Status { get; set; } = "learning"; // new, learning, reviewing, mastered
    public string FirstLearnedAt { get; set; } = string.Empty;
    public string LastReviewedAt { get; set; } = string.Empty;
    public string NextReviewAt { get; set; } = string.Empty;
    public int ReviewCount { get; set; }
    public int CorrectCount { get; set; }
    public bool IsDueToday { get; set; }
}

public class SrsStateDto
{
    public string VocabularyId { get; set; } = string.Empty;
    public double Stability { get; set; } = 1.0;
    public double Difficulty { get; set; } = 5.0;
    public int Interval { get; set; } = 1;
    public int Repetitions { get; set; }
    public double EaseFactor { get; set; } = 2.5;
}
