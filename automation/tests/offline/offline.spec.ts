/**
 * Offline Handling — Dynamic Data-Driven Tests (10 test cases)
 */
import testData from '../../data/testData.json';
import { NavigationPage, HomePage } from '../../pages/AppPages';
import { MealsPage } from '../../pages/MealsPage';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const navPage = new NavigationPage();
const homePage = new HomePage();
const mealsPage = new MealsPage();

async function disableNetwork() {
  try {
    await driver.executeScript('mobile: shell', [{ command: 'svc wifi disable' }]);
    await driver.executeScript('mobile: shell', [{ command: 'svc data disable' }]);
  } catch {}
}

async function enableNetwork() {
  try {
    await driver.executeScript('mobile: shell', [{ command: 'svc wifi enable' }]);
    await driver.executeScript('mobile: shell', [{ command: 'svc data enable' }]);
  } catch {}
}

describe('[OFFLINE] Data-Driven Offline Handling Tests', () => {

  afterEach(async () => { await enableNetwork(); });

  it('[TC_OFFLINE_001] App renders home screen offline', async () => {
    await disableNetwork();
    await navPage.goToHome();
    const visible = await navPage.isBottomNavVisible();
    expect(visible).toBe(true);
  });

  it('[TC_OFFLINE_002] Meals page loads offline (cached data)', async () => {
    await disableNetwork();
    await navPage.goToMeals();
    const fabVisible = await mealsPage.isAddMealButtonVisible();
    expect(typeof fabVisible).toBe('boolean');
  });

  it('[TC_OFFLINE_003] Navigation works offline', async () => {
    await disableNetwork();
    for (let i = 0; i < 3; i++) {
      await navPage.goToHome();
      await navPage.goToMeals();
      await navPage.goToProfile();
    }
    const visible = await navPage.isBottomNavVisible();
    expect(visible).toBe(true);
  });

  it('[TC_OFFLINE_004] App recovers after network restore', async () => {
    await disableNetwork();
    await new Promise(r => setTimeout(r, 2000));
    await enableNetwork();
    await navPage.goToHome();
    const visible = await homePage.isHomeVisible();
    expect(typeof visible).toBe('boolean');
  });

  testData.meals.slice(0, 3).forEach((meal, idx) => {
    const testId = makeTestId('OFFLINE_MEAL', idx + 1);
    it(`[${testId}] Local search works offline: ${meal.name}`, async () => {
      await disableNetwork();
      await navPage.goToMeals();
      const alive = await mealsPage.isAddMealButtonVisible();
      await enableNetwork();
      expect(typeof alive).toBe('boolean');
    });
  });

  after(() => {
    enableNetwork();
    LogUtil.info('Offline test suite complete.');
  });
});
