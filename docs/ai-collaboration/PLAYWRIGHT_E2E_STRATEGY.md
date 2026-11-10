# Playwright End-to-End Testing Strategy

## 1. Principles of Real E2E Testing

Playwright tests in ZhongWenHub must operate against real, running services:
- Real Vite / React frontend server (`http://127.0.0.1:5173`).
- Real ASP.NET Core .NET 10 backend server (`http://127.0.0.1:5000` or `Testing` environment).
- Real SQL Server database verified as `ZhongWenHub_Test`.

**Mock APIs are strictly forbidden for tests claiming to be Real E2E.**

## 2. Multi-Viewport & Device Coverage

Tests are executed against two standard viewports:
1. **Desktop**: `1440 x 900` (Chromium)
2. **Mobile**: `390 x 844` (iPhone 12 / Chromium Mobile emulation)

## 3. Lesson-by-Lesson E2E Suite Structure

Located in `Fontend/e2e/`:
- `hsk1-full-curriculum-e2e.spec.ts` — HSK 1 6 Units, 15 Lessons.
- `hsk2-full-curriculum-e2e.spec.ts` — HSK 2 5 Units, 15 Lessons.
- `hsk3-full-curriculum-e2e.spec.ts` — HSK 3 5 Units, 20 Lessons.
- `hsk4-full-curriculum-e2e.spec.ts` — HSK 4 5 Units, 20 Lessons.

### Key Verification Checkpoints
- **Draft Protection**: Student user attempting direct navigation receives 404 / redirection.
- **Content Manager Preview**: Authorized user can view draft curriculum elements.
- **Component Integrity**: Vocabulary list, grammar notes, dialogue audio player, reading passage, and interactive exercises are rendered and functional.
- **Answer Submission**: Interactive exercise form accepts input, submits, and renders correct/incorrect feedback with explanation.

