/**
 * @file        fullRegression.spec.js
 * @description Full regression suite for the Sauce Demo application.
 *              Exercises every major user-facing workflow in a single file so
 *              the entire application can be validated in one run.
 *              Individual concerns are covered in depth by the focused functional
 *              specs; this suite verifies that all major flows remain intact
 *              when the application is updated.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { test, expect } = require('../../support/fixtures');
const LoginPage     = require('../../pages/LoginPage');
const InventoryPage = require('../../pages/InventoryPage');
const CartPage      = require('../../pages/CartPage');
const CheckoutPage  = require('../../pages/CheckoutPage');
const validUser     = require('../../fixtures/validUser.json');
const lockedUser    = require('../../fixtures/lockedUser.json');
const products      = require('../../fixtures/products.json');

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Regression: Authentication', () => {

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateToLogin();
  });

  test('valid credentials navigate to inventory', async ({ page }) => {
    const loginPage     = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.login(validUser.username, validUser.password);
    await inventoryPage.assertOnInventoryPage();
    await expect(inventoryPage.productList).toBeVisible();
  });

  test('invalid password shows credential mismatch error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(validUser.username, 'wrong_password');
    await loginPage.assertErrorContains('Username and password do not match');
  });

  test('locked account is denied access', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(lockedUser.username, lockedUser.password);
    await loginPage.assertErrorContains('locked out');
  });

  test('empty username shows required-field error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.enterPassword(validUser.password);
    await loginPage.clickLogin();
    await loginPage.assertErrorContains('Username is required');
  });

  test('empty password shows required-field error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.enterUsername(validUser.username);
    await loginPage.clickLogin();
    await loginPage.assertErrorContains('Password is required');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY / PRODUCTS
// WHY: Shared page via beforeAll — see products.spec.js for the full rationale.
// Short version: 7 beforeEach navigations to /inventory.html trigger CDN
// rate-limiting from GitHub Actions IPs. One shared navigation avoids this.
// ─────────────────────────────────────────────────────────────────────────────

let regInvPage;
let regInvSharedPage;

test.describe('Regression: Product Inventory', () => {

  test.beforeAll(async ({ workerContext }) => {
    regInvSharedPage = await workerContext.newPage();
    regInvPage       = new InventoryPage(regInvSharedPage);
    await regInvPage.navigate();
    await regInvPage.assertOnInventoryPage();
  });

  test.afterAll(async () => {
    await regInvSharedPage?.close();
  });

  test('displays all 6 products', async () => {
    const count = await regInvPage.getProductCount();
    expect(count).toBe(products.expectedCount);
  });

  test('all expected product names are present', async () => {
    for (const name of products.items) {
      await expect(
        regInvSharedPage.locator('.inventory_item_name', { hasText: name })
      ).toBeVisible();
    }
  });

  test('sort A to Z puts Sauce Labs Backpack first', async () => {
    await regInvPage.sortBy('az');
    const first = await regInvPage.getFirstProductName();
    expect(first?.trim()).toBe(products.firstAlphabetically);
  });

  test('sort Z to A puts Test.allTheThings() T-Shirt first', async () => {
    await regInvPage.sortBy('za');
    const first = await regInvPage.getFirstProductName();
    expect(first?.trim()).toBe(products.lastAlphabetically);
  });

  test('sort price low to high puts cheapest item first', async () => {
    await regInvPage.sortBy('lohi');
    const first = await regInvPage.getFirstProductName();
    expect(first?.trim()).toBe(products.cheapest);
  });

  test('sort price high to low puts most expensive item first', async () => {
    await regInvPage.sortBy('hilo');
    const first = await regInvPage.getFirstProductName();
    expect(first?.trim()).toBe(products.mostExpensive);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SHOPPING CART
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Regression: Shopping Cart', () => {

  test.beforeEach(async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.navigate();
    await inventoryPage.assertOnInventoryPage();
  });

  test('cart badge increments correctly when items are added', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    expect(await inventoryPage.getCartBadgeCount()).toBe('1');

    await inventoryPage.addProductToCart('Sauce Labs Bike Light');
    expect(await inventoryPage.getCartBadgeCount()).toBe('2');
  });

  test('removing one item decrements badge by one', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.addProductToCart('Sauce Labs Bike Light');
    await inventoryPage.removeProductFromCart('Sauce Labs Backpack');

    expect(await inventoryPage.getCartBadgeCount()).toBe('1');
  });

  test('removing all items hides the badge', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.removeProductFromCart('Sauce Labs Backpack');

    await expect(inventoryPage.cartBadge).not.toBeVisible();
  });

  test('added items appear on the cart page', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage      = new CartPage(page);

    await inventoryPage.addProductToCart('Sauce Labs Bike Light');
    await inventoryPage.goToCart();

    await cartPage.assertOnCartPage();
    await cartPage.assertItemVisible('Sauce Labs Bike Light');
  });

  test('Continue Shopping returns to inventory', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage      = new CartPage(page);

    await inventoryPage.goToCart();
    await cartPage.assertOnCartPage();
    await cartPage.clickContinueShopping();
    await inventoryPage.assertOnInventoryPage();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Regression: Checkout Flow', () => {

  test.beforeEach(async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.navigate();
    await inventoryPage.assertOnInventoryPage();
    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.goToCart();
  });

  test('full checkout happy path ends on confirmation page', async ({ page }) => {
    const cartPage     = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.assertOnCartPage();
    await cartPage.clickCheckout();

    await checkoutPage.assertOnStepOne();
    await checkoutPage.fillShippingInfo('Regression', 'Test', '90210');
    await checkoutPage.clickContinue();

    await checkoutPage.assertOnStepTwo();
    await checkoutPage.clickFinish();

    await checkoutPage.assertOnConfirmation();
    const msg = await checkoutPage.getThankYouMessage();
    expect(msg).toContain('Thank you for your order');
  });

  test('missing first name blocks progression to step 2', async ({ page }) => {
    const cartPage     = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.clickCheckout();
    await checkoutPage.fillShippingInfo('', 'Test', '90210');
    await checkoutPage.clickContinue();
    await checkoutPage.assertErrorContains('First Name');
  });

  test('order total is shown on overview step', async ({ page }) => {
    const cartPage     = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.clickCheckout();
    await checkoutPage.fillShippingInfo('Regression', 'Test', '90210');
    await checkoutPage.clickContinue();

    await checkoutPage.assertOnStepTwo();
    const total = await checkoutPage.getOrderTotal();
    expect(total).toContain('$');
  });
});
