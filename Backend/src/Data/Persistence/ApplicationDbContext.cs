using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Learning;

namespace ZhongWenHub.Data.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid,
    IdentityUserClaim<Guid>, IdentityUserRole<Guid>, IdentityUserLogin<Guid>,
    IdentityRoleClaim<Guid>, IdentityUserToken<Guid>>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuthAuditRecord> AuthAuditRecords => Set<AuthAuditRecord>();
    public DbSet<StudentLearningProfile> StudentLearningProfiles => Set<StudentLearningProfile>();
    public DbSet<StudentLessonProgress> StudentLessonProgresses => Set<StudentLessonProgress>();
    public DbSet<StudentPracticeAttempt> StudentPracticeAttempts => Set<StudentPracticeAttempt>();
    public DbSet<StudentDailyActivity> StudentDailyActivities => Set<StudentDailyActivity>();
    public DbSet<StudentVocabularyProgress> StudentVocabularyProgresses => Set<StudentVocabularyProgress>();
    public DbSet<StudentXpTransaction> StudentXpTransactions => Set<StudentXpTransaction>();

    // Content Management DbSets
    public DbSet<CourseEntity> Courses => Set<CourseEntity>();
    public DbSet<UnitEntity> Units => Set<UnitEntity>();
    public DbSet<LessonEntity> Lessons => Set<LessonEntity>();
    public DbSet<VocabularyEntity> Vocabularies => Set<VocabularyEntity>();
    public DbSet<LessonVocabularyEntity> LessonVocabularies => Set<LessonVocabularyEntity>();
    public DbSet<GrammarPointEntity> GrammarPoints => Set<GrammarPointEntity>();
    public DbSet<ExerciseEntity> Exercises => Set<ExerciseEntity>();
    public DbSet<HanziCharacterEntity> HanziCharacters => Set<HanziCharacterEntity>();
    public DbSet<HanziLevelRequirementEntity> HanziLevelRequirements => Set<HanziLevelRequirementEntity>();
    public DbSet<ExamEntity> Exams => Set<ExamEntity>();
    public DbSet<ExamQuestionEntity> ExamQuestions => Set<ExamQuestionEntity>();
    public DbSet<StudentExamAttempt> StudentExamAttempts => Set<StudentExamAttempt>();
    public DbSet<QuestionBankPracticeSessionEntity> QuestionBankPracticeSessions => Set<QuestionBankPracticeSessionEntity>();

    // Wallet & Subscription DbSets
    public DbSet<UserWallet> UserWallets => Set<UserWallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<UserSubscription> UserSubscriptions => Set<UserSubscription>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Customize Identity Table Names for SQL Server
        builder.Entity<ApplicationUser>(b =>
        {
            b.ToTable("users");
            b.Property(u => u.DisplayName).HasMaxLength(100).IsRequired();
            b.Property(u => u.AvatarUrl).HasColumnType("nvarchar(max)");
            b.Property(u => u.Status)
                .HasConversion(
                    v => v.ToString(),
                    v => Enum.Parse<UserStatus>(v))
                .HasMaxLength(30)
                .IsRequired();
            b.Property(u => u.LockReason).HasMaxLength(500);
            b.Property(u => u.LockedAt).HasColumnType("datetime2");
            b.Property(u => u.Notes).HasMaxLength(1000);
            b.Property(u => u.CurrentHskLevel).HasMaxLength(20).HasDefaultValue("HSK 1");
            b.Property(u => u.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(u => u.UpdatedAt).HasColumnType("datetime2");
            b.Property(u => u.LastLoginAt).HasColumnType("datetime2");
            b.Property(u => u.DeletedAt).HasColumnType("datetime2");
            b.Property(u => u.IsDeleted).HasDefaultValue(false);

            b.HasQueryFilter(u => !u.IsDeleted);
        });

        builder.Entity<ApplicationRole>(b =>
        {
            b.ToTable("roles");
            b.Property(r => r.Description).HasMaxLength(255);
        });

        builder.Entity<IdentityUserRole<Guid>>(b =>
        {
            b.ToTable("user_roles");
        });

        builder.Entity<IdentityUserClaim<Guid>>(b =>
        {
            b.ToTable("user_claims");
        });

        builder.Entity<IdentityUserLogin<Guid>>(b =>
        {
            b.ToTable("user_logins");
        });

        builder.Entity<IdentityRoleClaim<Guid>>(b =>
        {
            b.ToTable("role_claims");
        });

        builder.Entity<IdentityUserToken<Guid>>(b =>
        {
            b.ToTable("user_tokens");
        });

        // RefreshTokens Configuration
        builder.Entity<RefreshToken>(b =>
        {
            b.ToTable("refresh_tokens");
            b.HasKey(rt => rt.Id);
            b.Property(rt => rt.TokenHash).HasMaxLength(128).IsRequired();
            b.Property(rt => rt.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(rt => rt.ExpiresAt).HasColumnType("datetime2").IsRequired();
            b.Property(rt => rt.RevokedAt).HasColumnType("datetime2");
            b.Property(rt => rt.UpdatedAt).HasColumnType("datetime2");
            b.Property(rt => rt.CreatedByIp).HasMaxLength(50);
            b.Property(rt => rt.RevokedByIp).HasMaxLength(50);
            b.Property(rt => rt.RevocationReason).HasMaxLength(255);
            b.Property(rt => rt.ReplacedByTokenHash).HasMaxLength(128);

            b.HasIndex(rt => rt.TokenHash).HasDatabaseName("idx_refresh_tokens_hash");
            b.HasIndex(rt => rt.UserId).HasDatabaseName("idx_refresh_tokens_user_id");
            b.HasIndex(rt => new { rt.UserId, rt.ExpiresAt }).HasDatabaseName("idx_refresh_tokens_user_expiry");
        });

        // AuthAuditRecord Configuration
        builder.Entity<AuthAuditRecord>(b =>
        {
            b.ToTable("auth_audit_records");
            b.HasKey(a => a.Id);
            b.Property(a => a.Action).HasMaxLength(50).IsRequired();
            b.Property(a => a.Username).HasMaxLength(100);
            b.Property(a => a.IpAddress).HasMaxLength(50);
            b.Property(a => a.UserAgent).HasMaxLength(500);
            b.Property(a => a.Details).HasMaxLength(1000);
            b.Property(a => a.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(a => a.UpdatedAt).HasColumnType("datetime2");

            b.HasIndex(a => a.UserId).HasDatabaseName("idx_audit_records_user_id");
            b.HasIndex(a => a.CreatedAt).HasDatabaseName("idx_audit_records_created_at");
        });

        // StudentLearningProfile Configuration
        builder.Entity<StudentLearningProfile>(b =>
        {
            b.ToTable("student_learning_profiles");
            b.HasKey(p => p.Id);
            b.Property(p => p.CurrentLessonId).HasMaxLength(50).IsRequired();
            b.Property(p => p.LastActivityDate).HasMaxLength(10).IsRequired();
            b.Property(p => p.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(p => p.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(p => p.UserId).IsUnique().HasDatabaseName("idx_student_learning_profiles_user_id");
        });

        // StudentLessonProgress Configuration
        builder.Entity<StudentLessonProgress>(b =>
        {
            b.ToTable("student_lesson_progress");
            b.HasKey(p => p.Id);
            b.Property(p => p.LessonId).HasMaxLength(50).IsRequired();
            b.Property(p => p.Status).HasMaxLength(20).IsRequired();
            b.Property(p => p.CompletedAt).HasColumnType("datetime2");
            b.Property(p => p.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(p => p.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(p => new { p.UserId, p.LessonId })
                .IsUnique()
                .HasDatabaseName("idx_student_lesson_progress_user_lesson");
        });

        // StudentPracticeAttempt Configuration
        builder.Entity<StudentPracticeAttempt>(b =>
        {
            b.ToTable("student_practice_attempts");
            b.HasKey(p => p.Id);
            b.Property(p => p.ExerciseId).HasMaxLength(100).IsRequired();
            b.Property(p => p.QuestionId).HasMaxLength(100);
            b.Property(p => p.KnowledgePointId).HasMaxLength(100).IsRequired();
            b.Property(p => p.TopicTitle).HasMaxLength(200).IsRequired();
            b.Property(p => p.Category).HasMaxLength(50).IsRequired();
            b.Property(p => p.UserAnswer).HasMaxLength(500).IsRequired();
            b.Property(p => p.AttemptedAt).HasColumnType("datetime2").IsRequired();
            b.Property(p => p.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(p => p.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(p => new { p.UserId, p.AttemptedAt })
                .HasDatabaseName("idx_practice_attempts_user_attempted");
            b.HasIndex(p => new { p.UserId, p.HskLevel, p.IsCorrect })
                .HasDatabaseName("idx_practice_attempts_user_hsk_correct");
        });

        // StudentDailyActivity Configuration
        builder.Entity<StudentDailyActivity>(b =>
        {
            b.ToTable("student_daily_activities");
            b.HasKey(a => a.Id);
            b.Property(a => a.ActivityDate).HasMaxLength(10).IsRequired();
            b.Property(a => a.CompletedLessonsJson).HasColumnType("nvarchar(max)").IsRequired();
            b.Property(a => a.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(a => a.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(a => new { a.UserId, a.ActivityDate })
                .IsUnique()
                .HasDatabaseName("idx_daily_activities_user_date");
        });

        // StudentVocabularyProgress Configuration
        builder.Entity<StudentVocabularyProgress>(b =>
        {
            b.ToTable("student_vocabulary_progress");
            b.HasKey(v => v.Id);
            b.Property(v => v.VocabularyId).HasMaxLength(100).IsRequired();
            b.Property(v => v.Hanzi).HasMaxLength(50);
            b.Property(v => v.Pinyin).HasMaxLength(100);
            b.Property(v => v.Status).HasMaxLength(20).IsRequired();
            b.Property(v => v.FirstLearnedAt).HasColumnType("datetime2").IsRequired();
            b.Property(v => v.LastReviewedAt).HasColumnType("datetime2").IsRequired();
            b.Property(v => v.NextReviewAt).HasColumnType("datetime2").IsRequired();
            b.Property(v => v.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(v => v.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(v => v.User)
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(v => new { v.UserId, v.VocabularyId })
                .IsUnique()
                .HasDatabaseName("idx_vocabulary_progress_user_vocab");
        });

        // StudentXpTransaction Configuration
        builder.Entity<StudentXpTransaction>(b =>
        {
            b.ToTable("student_xp_transactions");
            b.HasKey(x => x.Id);
            b.Property(x => x.EventId).HasMaxLength(150).IsRequired();
            b.Property(x => x.Source).HasMaxLength(50).IsRequired();
            b.Property(x => x.Description).HasMaxLength(255);
            b.Property(x => x.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(x => x.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => new { x.UserId, x.EventId })
                .IsUnique()
                .HasDatabaseName("idx_xp_transactions_user_event");
        });

        // Course Configuration
        builder.Entity<CourseEntity>(b =>
        {
            b.ToTable("courses");
            b.HasKey(c => c.Id);
            b.Property(c => c.Code).HasMaxLength(50).IsRequired();
            b.Property(c => c.Title).HasMaxLength(150).IsRequired();
            b.Property(c => c.Description).HasMaxLength(1000);
            b.Property(c => c.Status).HasMaxLength(20).IsRequired().HasDefaultValue("PUBLISHED");
            b.Property(c => c.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(c => c.UpdatedAt).HasColumnType("datetime2");

            b.HasIndex(c => c.Code).IsUnique().HasDatabaseName("idx_courses_code");
            b.HasIndex(c => c.HskLevel).HasDatabaseName("idx_courses_hsk_level");
        });

        // Unit Configuration
        builder.Entity<UnitEntity>(b =>
        {
            b.ToTable("units");
            b.HasKey(u => u.Id);
            b.Property(u => u.TitleZh).HasMaxLength(150).IsRequired();
            b.Property(u => u.TitleVi).HasMaxLength(150).IsRequired();
            b.Property(u => u.Description).HasMaxLength(1000);
            b.Property(u => u.Status).HasMaxLength(20).IsRequired().HasDefaultValue("PUBLISHED");
            b.Property(u => u.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(u => u.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(u => u.Course)
                .WithMany(c => c.Units)
                .HasForeignKey(u => u.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(u => new { u.CourseId, u.UnitNumber }).HasDatabaseName("idx_units_course_number");
            b.HasIndex(u => u.Status).HasDatabaseName("idx_units_status");
        });

        // Lesson Configuration
        builder.Entity<LessonEntity>(b =>
        {
            b.ToTable("lessons");
            b.HasKey(l => l.Id);
            b.Property(l => l.TitleZh).HasMaxLength(150).IsRequired();
            b.Property(l => l.TitleVi).HasMaxLength(150).IsRequired();
            b.Property(l => l.Pinyin).HasMaxLength(150);
            b.Property(l => l.Summary).HasMaxLength(1000);
            b.Property(l => l.DialogueJson).HasColumnType("nvarchar(max)");
            b.Property(l => l.ListeningJson).HasColumnType("nvarchar(max)");
            b.Property(l => l.Status).HasMaxLength(20).IsRequired().HasDefaultValue("PUBLISHED");
            b.Property(l => l.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(l => l.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(l => l.Course)
                .WithMany(c => c.Lessons)
                .HasForeignKey(l => l.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(l => l.Unit)
                .WithMany(u => u.Lessons)
                .HasForeignKey(l => l.UnitId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(l => new { l.CourseId, l.LessonNumber }).HasDatabaseName("idx_lessons_course_number");
            b.HasIndex(l => l.Status).HasDatabaseName("idx_lessons_status");
        });

        // Vocabulary Configuration
        builder.Entity<VocabularyEntity>(b =>
        {
            b.ToTable("vocabularies");
            b.HasKey(v => v.Id);
            b.Property(v => v.Hanzi).HasMaxLength(50).IsRequired();
            b.Property(v => v.Traditional).HasMaxLength(50);
            b.Property(v => v.Pinyin).HasMaxLength(100).IsRequired();
            b.Property(v => v.MeaningVi).HasMaxLength(255).IsRequired(false);
            b.Property(v => v.SuggestedMeaningVi).HasMaxLength(1000);
            b.Property(v => v.MeaningEn).HasMaxLength(255);
            b.Property(v => v.PartOfSpeech).HasMaxLength(50);
            b.Property(v => v.AudioUrl).HasMaxLength(500);
            b.Property(v => v.ExamplesJson).HasColumnType("nvarchar(max)");
            b.Property(v => v.Status).HasMaxLength(20).IsRequired().HasDefaultValue("PUBLISHED");
            b.Property(v => v.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(v => v.UpdatedAt).HasColumnType("datetime2");

            b.Property(v => v.SourceDataset).HasMaxLength(100);
            b.Property(v => v.SourceEntryId).HasMaxLength(50);
            b.Property(v => v.SourceId).HasMaxLength(50);
            b.Property(v => v.Entry).HasMaxLength(100);
            b.Property(v => v.Homograph).HasMaxLength(20);
            b.Property(v => v.LevelLabel).HasMaxLength(50);
            b.Property(v => v.SourcePdfPage).HasColumnType("int");
            b.Property(v => v.ReviewNotes).HasMaxLength(1000);
            b.Property(v => v.NormalizedPinyin).HasMaxLength(100).IsRequired().HasDefaultValue("");
            b.Property(v => v.NormalizedHomograph).HasMaxLength(20).IsRequired().HasDefaultValue("");

            b.HasOne(v => v.Lesson)
                .WithMany(l => l.Vocabularies)
                .HasForeignKey(v => v.LessonId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(v => v.HskLevel).HasDatabaseName("idx_vocabularies_hsk_level");
            b.HasIndex(v => v.Hanzi).HasDatabaseName("idx_vocabularies_hanzi");
            b.HasIndex(v => v.Status).HasDatabaseName("idx_vocabularies_status");
            b.HasIndex(v => v.SourceId).HasDatabaseName("idx_vocabularies_source_id");
            b.HasIndex(v => new { v.SourceDataset, v.SourceEntryId }).HasDatabaseName("idx_vocabularies_source_dataset_entry");
            b.HasIndex(v => new { v.HskLevel, v.Hanzi, v.Pinyin, v.Homograph }).HasDatabaseName("idx_vocabularies_lookup");
            b.HasIndex(v => new { v.HskLevel, v.Hanzi, v.NormalizedPinyin, v.NormalizedHomograph })
                .IsUnique()
                .HasFilter("[Status] <> N'ARCHIVED'")
                .HasDatabaseName("UQ_vocabularies_active_canonical_key");
        });

        // LessonVocabulary Many-to-Many Join Configuration
        builder.Entity<LessonVocabularyEntity>(b =>
        {
            b.ToTable("lesson_vocabularies");
            b.HasKey(lv => new { lv.LessonId, lv.VocabularyId });
            b.Property(lv => lv.SortOrder).HasDefaultValue(0);
            b.Property(lv => lv.CreatedAt).HasColumnType("datetime2").IsRequired();

            b.HasOne(lv => lv.Lesson)
                .WithMany(l => l.LessonVocabularies)
                .HasForeignKey(lv => lv.LessonId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(lv => lv.Vocabulary)
                .WithMany(v => v.LessonVocabularies)
                .HasForeignKey(lv => lv.VocabularyId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(lv => lv.VocabularyId).HasDatabaseName("idx_lesson_vocabularies_vocabulary_id");
        });

        // GrammarPoint Configuration
        builder.Entity<GrammarPointEntity>(b =>
        {
            b.ToTable("grammar_points");
            b.HasKey(g => g.Id);
            b.Property(g => g.Code).HasMaxLength(50).IsRequired();
            b.Property(g => g.Title).HasMaxLength(150).IsRequired();
            b.Property(g => g.PinyinTitle).HasMaxLength(150).IsRequired();
            b.Property(g => g.Category).HasMaxLength(50).IsRequired();
            b.Property(g => g.StructureFormula).HasMaxLength(255).IsRequired();
            b.Property(g => g.Explanation).HasColumnType("nvarchar(max)").IsRequired();
            b.Property(g => g.Difficulty).HasMaxLength(30).IsRequired();
            b.Property(g => g.ExamplesJson).HasColumnType("nvarchar(max)").IsRequired();
            b.Property(g => g.PracticeJson).HasColumnType("nvarchar(max)");
            b.Property(g => g.Status).HasMaxLength(20).IsRequired().HasDefaultValue("PUBLISHED");
            b.Property(g => g.GrammarType).HasMaxLength(100);
            b.Property(g => g.CategoryType).HasMaxLength(100);
            b.Property(g => g.RawExplanationCn).HasColumnType("nvarchar(max)");
            b.Property(g => g.SourceDataset).HasMaxLength(100);
            b.Property(g => g.SourceEntryId).HasMaxLength(50);
            b.Property(g => g.ReviewNotes).HasMaxLength(1000);

            b.Property(g => g.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(g => g.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(g => g.Lesson)
                .WithMany(l => l.GrammarPoints)
                .HasForeignKey(g => g.LessonId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(g => g.Code).IsUnique().HasDatabaseName("idx_grammar_points_code");
            b.HasIndex(g => g.HskLevel).HasDatabaseName("idx_grammar_points_hsk_level");
            b.HasIndex(g => g.Status).HasDatabaseName("idx_grammar_points_status");
            b.HasIndex(g => new { g.SourceDataset, g.SourceEntryId }).HasDatabaseName("idx_grammar_points_source_entry");
        });

        // HanziCharacter Configuration
        builder.Entity<HanziCharacterEntity>(b =>
        {
            b.ToTable("hanzi_characters");
            b.HasKey(h => h.Id);
            b.Property(h => h.Character).HasMaxLength(10).IsRequired();
            b.Property(h => h.Pinyin).HasMaxLength(100);
            b.Property(h => h.SinoVietnamese).HasMaxLength(100);
            b.Property(h => h.MeaningVi).HasMaxLength(500);
            b.Property(h => h.Radical).HasMaxLength(10);
            b.Property(h => h.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(h => h.UpdatedAt).HasColumnType("datetime2");

            b.HasIndex(h => h.Character).IsUnique().HasDatabaseName("idx_hanzi_characters_character");
            b.HasIndex(h => h.FirstHskLevel).HasDatabaseName("idx_hanzi_characters_first_level");
        });

        // HanziLevelRequirement Configuration
        builder.Entity<HanziLevelRequirementEntity>(b =>
        {
            b.ToTable("hanzi_level_requirements");
            b.HasKey(r => r.Id);
            b.Property(r => r.Character).HasMaxLength(10).IsRequired();
            b.Property(r => r.TypeName).HasMaxLength(50).IsRequired();
            b.Property(r => r.SourceDataset).HasMaxLength(100);
            b.Property(r => r.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(r => r.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(r => r.CharacterEntity)
                .WithMany(h => h.LevelRequirements)
                .HasForeignKey(r => r.CharacterId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(r => new { r.Character, r.HskLevel, r.Type }).IsUnique().HasDatabaseName("idx_hanzi_req_char_level_type");
            b.HasIndex(r => new { r.HskLevel, r.Type }).HasDatabaseName("idx_hanzi_req_level_type");
        });

        // Exercise Configuration
        builder.Entity<ExerciseEntity>(b =>
        {
            b.ToTable("exercises");
            b.HasKey(e => e.Id);
            b.Property(e => e.Type).HasMaxLength(50).IsRequired();
            b.Property(e => e.Skill).HasMaxLength(50).IsRequired();
            b.Property(e => e.Title).HasMaxLength(255).IsRequired();
            b.Property(e => e.Instruction).HasMaxLength(500).IsRequired();
            b.Property(e => e.PromptHanzi).HasMaxLength(500);
            b.Property(e => e.PromptPinyin).HasMaxLength(500);
            b.Property(e => e.PromptVietnamese).HasMaxLength(500);
            b.Property(e => e.AudioUrl).HasMaxLength(500);
            b.Property(e => e.OptionsJson).HasColumnType("nvarchar(max)");
            b.Property(e => e.CorrectAnswer).HasMaxLength(500);
            b.Property(e => e.Explanation).HasMaxLength(1000);
            b.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("PUBLISHED");
            b.Property(e => e.Difficulty).HasMaxLength(20).IsRequired().HasDefaultValue("MEDIUM");
            b.Property(e => e.Tags).HasMaxLength(500);
            b.Property(e => e.SourceId).HasMaxLength(200);
            b.Property(e => e.SourceLicense).HasMaxLength(100);
            b.Property(e => e.ReviewStatus).HasMaxLength(30).IsRequired().HasDefaultValue("DRAFT");
            b.Property(e => e.ContentHash).HasMaxLength(64);
            b.Property(e => e.ReviewNotes).HasMaxLength(1000);
            b.Property(e => e.ReviewedAt).HasColumnType("datetime2");
            b.Property(e => e.AdministrativeApprovalStatus).HasMaxLength(30).IsRequired().HasDefaultValue("NONE");
            b.Property(e => e.AdministrativeApprovalScope).HasMaxLength(120);
            b.Property(e => e.AdministrativeApprovalSource).HasMaxLength(120);
            b.Property(e => e.AdministrativeApprovalNotes).HasMaxLength(1000);
            b.Property(e => e.AdministrativeApprovedAt).HasColumnType("datetime2");
            b.Property(e => e.HumanAcademicReviewStatus).HasMaxLength(30).IsRequired().HasDefaultValue("NOT_REVIEWED");
            b.Property(e => e.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(e => e.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(e => e.Lesson)
                .WithMany(l => l.Exercises)
                .HasForeignKey(e => e.LessonId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(e => e.GrammarPoint)
                .WithMany()
                .HasForeignKey(e => e.GrammarPointId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(e => e.Vocabulary)
                .WithMany()
                .HasForeignKey(e => e.VocabularyId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(e => e.HskLevel).HasDatabaseName("idx_exercises_hsk_level");
            b.HasIndex(e => e.Skill).HasDatabaseName("idx_exercises_skill");
            b.HasIndex(e => e.Status).HasDatabaseName("idx_exercises_status");
            b.HasIndex(e => e.Type).HasDatabaseName("idx_exercises_type");
            b.HasIndex(e => e.ReviewStatus).HasDatabaseName("idx_exercises_review_status");
            b.HasIndex(e => e.VocabularyId).HasDatabaseName("idx_exercises_vocab_id");
            b.HasIndex(e => e.SourceId).HasDatabaseName("idx_exercises_source_id");
            b.HasIndex(e => e.ContentHash).HasDatabaseName("idx_exercises_content_hash");
            b.HasIndex(e => new { e.HskLevel, e.Skill, e.Difficulty, e.Status })
                .HasDatabaseName("idx_exercises_hsk_skill_diff_status");
            b.HasIndex(e => new { e.HskLevel, e.AdministrativeApprovalStatus })
                .HasDatabaseName("idx_exercises_hsk_admin_approval");
        });

        // Question Bank Practice Sessions Configuration
        builder.Entity<QuestionBankPracticeSessionEntity>(b =>
        {
            b.ToTable("question_bank_practice_sessions");
            b.HasKey(s => s.Id);
            b.Property(s => s.Skill).HasMaxLength(50);
            b.Property(s => s.Difficulty).HasMaxLength(20);
            b.Property(s => s.Mode).HasMaxLength(30).IsRequired().HasDefaultValue("random");
            b.Property(s => s.Status).HasMaxLength(20).IsRequired().HasDefaultValue("IN_PROGRESS");
            b.Property(s => s.ExerciseIdsJson).HasColumnType("nvarchar(max)").IsRequired();
            b.Property(s => s.SelectionReasonsJson).HasColumnType("nvarchar(max)").IsRequired();
            b.Property(s => s.AnswersJson).HasColumnType("nvarchar(max)");
            b.Property(s => s.StartedAt).HasColumnType("datetime2").IsRequired();
            b.Property(s => s.CompletedAt).HasColumnType("datetime2");
            b.Property(s => s.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(s => s.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(s => new { s.UserId, s.StartedAt })
                .HasDatabaseName("idx_qb_practice_sessions_user_started");
        });

        // Wallet & Subscription Entities Configuration
        builder.Entity<UserWallet>(b =>
        {
            b.ToTable("user_wallets");
            b.HasKey(w => w.Id);
            b.Property(w => w.Balance).HasColumnType("decimal(18,2)").HasDefaultValue(0m).IsRequired();
            b.Property(w => w.Currency).HasMaxLength(10).HasDefaultValue("VND").IsRequired();
            b.Property(w => w.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(w => w.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(w => w.User)
                .WithOne(u => u.Wallet)
                .HasForeignKey<UserWallet>(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(w => w.UserId).IsUnique().HasDatabaseName("idx_user_wallets_user_id");
        });

        builder.Entity<WalletTransaction>(b =>
        {
            b.ToTable("wallet_transactions");
            b.HasKey(t => t.Id);
            b.Property(t => t.Amount).HasColumnType("decimal(18,2)").IsRequired();
            b.Property(t => t.BalanceBefore).HasColumnType("decimal(18,2)").IsRequired();
            b.Property(t => t.BalanceAfter).HasColumnType("decimal(18,2)").IsRequired();
            b.Property(t => t.TransactionType).HasMaxLength(50).IsRequired();
            b.Property(t => t.Reason).HasMaxLength(500).IsRequired();
            b.Property(t => t.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(t => t.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(t => t.Wallet)
                .WithMany(w => w.Transactions)
                .HasForeignKey(t => t.WalletId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(t => t.UserId).HasDatabaseName("idx_wallet_transactions_user_id");
            b.HasIndex(t => t.WalletId).HasDatabaseName("idx_wallet_transactions_wallet_id");
        });

        builder.Entity<UserSubscription>(b =>
        {
            b.ToTable("user_subscriptions");
            b.HasKey(s => s.Id);
            b.Property(s => s.Plan).HasMaxLength(50).HasDefaultValue("Free").IsRequired();
            b.Property(s => s.Status).HasMaxLength(20).HasDefaultValue("ACTIVE").IsRequired();
            b.Property(s => s.StartDate).HasColumnType("datetime2").IsRequired();
            b.Property(s => s.EndDate).HasColumnType("datetime2");
            b.Property(s => s.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(s => s.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(s => s.User)
                .WithOne(u => u.Subscription)
                .HasForeignKey<UserSubscription>(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(s => s.UserId).IsUnique().HasDatabaseName("idx_user_subscriptions_user_id");
        });

        // Exam Repository Configuration
        builder.Entity<ExamEntity>(b =>
        {
            b.ToTable("exams");
            b.HasKey(e => e.Id);
            b.Property(e => e.Code).HasMaxLength(64).IsRequired();
            b.Property(e => e.Title).HasMaxLength(250).IsRequired();
            b.Property(e => e.ExamType).HasMaxLength(32).HasDefaultValue("MOCK").IsRequired();
            b.Property(e => e.Description).HasMaxLength(1000);
            b.Property(e => e.Instructions).HasColumnType("nvarchar(max)");
            b.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("DRAFT").IsRequired();
            b.Property(e => e.ReviewNotes).HasMaxLength(1000);
            b.Property(e => e.ReviewedAt).HasColumnType("datetime2");
            b.Property(e => e.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(e => e.UpdatedAt).HasColumnType("datetime2");

            b.HasIndex(e => e.Code).IsUnique().HasDatabaseName("idx_exams_code");
            b.HasIndex(e => new { e.HskLevel, e.Status }).HasDatabaseName("idx_exams_hsk_status");
        });

        builder.Entity<ExamQuestionEntity>(b =>
        {
            b.ToTable("exam_questions");
            b.HasKey(q => q.Id);
            b.Property(q => q.SectionName).HasMaxLength(64).HasDefaultValue("Đọc hiểu").IsRequired();
            b.Property(q => q.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(q => q.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(q => q.Exam)
                .WithMany(e => e.Questions)
                .HasForeignKey(q => q.ExamId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(q => q.Exercise)
                .WithMany()
                .HasForeignKey(q => q.ExerciseId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(q => new { q.ExamId, q.ExerciseId })
                .IsUnique()
                .HasDatabaseName("idx_exam_questions_exam_exercise");
            b.HasIndex(q => new { q.ExamId, q.OrderIndex })
                .HasDatabaseName("idx_exam_questions_exam_order");
        });

        builder.Entity<StudentExamAttempt>(b =>
        {
            b.ToTable("student_exam_attempts");
            b.HasKey(a => a.Id);
            b.Property(a => a.AnswersJson).HasColumnType("nvarchar(max)");
            b.Property(a => a.StartedAt).HasColumnType("datetime2").IsRequired();
            b.Property(a => a.SubmittedAt).HasColumnType("datetime2");
            b.Property(a => a.CreatedAt).HasColumnType("datetime2").IsRequired();
            b.Property(a => a.UpdatedAt).HasColumnType("datetime2");

            b.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(a => a.Exam)
                .WithMany()
                .HasForeignKey(a => a.ExamId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(a => new { a.ExamId, a.UserId }).HasDatabaseName("idx_student_exam_attempts_exam_user");
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        foreach (var entry in ChangeTracker.Entries<ApplicationUser>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        foreach (var entry in ChangeTracker.Entries<VocabularyEntity>())
        {
            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                entry.Entity.Hanzi = VocabularyKeyNormalizer.NormalizeHanzi(entry.Entity.Hanzi);
                entry.Entity.Pinyin = (entry.Entity.Pinyin ?? string.Empty).Trim();
                entry.Entity.Homograph = string.IsNullOrWhiteSpace(entry.Entity.Homograph)
                    ? null
                    : entry.Entity.Homograph.Trim();
                entry.Entity.NormalizedPinyin = VocabularyKeyNormalizer.NormalizePinyin(entry.Entity.Pinyin);
                entry.Entity.NormalizedHomograph = VocabularyKeyNormalizer.NormalizeHomograph(entry.Entity.Homograph);
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
