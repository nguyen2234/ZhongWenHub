path = r'Backend\tests\ZhongWenHub.IntegrationTests\Hsk2ReviewWorkflowIntegrationTests.cs'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Grammar_CannotPublishWithoutTitleOrExplanationOrStructure
old_code_1 = """            testGrammarId = g.Id;
        }

        // 1. Review to PUBLISHED -> must fail"""

new_code_1 = """            testGrammarId = g.Id;
        }

        try
        {
            // 1. Review to PUBLISHED -> must fail"""

old_cleanup_1 = """        // Clean up
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var g = await db.GrammarPoints.FindAsync(testGrammarId);
            if (g != null)
            {
                db.GrammarPoints.Remove(g);
                await db.SaveChangesAsync();
            }
        }
    }"""

new_cleanup_1 = """        }
        finally
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var g = await db.GrammarPoints.FindAsync(testGrammarId);
                if (g != null)
                {
                    db.GrammarPoints.Remove(g);
                    await db.SaveChangesAsync();
                }
            }
        }
    }"""

# 2. Student_CannotAccessPendingReviewOrDraftGrammarPoint_ById
old_code_2 = """            testGrammarId = g.Id;
        }

        // Student query by ID"""

new_code_2 = """            testGrammarId = g.Id;
        }

        try
        {
            // Student query by ID"""

old_cleanup_2 = """        // Clean up
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var g = await db.GrammarPoints.FindAsync(testGrammarId);
            if (g != null)
            {
                db.GrammarPoints.Remove(g);
                await db.SaveChangesAsync();
            }
        }
    }"""

new_cleanup_2 = """        }
        finally
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var g = await db.GrammarPoints.FindAsync(testGrammarId);
                if (g != null)
                {
                    db.GrammarPoints.Remove(g);
                    await db.SaveChangesAsync();
                }
            }
        }
    }"""

c = c.replace(old_code_1, new_code_1, 1)
c = c.replace(old_cleanup_1, new_cleanup_1, 1)
c = c.replace(old_code_2, new_code_2, 1)
c = c.replace(old_cleanup_2, new_cleanup_2, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Successfully wrapped cleanup in try-finally')
