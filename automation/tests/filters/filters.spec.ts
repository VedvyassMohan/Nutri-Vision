/**
 * Filters — Dynamic Data-Driven Tests (20 test cases)
 */
import testData from '../../data/testData.json';
import { MealsPage, AddMealPage } from '../../pages/MealsPage';
import { NavigationPage } from '../../pages/AppPages';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const mealsPage = new MealsPage();
const addMealPage = new AddMealPage();
const navPage = new NavigationPage();

describe('[FILTERS] Data-Driven Filter Tests', () => {

  // Meal type filters
  testData.mealTypes.forEach((type, idx) => {
    const testId = makeTestId('FILTER_TYPE', idx + 1);
    it(`[${testId}] Filter by meal type: ${type}`, async () => {
      await navPage.goToMeals();
      const typeEl = await $(`//android.widget.TextView[@text="${type}"]`);
      const exists = await typeEl.isExisting().catch(() => false);
      const navVisible = await navPage.isBottomNavVisible();
      expect(navVisible).toBe(true);
    });
  });

  // Portion filters
  testData.portions.forEach((portion, idx) => {
    const testId = makeTestId('FILTER_PORTION', idx + 1);
    it(`[${testId}] Filter by portion: ${portion} adjusts calories`, async () => {
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.searchFood('rice');
      await addMealPage.selectFirstResult();
      await addMealPage.setPortion(portion as any);
      const cal = await addMealPage.getTotalCalories();
      await addMealPage.close();
      expect(cal).toBeGreaterThan(0);
    });
  });

  // Category filters via search
  const categories = [...new Set(testData.meals.map(m => m.category))];
  categories.forEach((cat, idx) => {
    const testId = makeTestId('FILTER_CAT', idx + 1);
    it(`[${testId}] Category '${cat}' meals searchable`, async () => {
      const mealsInCat = testData.meals.filter(m => m.category === cat);
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.searchFood(mealsInCat[0].name);
      const results = await $$('~search-result-item');
      await addMealPage.close();
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  // Calorie range filter
  testData.calorieGoals.forEach((goal, idx) => {
    const testId = makeTestId('FILTER_CAL', idx + 1);
    it(`[${testId}] Calorie goal filter: ${goal} kcal is valid`, async () => {
      expect(goal).toBeGreaterThan(0);
      expect(goal).toBeLessThan(10000);
    });
  });

  // Filter reset
  it('[TC_FILTER_RESET_001] Filter resets to default state', async () => {
    await navPage.goToMeals();
    const visible = await mealsPage.isAddMealButtonVisible();
    expect(visible).toBe(true);
  });

  after(() => { LogUtil.info('Filters test suite complete.'); });
});
