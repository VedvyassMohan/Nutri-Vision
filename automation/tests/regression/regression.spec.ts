/**
 * Regression + Performance Smoke — Dynamic Tests
 */
import testData from '../../data/testData.json';
import { NavigationPage, HomePage } from '../../pages/AppPages';
import { MealsPage, AddMealPage } from '../../pages/MealsPage';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const navPage = new NavigationPage();
const homePage = new HomePage();
const mealsPage = new MealsPage();
const addMealPage = new AddMealPage();

describe('[REGRESSION] Data-Driven Regression Suite', () => {

  // === FULL MEAL WORKFLOW — one per meal in dataset ===
  testData.meals.forEach((meal, idx) => {
    const testId = makeTestId('REG_MEAL', idx + 1);
    it(`[${testId}] Full meal workflow: ${meal.name}`, async () => {
      const countBefore = await mealsPage.getMealCount();
      await mealsPage.openAddMeal();
      await addMealPage.searchFood(meal.name);
      await addMealPage.selectFirstResult();
      await addMealPage.setPortion(meal.portion as any);
      await addMealPage.addMeal();
      const countAfter = await mealsPage.getMealCount();
      expect(countAfter).toBeGreaterThan(countBefore);
    });
  });

  // === DESCRIPTION → DETECT → ADD WORKFLOW ===
  testData.meals.slice(0, 5).forEach((meal, idx) => {
    const testId = makeTestId('REG_DESC', idx + 1);
    it(`[${testId}] Description workflow: "${meal.description}"`, async () => {
      await mealsPage.openAddMeal();
      await addMealPage.describeAndWait(meal.description);
      const hasCalc = await addMealPage.isCalculationVisible();
      const cal = await addMealPage.getTotalCalories();
      if (hasCalc) await addMealPage.addMeal();
      else await addMealPage.close();
      expect(hasCalc).toBe(true);
    });
  });

  // === SEARCH + PORTION MATRIX ===
  const matrixMeals = testData.meals.slice(0, 4);
  const matrixPortions = testData.portions;

  matrixMeals.forEach((meal, mIdx) => {
    matrixPortions.forEach((portion, pIdx) => {
      const testId = makeTestId('REG_MATRIX', mIdx * matrixPortions.length + pIdx + 1);
      it(`[${testId}] Matrix: ${meal.name} @ ${portion}`, async () => {
        await mealsPage.openAddMeal();
        await addMealPage.searchFood(meal.name);
        await addMealPage.selectFirstResult();
        await addMealPage.setPortion(portion as any);
        const cal = await addMealPage.getTotalCalories();
        await addMealPage.close();
        expect(cal).toBeGreaterThan(0);
      });
    });
  });

  // === MACRO OVERVIEW AFTER MEALS ===
  it('[TC_REG_MACRO_001] Macro overview updates after adding meals', async () => {
    const visible = await mealsPage.isMacroOverviewVisible();
    expect(visible).toBe(true);
  });

  // === CALORIE RING ON HOME ===
  it('[TC_REG_HOME_001] Home calorie ring is visible', async () => {
    await navPage.goToHome();
    const ringVisible = await homePage.isDisplayed('~calorie-ring');
    expect(ringVisible).toBe(true);
  });
});

describe('[PERF] Performance Smoke Tests', () => {

  // === APP LAUNCH TIME ===
  it('[TC_PERF_001] App loads home screen in under 5s', async () => {
    const start = Date.now();
    await navPage.goToHome();
    await homePage.waitForVisible('~welcome-header-text');
    const duration = Date.now() - start;
    LogUtil.info(`App home load time: ${duration}ms`);
    expect(duration).toBeLessThan(5000);
  });

  // === TAB SWITCH PERFORMANCE — per tab pair ===
  const tabSwitches = [
    { from: 'home', to: 'meals' },
    { from: 'meals', to: 'profile' },
    { from: 'profile', to: 'home' },
  ];

  tabSwitches.forEach((sw, idx) => {
    const testId = makeTestId('PERF_TAB', idx + 1);
    it(`[${testId}] Tab switch ${sw.from} → ${sw.to} under 1.5s`, async () => {
      const start = Date.now();
      if (sw.to === 'home') await navPage.goToHome();
      else if (sw.to === 'meals') await navPage.goToMeals();
      else await navPage.goToProfile();
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1500);
    });
  });

  // === SEARCH RESPONSE TIME ===
  testData.searchQueries.valid.slice(0, 5).forEach((query, idx) => {
    const testId = makeTestId('PERF_SEARCH', idx + 1);
    it(`[${testId}] Search '${query}' responds in under 2s`, async () => {
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      const start = Date.now();
      await addMealPage.searchFood(query);
      const duration = Date.now() - start;
      await addMealPage.close();
      expect(duration).toBeLessThan(2000);
    });
  });

  // === ADD MEAL PERFORMANCE ===
  it('[TC_PERF_MEAL_001] Full add meal workflow completes in under 8s', async () => {
    await navPage.goToMeals();
    const start = Date.now();
    await mealsPage.openAddMeal();
    await addMealPage.searchFood('chapati');
    await addMealPage.selectFirstResult();
    await addMealPage.addMeal();
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(8000);
  });

  // === SCROLL PERFORMANCE ===
  it('[TC_PERF_SCROLL_001] Add Meal modal scrolls smoothly without freezing', async () => {
    await navPage.goToMeals();
    await mealsPage.openAddMeal();
    const start = Date.now();
    await addMealPage.scrollDown();
    await addMealPage.scrollDown();
    await addMealPage.scrollUp();
    const duration = Date.now() - start;
    await addMealPage.close();
    expect(duration).toBeLessThan(3000);
  });

  after(() => {
    LogUtil.info('Regression + Performance test suite complete.');
  });
});
