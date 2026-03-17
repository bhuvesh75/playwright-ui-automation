/**
 * @file        LoginPage.js
 * @description Page Object for the Sauce Demo login page (/).
 *              Encapsulates all selectors and interactions for the
 *              authentication screen.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // Locators — defined once so selector changes affect only this file
    this.usernameInput  = page.locator('#user-name');
    this.passwordInput  = page.locator('#password');
    this.loginButton    = page.locator('#login-button');
    this.errorMessage   = page.locator('[data-test="error"]');
    this.loginContainer = page.locator('.login_container');
  }

  /**
   * Navigate to the login page, clearing localStorage first so React renders
   * the login form rather than redirecting to /inventory.html.
   *
   * WHY: addInitScript() runs in the page's JS context before any page script
   * executes (equivalent to Cypress's onBeforeLoad callback). Clearing
   * localStorage here removes 'session-username' so the app shows the login
   * form. The script is bound to this page instance only and does not affect
   * other tests.
   */
  async navigateToLogin() {
    await this.page.addInitScript(() => localStorage.clear());
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.usernameInput.waitFor({ state: 'visible' });
  }

  /**
   * Fill the username field.
   * @param {string} username
   */
  async enterUsername(username) {
    await this.usernameInput.fill(username);
  }

  /**
   * Fill the password field.
   * @param {string} password
   */
  async enterPassword(password) {
    await this.passwordInput.fill(password);
  }

  /**
   * Click the Login button.
   */
  async clickLogin() {
    await this.loginButton.click();
  }

  /**
   * Complete the full login flow: fill credentials and submit.
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  /**
   * Return the visible error message text.
   * @returns {Promise<string>}
   */
  async getErrorText() {
    return this.errorMessage.textContent();
  }

  /**
   * Assert the login form is visible (used in smoke/sanity checks).
   */
  async assertLoginPageVisible() {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Assert an error message containing the given text is displayed.
   * @param {string} text
   */
  async assertErrorContains(text) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(text);
  }
}

module.exports = LoginPage;
