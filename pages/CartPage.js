/**
 * @file        CartPage.js
 * @description Page Object for the Sauce Demo shopping cart page (/cart.html).
 *              Encapsulates cart item inspection, removal, and navigation actions.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

class CartPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    this.cartItems         = page.locator('.cart_item');
    this.itemNames         = page.locator('.inventory_item_name');
    this.checkoutButton    = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  /**
   * Assert the browser is on the cart page.
   */
  async assertOnCartPage() {
    await expect(this.page).toHaveURL(/cart\.html/);
  }

  /**
   * Return the number of items currently in the cart.
   * @returns {Promise<number>}
   */
  async getItemCount() {
    return this.cartItems.count();
  }

  /**
   * Assert a product with the given name is visible in the cart.
   * @param {string} productName
   */
  async assertItemVisible(productName) {
    await expect(
      this.page.locator('.inventory_item_name', { hasText: productName })
    ).toBeVisible();
  }

  /**
   * Click the Remove button for the specified product.
   * @param {string} productName - Exact display name of the product.
   */
  async removeItem(productName) {
    const item = this.page
      .locator('.cart_item')
      .filter({ has: this.page.locator('.inventory_item_name', { hasText: productName }) });

    await item.locator('button', { hasText: 'Remove' }).click();
  }

  /**
   * Click the Checkout button to proceed to checkout step one.
   */
  async clickCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForURL('**/checkout-step-one.html');
  }

  /**
   * Click Continue Shopping to return to the inventory page.
   */
  async clickContinueShopping() {
    await this.continueShoppingButton.click();
    await this.page.waitForURL('**/inventory.html');
  }
}

module.exports = CartPage;
