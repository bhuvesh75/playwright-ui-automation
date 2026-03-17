/**
 * @file        checkout.spec.js
 * @description Functional tests for the Sauce Demo checkout flow.
 *              Covers the full happy path (step 1 → step 2 → confirmation),
 *              and validation errors for missing required shipping fields.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { test, expect } = require('../../support/fixtures');
const InventoryPage = require('../../pages/InventoryPage');
const CartPage      = require('../../pages/CartPage');
const CheckoutPage  = require('../../pages/CheckoutPage');

test.describe('Functional: Checkout Flow', () => {

  test.beforeEach(async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.navigate();
    await inventoryPage.assertOnInventoryPage();
    // Add one item so the cart is never empty when entering checkout
    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.goToCart();
  });

  /**
   * @test        Full happy-path checkout completes successfully
   * @given       User has an item in the cart and is on the cart page
   * @when        User proceeds through checkout step 1, fills valid shipping info,
   *              continues to step 2, and clicks Finish
   * @then        Order confirmation page is displayed with thank-you message
   */
  test('should complete checkout successfully with valid details', async ({ page }) => {
    const cartPage     = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.assertOnCartPage();
    await cartPage.clickCheckout();

    await checkoutPage.assertOnStepOne();
    await checkoutPage.fillShippingInfo('Test', 'User', '12345');
    await checkoutPage.clickContinue();

    await checkoutPage.assertOnStepTwo();
    await checkoutPage.clickFinish();

    await checkoutPage.assertOnConfirmation();
    const msg = await checkoutPage.getThankYouMessage();
    expect(msg).toContain('Thank you for your order');
  });

  /**
   * @test        Missing first name shows validation error
   * @given       User is on checkout step 1
   * @when        User submits without entering a first name
   * @then        Validation error mentioning "First Name" is displayed
   */
  test('should show error when first name is missing', async ({ page }) => {
    const cartPage     = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.clickCheckout();
    await checkoutPage.assertOnStepOne();

    // Last name and postal code filled — only first name omitted
    await checkoutPage.fillShippingInfo('', 'User', '12345');
    await checkoutPage.clickContinue();

    await checkoutPage.assertErrorContains('First Name');
  });

  /**
   * @test        Missing last name shows validation error
   * @given       User is on checkout step 1
   * @when        User submits without entering a last name
   * @then        Validation error mentioning "Last Name" is displayed
   */
  test('should show error when last name is missing', async ({ page }) => {
    const cartPage     = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.clickCheckout();
    await checkoutPage.assertOnStepOne();

    await checkoutPage.fillShippingInfo('Test', '', '12345');
    await checkoutPage.clickContinue();

    await checkoutPage.assertErrorContains('Last Name');
  });

  /**
   * @test        Missing postal code shows validation error
   * @given       User is on checkout step 1
   * @when        User submits without entering a postal code
   * @then        Validation error mentioning "Postal Code" is displayed
   */
  test('should show error when postal code is missing', async ({ page }) => {
    const cartPage     = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.clickCheckout();
    await checkoutPage.assertOnStepOne();

    await checkoutPage.fillShippingInfo('Test', 'User', '');
    await checkoutPage.clickContinue();

    await checkoutPage.assertErrorContains('Postal Code');
  });

  /**
   * @test        Order total is visible on the checkout overview page
   * @given       User has an item in the cart and navigates to step 2
   * @when        The overview page renders
   * @then        A total price string containing "$" is displayed
   */
  test('should display order total on checkout overview', async ({ page }) => {
    const cartPage     = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.clickCheckout();
    await checkoutPage.fillShippingInfo('Test', 'User', '12345');
    await checkoutPage.clickContinue();

    await checkoutPage.assertOnStepTwo();
    const total = await checkoutPage.getOrderTotal();
    expect(total).toContain('$');
  });
});
