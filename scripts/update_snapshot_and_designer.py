import os

snapshot_path = r'Backend\src\Data\Persistence\Migrations\ApplicationDbContextModelSnapshot.cs'
with open(snapshot_path, 'r', encoding='utf-8') as f:
    content = f.read()

content_norm = content.replace('\r\n', '\n')

# Create designer content from snapshot
designer_content = content_norm.replace(
    'using Microsoft.EntityFrameworkCore.Storage.ValueConversion;',
    'using Microsoft.EntityFrameworkCore.Migrations;\nusing Microsoft.EntityFrameworkCore.Storage.ValueConversion;'
)

designer_content = designer_content.replace(
    '[DbContext(typeof(ApplicationDbContext))]\n    partial class ApplicationDbContextModelSnapshot : ModelSnapshot\n    {\n        protected override void BuildModel(ModelBuilder modelBuilder)',
    '[DbContext(typeof(ApplicationDbContext))]\n    [Migration("20261106004600_AddContentReviewAndHanziFields")]\n    partial class AddContentReviewAndHanziFields\n    {\n        /// <inheritdoc />\n        protected override void BuildTargetModel(ModelBuilder modelBuilder)'
)

designer_path = r'Backend\src\Data\Persistence\Migrations\20261106004600_AddContentReviewAndHanziFields.Designer.cs'
with open(designer_path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(designer_content)

print('SUCCESS: Updated designer file properly')
