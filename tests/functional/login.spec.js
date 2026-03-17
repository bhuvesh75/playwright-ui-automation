/**
 * @file        login.spec.js
 * @description Functional tests for the Sauce Demo login page.
 *              Covers valid credentials, invalid credentials, locked accounts,
 *              and empty-field validation.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { test, expect } = require('@playwright/test');
const LoginPage     = require('../../pages/LoginPage');
const InventoryPage = require('../../pages/InventoryPage');
const validUser     = require('../../fixtures/validUser.json');
const lockedUser    = require('../../fixtures/lockedUser.json');

test.describe('Functional: Login Page', () => {

  /**
   * WHY: navigateToLogin() runs addInitScript(() => localStorage.clear()) before
   * visiting '/'. This clears the session-username key that storageState loaded
   * into the browser context, so React renders the login form instead of
   * redirecting to /inventory.html. Equivalent to Cypress's
   * cy.visit('/', { onBeforeLoad: win => win.localStorage.clear() }).
   */
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateToLogin();
  });

  /**
   * @test        Valid credentials redirect to inventory
   * @given       User is on the login page
   * @when        User enters standard_user credentials and clicks Login
   * @then        Browser navigates to /inventory.html and product list is visible
   */
  test('should log in successfully with valid credentials', async ({ page }) => {
    const loginPage     = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.login(validUser.username, validUser.password);

    await inventoryPage.assertOnInventoryPage();
    await expect(inventoryPage.productList).toBeVisible();
  });

  /**
   * @test        Invalid password shows error message
   * @given       User is on the login page
   * @when        User enters a valid username but wrong password
   * @then        Error message indicating credential mismatch is displayed
   */
  test('should show error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login('standard_user', 'wrong_password');

    await loginPage.assertErrorContains('Username and password do not match');
  });

  /**
   * @test        Locked account is denied access
   * @given       User is on the login page
   * @when        User enters locked_out_user credentials
   * @then        Error message indicates the account is locked out
   */
  test('should deny access for locked_out_user', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login(lockedUser.username, lockedUser.password);

    await loginPage.assertErrorContains('locked out');
  });

  /**
   * @test        Empty username shows validation error
   * @given       User is on the login page
   * @when        User submits with no username entered
   * @then        "Username is required" error is displayed
   */
  test('should require the username field', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.enterPassword('secret_sauce');
    await loginPage.clickLogin();

    await loginPage.assertErrorContains('Username is required');
  });

  /**
   * @test        Empty password shows validation error
   * @given       User is on the login page
   * @when        User submits with no password entered
   * @then        "Password is required" error is displayed
   */
  test('should require the password field', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.enterUsername('standard_user');
    await loginPage.clickLogin();

    await loginPage.assertErrorContains('Password is required');
  });
});
