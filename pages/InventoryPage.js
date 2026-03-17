/**
 * @file        InventoryPage.js
 * @description Page Object for the Sauce Demo inventory/product page (/inventory.html).
 *              Encapsulates product listing, sorting, add-to-cart, and navigation actions.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

class InventoryPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    this.productList      = page.locator('.inventory_list');
    this.productItems     = page.locator('.inventory_item');
    this.productNames     = page.locator('.inventory_item_name');
    this.sortDropdown     = page.locator('[data-test="product_sort_container"]');
    this.cartBadge        = page.locator('.shopping_cart_badge');
    this.cartLink         = page.locator('.shopping_cart_link');
  }

  /**
   * Navigate to the inventory page.
   * storageState has already set session-username in localStorage so React
   * renders inventory without a login redirect.
   *
   * WHY: waitUntil 'domcontentloaded' is used intentionally (not 'load').
   * 'load' blocks until ALL sub-resources (images, CSS, JS bundles) finish.
   * When saucedemo.com's CDN rate-limits from GitHub Actions IPs, sub-resources
   * time out while the HTML itself arrives fine — 'load' would hang for 120 s
   * while 'domcontentloaded' lets us proceed once the DOM is parsed.
   * React hydrates from the already-parsed DOM + localStorage auth state and
   * renders the product list quickly, well within the 120 s waitFor below.
   */
  async navigate() {
    await this.page.goto('/inventory.html', {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await this.productList.waitFor({ state: 'visible', timeout: 120_000 });
  }

  /**
   * Assert the browser is on the inventory page.
   */
  async assertOnInventoryPage() {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await expect(this.productList).toBeVisible();
  }

  /**
   * Return the count of visible product items.
   * @returns {Promise<number>}
   */
  async getProductCount() {
    return this.productItems.count();
  }

  /**
   * Return the name of the first product in the current listing order.
   * @returns {Promise<string>}
   */
  async getFirstProductName() {
    return this.productNames.first().textContent();
  }

  /**
   * Select a sort option from the dropdown.
   * @param {'az'|'za'|'lohi'|'hilo'} option - Sort key matching the <option> values.
   *
   * WHY: Explicit waitFor before selectOption ensures the dropdown is interactive.
   * In CI, the element can exist in the DOM but not yet accept input if the page
   * is still hydrating; the wait absorbs that delay without an arbitrary sleep.
   */
  async sortBy(option) {
    await this.sortDropdown.waitFor({ state: 'visible', timeout: 120_000 });
    await this.sortDropdown.selectOption(option, { timeout: 60_000 });
  }

  /**
   * Click the "Add to cart" button for the product with the given name.
   * @param {string} productName - Exact display name of the product.
   */
  async addProductToCart(productName) {
    const item = this.page
      .locator('.inventory_item')
      .filter({ has: this.page.locator('.inventory_item_name', { hasText: productName }) });

    await item.locator('button', { hasText: 'Add to cart' }).click();
  }

  /**
   * Click the "Remove" button for the product with the given name.
   * @param {string} productName - Exact display name of the product.
   */
  async removeProductFromCart(productName) {
    const item = this.page
      .locator('.inventory_item')
      .filter({ has: this.page.locator('.inventory_item_name', { hasText: productName }) });

    await item.locator('button', { hasText: 'Remove' }).click();
  }

  /**
   * Return the cart badge count as a string, or null if the badge is hidden.
   * @returns {Promise<string|null>}
   */
  async getCartBadgeCount() {
    const visible = await this.cartBadge.isVisible();
    return visible ? this.cartBadge.textContent() : null;
  }

  /**
   * Click the cart icon to navigate to the cart page.
   */
  async goToCart() {
    await this.cartLink.click();
    await this.page.waitForURL('**/cart.html');
  }
}

module.exports = InventoryPage;
