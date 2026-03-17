/**
 * @file        products.spec.js
 * @description Functional tests for the Sauce Demo product inventory page.
 *              Validates product count, sort options, and product name display.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { test, expect } = require('../../support/fixtures');
const InventoryPage = require('../../pages/InventoryPage');
const products      = require('../../fixtures/products.json');

test.describe('Functional: Product Inventory', () => {

  test.beforeEach(async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    // storageState has session-username set; direct navigation skips login
    await inventoryPage.navigate();
  });

  /**
   * @test        All 6 products are rendered
   * @given       User is logged in and on the inventory page
   * @when        The page finishes loading
   * @then        Exactly 6 product items are visible
   */
  test('should display all 6 products', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const count = await inventoryPage.getProductCount();
    expect(count).toBe(products.expectedCount);
  });

  /**
   * @test        Sort A to Z — "Sauce Labs Backpack" is first
   * @given       User is on the inventory page
   * @when        User selects "Name (A to Z)" sort option
   * @then        First product is "Sauce Labs Backpack"
   */
  test('should sort products A to Z', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortBy('az');
    const first = await inventoryPage.getFirstProductName();
    expect(first?.trim()).toBe(products.firstAlphabetically);
  });

  /**
   * @test        Sort Z to A — "Test.allTheThings() T-Shirt (Red)" is first
   * @given       User is on the inventory page
   * @when        User selects "Name (Z to A)" sort option
   * @then        First product is "Test.allTheThings() T-Shirt (Red)"
   */
  test('should sort products Z to A', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortBy('za');
    const first = await inventoryPage.getFirstProductName();
    expect(first?.trim()).toBe(products.lastAlphabetically);
  });

  /**
   * @test        Sort price low to high — "Sauce Labs Onesie" is first
   * @given       User is on the inventory page
   * @when        User selects "Price (low to high)" sort option
   * @then        First product is the cheapest item
   */
  test('should sort products by price low to high', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortBy('lohi');
    const first = await inventoryPage.getFirstProductName();
    expect(first?.trim()).toBe(products.cheapest);
  });

  /**
   * @test        Sort price high to low — "Sauce Labs Fleece Jacket" is first
   * @given       User is on the inventory page
   * @when        User selects "Price (high to low)" sort option
   * @then        First product is the most expensive item
   */
  test('should sort products by price high to low', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortBy('hilo');
    const first = await inventoryPage.getFirstProductName();
    expect(first?.trim()).toBe(products.mostExpensive);
  });

  /**
   * @test        All expected product names are present
   * @given       User is on the inventory page
   * @when        The page renders all products
   * @then        Every product name from the fixture is visible on the page
   */
  test('should display all expected product names', async ({ page }) => {
    for (const name of products.items) {
      await expect(
        page.locator('.inventory_item_name', { hasText: name })
      ).toBeVisible();
    }
  });
});
