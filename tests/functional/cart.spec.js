/**
 * @file        cart.spec.js
 * @description Functional tests for the Sauce Demo shopping cart.
 *              Validates adding items, removing items, badge count updates,
 *              and Continue Shopping navigation.
 * @author      Bhuvesh Yadav
 * @github      https://github.com/bhuvesh75
 */

const { test, expect } = require('@playwright/test');
const InventoryPage = require('../../pages/InventoryPage');
const CartPage      = require('../../pages/CartPage');

test.describe('Functional: Shopping Cart', () => {

  test.beforeEach(async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.navigate();
    await inventoryPage.assertOnInventoryPage();
  });

  /**
   * @test        Adding two items increments the badge to "2"
   * @given       User is on the inventory page with an empty cart
   * @when        User adds "Sauce Labs Backpack" and "Sauce Labs Bike Light"
   * @then        Cart badge displays "2"
   */
  test('should show badge count of 2 after adding two items', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.addProductToCart('Sauce Labs Bike Light');

    const badge = await inventoryPage.getCartBadgeCount();
    expect(badge).toBe('2');
  });

  /**
   * @test        Removing one of two items decrements the badge to "1"
   * @given       User has 2 items in the cart
   * @when        User removes "Sauce Labs Backpack"
   * @then        Cart badge displays "1"
   */
  test('should update badge to 1 after removing one of two items', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.addProductToCart('Sauce Labs Bike Light');

    expect(await inventoryPage.getCartBadgeCount()).toBe('2');

    await inventoryPage.removeProductFromCart('Sauce Labs Backpack');

    expect(await inventoryPage.getCartBadgeCount()).toBe('1');
  });

  /**
   * @test        Removing the last item hides the cart badge
   * @given       User has 1 item in the cart
   * @when        User removes the only item
   * @then        Cart badge is no longer visible in the DOM
   */
  test('should hide cart badge after removing all items', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    expect(await inventoryPage.getCartBadgeCount()).toBe('1');

    await inventoryPage.removeProductFromCart('Sauce Labs Backpack');

    await expect(inventoryPage.cartBadge).not.toBeVisible();
  });

  /**
   * @test        Added items appear on the cart page
   * @given       User has added an item on the inventory page
   * @when        User navigates to the cart page
   * @then        The added item is visible in the cart
   */
  test('should display added items on the cart page', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage      = new CartPage(page);

    await inventoryPage.addProductToCart('Sauce Labs Bike Light');
    await inventoryPage.goToCart();

    await cartPage.assertOnCartPage();
    await cartPage.assertItemVisible('Sauce Labs Bike Light');
  });

  /**
   * @test        Continue Shopping returns to the inventory page
   * @given       User is on the cart page
   * @when        User clicks Continue Shopping
   * @then        Browser navigates back to /inventory.html
   */
  test('should navigate back to inventory via Continue Shopping', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage      = new CartPage(page);

    await inventoryPage.goToCart();
    await cartPage.assertOnCartPage();
    await cartPage.clickContinueShopping();
    await inventoryPage.assertOnInventoryPage();
  });
});
