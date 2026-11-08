path = r'D:\ZhongWenHub\Backend\src\Api\Controllers\SystemController.cs'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = """    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHealth(CancellationToken cancellationToken)
    {
        var dbCanConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
        if (!dbCanConnect)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "Unhealthy", database = "Disconnected" });
        }

        return Ok(new { status = "Healthy", database = "Connected", timestamp = DateTime.UtcNow });
    }"""

replacement = """    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHealth(CancellationToken cancellationToken)
    {
        var dbCanConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
        if (!dbCanConnect)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "Unhealthy", database = "Disconnected" });
        }

        return Ok(new { status = "Healthy", database = "Connected", timestamp = DateTime.UtcNow });
    }

    [HttpGet("database-environment")]
    [AllowAnonymous]
    public IActionResult GetDatabaseEnvironment()
    {
        var dbConn = _dbContext.Database.GetDbConnection();
        var dbName = dbConn.Database;
        var isTestDb = dbName.EndsWith("_Test", StringComparison.OrdinalIgnoreCase) ||
                       dbName.Contains("Test", StringComparison.OrdinalIgnoreCase);

        return Ok(new
        {
            databaseName = dbName,
            isTestDatabase = isTestDb,
            environment = _env.EnvironmentName,
            timestampUtc = DateTime.UtcNow
        });
    }"""

if target in c:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c.replace(target, replacement, 1))
    print("SystemController updated successfully!")
else:
    print("Target not found in SystemController.cs!")
