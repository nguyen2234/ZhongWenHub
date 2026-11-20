# Antigravity main-readiness remediation plan

This plan applies to `fix/full-stack-review-integration` at commit
`02b2ccf87578077e357ebe8977c1b78f7019aa8b` and PR #26. Do not merge the
branch into `main` until every P1 gate below is complete and the required
checks pass on the final remote commit.

## Working rules

- Fetch and inspect the latest remote commit before editing.
- Preserve unrelated local changes. Do not reset or force-push.
- Use `ZhongWenHub_Test` for write/integration tests. Keep
  `ZhongWenHub_Dev` read-only.
- Keep secrets out of source, logs, test artifacts, PR descriptions, and
  screenshots.
- Push fixes to `fix/full-stack-review-integration` and keep PR #26 in draft
  until the final review gate passes.

## P1. Password reset must fail honestly and deliver privately

### Confirmed problem

`PasswordResetEmailSender` returns without sending when `MailHost` is missing
and catches SMTP exceptions without propagating failure. The public API can
therefore say that an email was sent when delivery never happened.

### Required implementation

- Keep the reset token out of HTTP responses and application logs.
- Validate all password-reset mail configuration before generating a token.
- Require an absolute HTTPS `PasswordReset:FrontendUrl` outside tests.
- Treat missing SMTP configuration and SMTP delivery failure as a typed
  service-unavailable result. Return a non-sensitive `503` response.
- Preserve account-enumeration protection. Existing and unknown email
  addresses must receive indistinguishable public responses when the mail
  system is available.
- Apply rate limiting to forgot/reset endpoints.
- Revoke all active refresh tokens after a successful reset.
- Verify one-time token behavior and expired-token behavior.

### Acceptance tests

- Existing account sends exactly one email and response contains no token.
- Unknown account does not reveal whether it exists.
- Missing mail configuration returns `503` and does not claim delivery.
- SMTP failure returns `503` and logs no credentials or reset token.
- Used and expired tokens are rejected.
- A successful reset invalidates old refresh tokens.
- Run one real SMTP sandbox test. A spy-only test does not satisfy this gate.

## P1. Account status and role changes must affect issued access tokens

### Confirmed problem

JWT authorization validates claims embedded when the token was issued. A user
whose account is locked or whose roles are changed can retain access until the
access token expires.

### Required implementation

- Add an authorization/security-stamp validation step for authenticated API
  requests that require current account state.
- Reject deleted, locked, suspended, or inactive accounts even when the JWT is
  otherwise valid.
- Ensure changed roles/permissions take effect promptly. Choose and document
  either security-stamp invalidation or short-lived access tokens plus session
  version validation.
- Revoke refresh tokens when an administrator locks a user or changes
  security-sensitive roles.
- Keep authorization enforcement in BE endpoints. FE route guards remain a UI
  aid.

### Acceptance tests

- Login, lock the account, then call an authorized endpoint with the old
  access token. The request must fail.
- Login, remove an Admin role, then call an Admin endpoint with the old token.
  The request must fail.
- Old refresh tokens cannot restore a revoked role or locked account.

## P1. Admin settings must have real effect or be read-only

### Confirmed problem

`MaxLoginAttempts`, `SessionTimeoutMinutes`, and `IsMaintenanceMode` are stored
but are not consumed by login, token/session, or maintenance middleware.

### Required implementation

Choose one behavior per setting:

1. Implement it end-to-end, including runtime consumption and tests.
2. Remove it from the editable API/FE and display it as deployment-managed or
   unsupported.

Do not accept and persist a value that has no effect. Keep 2FA disabled until
TOTP enrollment, recovery codes, and login verification exist. Store settings
atomically in a durable shared store if multiple API instances are supported.
Do not silently replace corrupt settings with defaults.

### Acceptance tests

- Every editable setting changes observable system behavior after saving.
- Unsupported settings produce a clear `400` response and disabled FE control.
- Restarting the API preserves supported settings.

## P2. Admin analytics must use event data for the selected period

### Confirmed problem

The current report counts active users outside the Student role, estimates
learning hours as `attempts * 0.25`, and treats active-user percentage as
retention. Filtering an accumulated statistics row by its update time can pull
historical attempts into the selected period.

### Required implementation

- Count only users in the Student role.
- Define period boundaries consistently in UTC and validate `7d`, `30d`,
  `90d`, and `1y`.
- Sum learning time from `StudentDailyActivities.Minutes` in the selected
  period.
- Calculate practice attempts and accuracy from attempt events created inside
  the selected period.
- Calculate retention as students active in the previous equivalent period
  who returned in the current period.
- Return `null` for undefined ratios. Use zero only for measured zero.
- Document each metric in the DTO/API contract.

### Acceptance tests

- Seed events inside and outside the period and prove correct inclusion.
- Prove Teacher/Admin accounts are excluded from student metrics.
- Verify empty-period responses and boundary dates.

## P2. AI telemetry must describe measured data only

### Confirmed problem

Telemetry includes mock logs, reports `100%` success when there are no
requests, labels historical success rate as uptime, and infers `ONLINE` from
historical events. FE service toggles only modify local React state.

### Required implementation

- Exclude `AiUsageLog.IsMock` from production telemetry.
- Return `null` or `UNKNOWN` when no data exists.
- Name success rate accurately. Do not call it uptime.
- Report live availability only from a real health check with a defined
  freshness window.
- Remove local-only service toggles. Add a secured BE control API only if the
  application can actually enable/disable that service.
- Remove all production fallback fixtures and incident arrays from the Admin
  page.

### Acceptance tests

- An empty database shows an explicit no-data state.
- Mock logs do not affect totals.
- Real failed/successful requests produce the expected success rate.
- No FE action claims to change service state without a successful BE result.

## P2. Full-stack regression and release gate

Run these checks on the final commit:

```bash
dotnet restore Backend/ZhongWenHub.sln
dotnet build Backend/ZhongWenHub.sln --configuration Release --no-restore
dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj \
  --configuration Release --no-build --filter "Category!=Integration"
cd Fontend
bun install --frozen-lockfile
bun run lint
bun test src/tests
bun run build
```

Also run SQL Server integration tests against `ZhongWenHub_Test` and browser
tests for:

- login, lock, role removal, refresh, and logout;
- forgot-password email delivery and reset;
- Admin dashboard/settings/analytics;
- Admin video creation and publication, followed by student playback;
- unauthorized and expired-session behavior.

## Final handoff

Update PR #26 with:

- final remote commit SHA;
- list of changed BE and FE files;
- API/DTO/configuration changes;
- exact test commands and results;
- SMTP sandbox and SQL Server test evidence;
- remaining mock/runtime gaps;
- an explicit statement that all P1 gates above are complete.

Request another review. Do not merge PR #26 until that review confirms the
remote commit and required checks.
