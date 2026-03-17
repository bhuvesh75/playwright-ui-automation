/**
 * @file        CheckoutPage.js
 * @description Page Object for the Sauce Demo checkout flow
 *              (step-one, step-two, and confirmation pages).
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

class CheckoutPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // Step one — shipping information
    this.firstNameField  = page.locator('[data-test="firstName"]');
    this.lastNameField   = page.locator('[data-test="lastName"]');
    this.postalCodeField = page.locator('[data-test="postalCode"]');
    this.continueButton  = page.locator('[data-test="continue"]');

    // Step two — order summary
    this.summaryTotal    = page.locator('.summary_total_label');
    this.finishButton    = page.locator('[data-test="finish"]');

    // Confirmation
    this.thankYouHeader  = page.locator('.complete-header');

    // Shared error message (step one)
    this.errorMessage    = page.locator('[data-test="error"]');
  }

  /**
   * Assert the browser is on checkout step one (shipping info).
   */
  async assertOnStepOne() {
    await expect(this.page).toHaveURL(/checkout-step-one\.html/);
    await expect(this.firstNameField).toBeVisible();
  }

  /**
   * Assert the browser is on checkout step two (order summary).
   */
  async assertOnStepTwo() {
    await expect(this.page).toHaveURL(/checkout-step-two\.html/);
    await expect(this.summaryTotal).toBeVisible();
  }

  /**
   * Assert the browser is on the order confirmation page.
   */
  async assertOnConfirmation() {
    await expect(this.page).toHaveURL(/checkout-complete\.html/);
    await expect(this.thankYouHeader).toBeVisible();
  }

  /**
   * Fill the shipping information form fields.
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} postalCode
   */
  async fillShippingInfo(firstName, lastName, postalCode) {
    await this.firstNameField.fill(firstName);
    await this.lastNameField.fill(lastName);
    await this.postalCodeField.fill(postalCode);
  }

  /**
   * Click the Continue button on step one.
   */
  async clickContinue() {
    await this.continueButton.click();
  }

  /**
   * Click the Finish button on step two.
   */
  async clickFinish() {
    await this.finishButton.click();
    await this.page.waitForURL('**/checkout-complete.html');
  }

  /**
   * Return the order total text from the summary page (e.g. "Total: $32.39").
   * @returns {Promise<string>}
   */
  async getOrderTotal() {
    return this.summaryTotal.textContent();
  }

  /**
   * Return the thank-you confirmation message text.
   * @returns {Promise<string>}
   */
  async getThankYouMessage() {
    return this.thankYouHeader.textContent();
  }

  /**
   * Assert the error message on step one contains the given text.
   * @param {string} text
   */
  async assertErrorContains(text) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(text);
  }
}

module.exports = CheckoutPage;
