path = r'Backend\tests\ZhongWenHub.IntegrationTests\Hsk2ReviewWorkflowIntegrationTests.cs'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace UpdatedCount -> ProcessedCount
c = c.replace('Assert.Equal(2, result1.UpdatedCount);', 'Assert.Equal(2, result1.ProcessedCount);')
c = c.replace('Assert.Empty(result1.Errors);', 'Assert.Empty(result1.SkippedReasons);')
c = c.replace('Assert.Equal(2, result2.UpdatedCount);', 'Assert.Equal(2, result2.ProcessedCount);')
c = c.replace('Assert.Equal(1, result.UpdatedCount);', 'Assert.Equal(1, result.ProcessedCount);')
c = c.replace('Assert.True(result.Errors.ContainsKey(incompleteId.ToString()));', 'Assert.Equal(1, result.SkippedCount);\n        Assert.NotEmpty(result.SkippedReasons);')

# Replace HanViet -> SinoVietnamese
c = c.replace('HanViet = "tự",', 'SinoVietnamese = "tự",')
c = c.replace('HanViet = "tự (cập nhật)",', 'Pinyin = "zì",\n            SinoVietnamese = "tự (cập nhật)",')
c = c.replace('Assert.Equal("tự (cập nhật)", updated.HanViet);', 'Assert.Equal("tự (cập nhật)", updated.SinoVietnamese);')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated integration test properties successfully')
