/**
 * @file        BasePage.js
 * @description Abstract base class for all Page Object Model pages.
 *              Encapsulates the Playwright page instance and provides
 *              shared navigation helpers used by every child page.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

class BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a path relative to the configured baseURL.
   * @param {string} path - Relative URL path (e.g. '/inventory.html').
   */
  async navigate(path = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Return the current page title.
   * @returns {Promise<string>}
   */
  async getTitle() {
    return this.page.title();
  }

  /**
   * Return the current page URL.
   * @returns {string}
   */
  getURL() {
    return this.page.url();
  }
}

module.exports = BasePage;
