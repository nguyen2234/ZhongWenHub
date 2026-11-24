using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Models.Teacher;

[Table("assignment_questions")]
public class AssignmentQuestion : BaseEntity
{
    [Required]
    public Guid AssignmentId { get; set; }

    [ForeignKey(nameof(AssignmentId))]
    public TeachingAssignment Assignment { get; set; } = null!;

    public Guid? QuestionBankItemId { get; set; }

    [Required]
    [MaxLength(4000)]
    public string Prompt { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string QuestionType { get; set; } = "SINGLE_CHOICE"; // SINGLE_CHOICE, MULTIPLE_CHOICE, FILL_BLANK, TRUE_FALSE, ESSAY

    [MaxLength(4000)]
    public string? OptionsJson { get; set; }

    [Required]
    [MaxLength(2000)]
    public string CorrectAnswer { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Explanation { get; set; }

    public double Points { get; set; } = 10.0;

    public int OrderIndex { get; set; } = 0;
}
