/**
 * Navigation — Dynamic Data-Driven Tests
 */
import testData from '../../data/testData.json';
import { NavigationPage, HomePage } from '../../pages/AppPages';
import { MealsPage } from '../../pages/MealsPage';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const navPage = new NavigationPage();
const homePage = new HomePage();
const mealsPage = new MealsPage();

const TABS = ['home', 'meals', 'profile'] as const;

describe('[NAV] Data-Driven Navigation Tests', () => {

  // === TAB NAVIGATION — all tab permutations ===
  const tabPairs: [string, string][] = [];
  for (const from of TABS) {
    for (const to of TABS) {
      if (from !== to) tabPairs.push([from, to]);
    }
  }

  tabPairs.forEach(([from, to], idx) => {
    const testId = makeTestId('NAV_TAB', idx + 1);
    it(`[${testId}] Navigate from ${from} → ${to}`, async () => {
      // Navigate to source
      if (from === 'home') await navPage.goToHome();
      else if (from === 'meals') await navPage.goToMeals();
      else await navPage.goToProfile();

      // Navigate to target
      if (to === 'home') await navPage.goToHome();
      else if (to === 'meals') await navPage.goToMeals();
      else await navPage.goToProfile();

      const visible = await navPage.isBottomNavVisible();
      expect(visible).toBe(true);
    });
  });

  // === BACK NAVIGATION ===
  it('[TC_NAV_BACK_001] Back button from Add Meal modal closes without crash', async () => {
    await navPage.goToMeals();
    await mealsPage.openAddMeal();
    await (new (require('../../pages/MealsPage').AddMealPage)()).close();
    const mealsVisible = await mealsPage.isDisplayed('~add-meal-fab');
    expect(mealsVisible).toBe(true);
  });

  // === BOTTOM NAV VISIBILITY ===
  TABS.forEach((tab, idx) => {
    const testId = makeTestId('NAV_VIS', idx + 1);
    it(`[${testId}] Bottom nav visible on tab: ${tab}`, async () => {
      if (tab === 'home') await navPage.goToHome();
      else if (tab === 'meals') await navPage.goToMeals();
      else await navPage.goToProfile();
      const visible = await navPage.isBottomNavVisible();
      expect(visible).toBe(true);
    });
  });

  // === RAPID TAB SWITCHING ===
  it('[TC_NAV_RAPID_001] Rapid tab switching does not crash app', async () => {
    for (let i = 0; i < 5; i++) {
      await navPage.goToHome();
      await navPage.goToMeals();
      await navPage.goToProfile();
    }
    const visible = await navPage.isBottomNavVisible();
    expect(visible).toBe(true);
  });

  after(() => {
    LogUtil.info('Navigation test suite complete.');
  });
});
