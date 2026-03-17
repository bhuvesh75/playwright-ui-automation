# playwright-ui-automation

Production-grade Playwright E2E UI automation framework targeting [Sauce Demo](https://www.saucedemo.com).

## Tech Stack

| Layer | Tool |
|---|---|
| Test runner | [Playwright](https://playwright.dev/) 1.48+ |
| Language | JavaScript (Node.js 20) |
| Pattern | Page Object Model (POM) |
| Auth strategy | `globalSetup` + `storageState` |
| CI | GitHub Actions |
| Browser | Chromium |

## Project Structure

```
playwright-ui-automation/
├── .github/workflows/playwright.yml   # CI pipeline
├── fixtures/                          # Static test data (JSON)
│   ├── products.json
│   ├── validUser.json
│   └── lockedUser.json
├── pages/                             # Page Object Model classes
│   ├── BasePage.js
│   ├── LoginPage.js
│   ├── InventoryPage.js
│   ├── CartPage.js
│   └── CheckoutPage.js
├── playwright/.auth/                  # Generated auth state (gitignored)
├── support/
│   └── globalSetup.js                 # Logs in once and saves storageState
├── tests/
│   ├── smoke/
│   │   └── smoke.spec.js              # Quick sanity checks
│   ├── functional/
│   │   ├── login.spec.js
│   │   ├── products.spec.js
│   │   ├── cart.spec.js
│   │   └── checkout.spec.js
│   └── regression/
│       └── fullRegression.spec.js     # End-to-end regression suite
├── .env.example                       # Environment variable template
├── playwright.config.js
└── package.json
```

## Prerequisites

- Node.js 20+
- npm 9+

## Setup

```bash
# 1. Install dependencies
npm ci

# 2. Install Chromium browser
npx playwright install --with-deps chromium

# 3. (Optional) Copy environment template
cp .env.example .env
```

## Running Tests

```bash
# All tests (smoke + functional + regression)
npm test

# Smoke suite only (fast sanity check)
npm run test:smoke

# Functional suite only
npm run test:functional

# Regression suite only
npm run test:regression

# Open interactive HTML report after a run
npm run report
```

## Authentication Strategy

`support/globalSetup.js` runs **once** before the test suite starts. It:

1. Launches a headless Chromium browser
2. Logs in to Sauce Demo with `standard_user` credentials
3. Saves the resulting `storageState` (localStorage + cookies) to `playwright/.auth/user.json`

All authenticated tests then restore this state via `playwright.config.js`:

```js
use: { storageState: 'playwright/.auth/user.json' }
```

Tests that need the login form (e.g., `login.spec.js`) call `loginPage.navigateToLogin()`, which clears localStorage before navigating to `'/'`.

## CI/CD

Tests run automatically on every push and pull request to `main`.

| Step | What happens |
|---|---|
| `npm ci` | Install exact dependency versions from lockfile |
| `npx playwright install --with-deps chromium` | Install browser |
| Smoke → Functional → Regression | Run suites sequentially |
| Upload artifacts | HTML report (14 days) + raw results (7 days) |

CI artifacts (screenshots, videos, traces) are uploaded even on failure so failures can be debugged without re-running.

## Configuration

Key settings in `playwright.config.js`:

| Setting | Value | Why |
|---|---|---|
| `workers` | 1 | Prevents parallel CDN requests that trigger rate-limiting on saucedemo.com |
| `retries` | 2 (CI), 0 (local) | Absorbs transient CDN blips without masking real failures |
| `navigationTimeout` | 120 s | saucedemo.com CDN can be slow to respond from CI IPs |
| `fullyParallel` | false | Pairs with `workers: 1` for sequential execution |

## Environment Variables

See `.env.example` for all supported variables.

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `https://www.saucedemo.com` | Application under test |
| `STANDARD_USERNAME` | `standard_user` | Login username for globalSetup |
| `STANDARD_PASSWORD` | `secret_sauce` | Login password for globalSetup |
