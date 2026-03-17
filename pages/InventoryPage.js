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
   *
   * WHY addInitScript: login tests register `page.addInitScript(() =>
   * localStorage.clear())` on their pages. In Playwright, localStorage is
   * shared across all pages in the same browser context (same as real-browser
   * tab behavior). When those pages navigate, the init script clears
   * session-username from the context-wide storage. Subsequent pages that
   * navigate to /inventory.html then get the React login-error screen instead
   * of the inventory. Re-injecting session-username here — as an init script
   * so it runs BEFORE React checks auth — ensures the inventory always renders
   * regardless of what prior tests did to shared storage.
   *
   * WHY waitUntil 'domcontentloaded' (not 'load'):
   * 'load' blocks until ALL sub-resources (images, CSS, JS bundles) finish.
   * When saucedemo.com's CDN rate-limits from GitHub Actions IPs, sub-resources
   * time out while the HTML itself arrives fine — 'load' would hang for 120 s
   * while 'domcontentloaded' lets us proceed once the DOM is parsed.
   * The JS bundle is intercepted and served from the worker-context jsCache
   * (see fixtures.js), so React hydrates quickly after domcontentloaded.
   */
  async navigate() {
    // Restore auth before React evaluates it.  See WHY comment above.
    await this.page.addInitScript(() => {
      localStorage.setItem('session-username', 'standard_user');
    });
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
   * WHY: 'attached' (not 'visible') is used for the waitFor, and force: true is
   * passed to selectOption. In CI, when saucedemo.com's CDN rate-limits sub-resource
   * requests (CSS / JS bundles), the <select> element is inserted into the DOM by
   * the base HTML but its visibility depends on the CSS bundle loading. Playwright's
   * default actionability check (visible + not-covered) therefore blocks forever
   * because the element is present but styled as not-visible until the bundle arrives.
   * Waiting for 'attached' + force: true bypasses the visibility check and dispatches
   * the change event directly. React's event delegation still receives the event
   * (React listens at the document level), so the sort state updates correctly.
   */
  async sortBy(option) {
    // WHY 180 s: in CI, the sort dropdown (a React-only element) appears at
    // ~122 s after navigate() — just past the old 120 s limit. 180 s provides
    // a 60 s buffer above the observed worst case without being excessively long.
    await this.sortDropdown.waitFor({ state: 'attached', timeout: 180_000 });
    await this.sortDropdown.selectOption(option, { timeout: 60_000, force: true });
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
