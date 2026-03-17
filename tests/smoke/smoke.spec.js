/**
 * @file        smoke.spec.js
 * @description Quick sanity checks confirming the Sauce Demo application is
 *              reachable and its critical happy path (login → inventory) works.
 *              Designed to run fast and catch catastrophic failures before the
 *              full functional and regression suites execute.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { test, expect } = require('../../support/fixtures');
const LoginPage    = require('../../pages/LoginPage');
const InventoryPage = require('../../pages/InventoryPage');
const validUser    = require('../../fixtures/validUser.json');
const products     = require('../../fixtures/products.json');

test.describe('Smoke: Application Sanity Checks', () => {

  /**
   * @test        Login page renders with all form elements
   * @given       The application is deployed and accessible
   * @when        User navigates to the base URL (no prior auth)
   * @then        Username field, password field, and login button are all visible
   */
  test('should render the login page with all form elements', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // navigateToLogin clears localStorage before visiting '/' so React renders
    // the login form instead of redirecting to the inventory page
    await loginPage.navigateToLogin();
    await loginPage.assertLoginPageVisible();
  });

  /**
   * @test        Valid login navigates to the inventory page
   * @given       The application is deployed and accessible
   * @when        User enters valid standard_user credentials and clicks Login
   * @then        Browser navigates to /inventory.html and the product list is visible
   */
  test('should navigate to inventory page after successful login', async ({ page }) => {
    const loginPage     = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.navigateToLogin();
    await loginPage.login(validUser.username, validUser.password);

    await inventoryPage.assertOnInventoryPage();
    await expect(inventoryPage.productList).toBeVisible();
  });

  /**
   * @test        Inventory shows the correct number of products
   * @given       User is logged in and on the inventory page
   * @when        The page finishes loading
   * @then        Exactly 6 product items are displayed
   */
  test('should display the correct number of products on the inventory page', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    // storageState from globalSetup has session-username set; navigating directly
    // to /inventory.html skips the login form — no extra CDN hit needed
    await inventoryPage.navigate();

    const count = await inventoryPage.getProductCount();
    expect(count).toBe(products.expectedCount);
  });

  /**
   * @test        Cart icon is accessible from the inventory page
   * @given       User is logged in and on the inventory page
   * @when        The page has loaded
   * @then        The shopping cart link is visible in the header
   */
  test('should display the shopping cart icon on the inventory page', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.navigate();

    await expect(inventoryPage.cartLink).toBeVisible();
  });
});
