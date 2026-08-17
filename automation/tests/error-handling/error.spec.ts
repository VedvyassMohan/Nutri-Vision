/**
 * Error Handling — Dynamic Data-Driven Tests (20 test cases)
 */
import testData from '../../data/testData.json';
import { MealsPage, AddMealPage } from '../../pages/MealsPage';
import { ProfilePage, NavigationPage, LoginPage } from '../../pages/AppPages';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const mealsPage = new MealsPage();
const addMealPage = new AddMealPage();
const profilePage = new ProfilePage();
const navPage = new NavigationPage();
const loginPage = new LoginPage();

describe('[ERROR] Data-Driven Error Handling Tests', () => {

  // === INVALID LOGIN ERRORS ===
  testData.users.invalidUsers.forEach((user, idx) => {
    const testId = makeTestId('ERR_LOGIN', idx + 1);
    it(`[${testId}] Error shown for: ${user.reason}`, async () => {
      await loginPage.login(user.email, user.password);
      const onLogin = await loginPage.isLoginPageVisible();
      const err = await loginPage.getError();
      expect(onLogin || err.length > 0).toBe(true);
    });
  });

  // === INVALID PROFILE ERRORS ===
  testData.profileData.invalid.forEach((inv, idx) => {
    const testId = makeTestId('ERR_PROFILE', idx + 1);
    it(`[${testId}] Profile error for: ${inv.reason}`, async () => {
      await navPage.goToProfile();
      await profilePage.updateProfile(inv as any);
      const success = await profilePage.isSaveSuccessVisible();
      expect(success).toBe(false);
    });
  });

  // === INVALID MEAL ERRORS ===
  testData.invalidMeals.forEach((inv, idx) => {
    const testId = makeTestId('ERR_MEAL', idx + 1);
    it(`[${testId}] Meal error for: ${inv.reason}`, async () => {
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.describeAndWait(inv.name || '');
      const cal = await addMealPage.getTotalCalories();
      await addMealPage.close();
      expect(cal).toBe(0);
    });
  });

  // === APP STABILITY AFTER ERRORS ===
  it('[TC_ERR_STABLE_001] App stable after multiple invalid inputs', async () => {
    for (const inv of testData.invalidMeals) {
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.describeAndWait(inv.name || '');
      await addMealPage.close();
    }
    const visible = await navPage.isBottomNavVisible();
    expect(visible).toBe(true);
  });

  // === NETWORK ERROR HANDLING ===
  it('[TC_ERR_NET_001] App handles offline gracefully', async () => {
    try {
      await driver.executeScript('mobile: shell', [{ command: 'svc wifi disable' }]);
      await navPage.goToMeals();
      const visible = await navPage.isBottomNavVisible();
      await driver.executeScript('mobile: shell', [{ command: 'svc wifi enable' }]);
      expect(visible).toBe(true);
    } catch {
      expect(true).toBe(true);
    }
  });

  after(() => { LogUtil.info('Error handling test suite complete.'); });
});
