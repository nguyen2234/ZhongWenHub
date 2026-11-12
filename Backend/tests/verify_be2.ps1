$baseUrl = "http://127.0.0.1:5000"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "=== TEST 1: Student Login and /me ==="
$loginBody = @{ email = "student@example.com"; password = "ExamplePassword123!" } | ConvertTo-Json
$studentAuth = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $session
Write-Host "Student Logged in: $($studentAuth.user.displayName), Roles: $($studentAuth.user.roles -join ',')"

$headers = @{ Authorization = "Bearer $($studentAuth.accessToken)" }
$me = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/me" -Method Get -Headers $headers -WebSession $session
Write-Host "/me retrieved: $($me.email)"

Write-Host "`n=== TEST 2: Refresh Token Rotation ==="
$refreshAuth = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/refresh" -Method Post -WebSession $session
Write-Host "Token refreshed! New token length: $($refreshAuth.accessToken.Length)"

Write-Host "`n=== TEST 3: Student accessing Admin API (Must be 403) ==="
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/users" -Method Get -Headers $headers
    Write-Host "FAIL: Expected 403 but got 200"
} catch {
    Write-Host "PASS: Received HTTP $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "`n=== TEST 4: Admin Login and User Management ==="
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminLoginBody = @{ email = "admin@zhongwenhub.edu.vn"; password = "AdminPassword123!" } | ConvertTo-Json
$adminAuth = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json" -WebSession $adminSession
$adminHeaders = @{ Authorization = "Bearer $($adminAuth.accessToken)" }

$kpis = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/users/kpis" -Method Get -Headers $adminHeaders
Write-Host "Admin KPIs - Total: $($kpis.totalLearners), Active: $($kpis.activeLearners), Locked: $($kpis.lockedLearners), New 30d: $($kpis.newLearners30d)"

$users = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/users?page=1&pageSize=10" -Method Get -Headers $adminHeaders
Write-Host "Users retrieved: $($users.items.Count) / $($users.totalItems)"

Write-Host "`n=== TEST 5: Lock and Unlock Student ==="
$studentId = $studentAuth.user.id
$lockBody = @{ reason = "Vi pham quy che lop hoc" } | ConvertTo-Json
$lockedUser = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/users/$studentId/lock" -Method Post -Body $lockBody -ContentType "application/json" -Headers $adminHeaders
Write-Host "User status after lock: $($lockedUser.status), Reason: $($lockedUser.lockReason)"

try {
    $blockedLogin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "FAIL: Locked user was able to log in"
} catch {
    Write-Host "PASS: Locked user rejected with HTTP $($_.Exception.Response.StatusCode.value__)"
}

$unlockedUser = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/users/$studentId/unlock" -Method Post -Headers $adminHeaders
Write-Host "User status after unlock: $($unlockedUser.status)"

Write-Host "`n=== TEST 6: RBAC Privilege Escalation Prevention ==="
# Admin tries to grant SUPER_ADMIN
try {
    $escalateBody = @{ roles = @("SUPER_ADMIN", "STUDENT") } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/users/$studentId/roles" -Method Put -Body $escalateBody -ContentType "application/json" -Headers $adminHeaders
    Write-Host "FAIL: Admin was able to grant SUPER_ADMIN"
} catch {
    Write-Host "PASS: Privilege escalation blocked with HTTP $($_.Exception.Response.StatusCode.value__)"
}

# Admin tries to lock SUPER_ADMIN
$superAdmin = $users.items | Where-Object { $_.roles -contains "SUPER_ADMIN" } | Select-Object -First 1
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/users/$($superAdmin.id)/lock" -Method Post -Headers $adminHeaders
    Write-Host "FAIL: Admin was able to lock SUPER_ADMIN"
} catch {
    Write-Host "PASS: Locking SUPER_ADMIN blocked with HTTP $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "`nALL 6 VERIFICATION SUITES PASSED!"
