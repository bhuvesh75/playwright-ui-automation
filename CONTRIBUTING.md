# Contributing

## Adding a New Test

1. Choose the right suite:
   - **smoke/** — fast sanity checks that the app is alive
   - **functional/** — focused tests for a single feature or page
   - **regression/** — full end-to-end flows that validate multiple features together

2. Use the Page Object Model. Add locators and methods to the relevant page class in `pages/` rather than querying the DOM directly from spec files.

3. Prefer `storageState` for authenticated tests. Only use `loginPage.navigateToLogin()` in tests that explicitly need the login form.

4. Run the suite locally before opening a pull request:

   ```bash
   npm ci
   npx playwright install --with-deps chromium
   npm test
   ```

## Adding a New Page Object

1. Create `pages/MyPage.js` extending `BasePage`.
2. Define locators as constructor properties.
3. Expose action and assertion methods.
4. Import and use it from your spec files.

## Selector Guidelines

- Prefer `data-test` attributes when available.
- Fall back to stable IDs (`#id`) or accessible roles.
- Avoid brittle CSS class selectors or positional XPath.

## Code Style

- Keep spec files declarative — logic belongs in page objects.
- Document non-obvious choices with `// WHY:` comments.
- Match the indentation and naming conventions already present in the codebase.
