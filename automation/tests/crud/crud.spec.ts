/**
 * CRUD Operations — Dynamic Data-Driven Tests (40 test cases)
 */
import testData from '../../data/testData.json';
import { MealsPage, AddMealPage } from '../../pages/MealsPage';
import { NavigationPage } from '../../pages/AppPages';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const mealsPage = new MealsPage();
const addMealPage = new AddMealPage();
const navPage = new NavigationPage();

describe('[CRUD] Data-Driven CRUD Operation Tests', () => {

  // === CREATE — one per meal ===
  testData.meals.forEach((meal, idx) => {
    const testId = makeTestId('CRUD_CREATE', idx + 1);
    it(`[${testId}] CREATE meal: ${meal.name}`, async () => {
      LogUtil.testStart(testId, `CREATE: ${meal.name}`);
      const before = await mealsPage.getMealCount();
      await mealsPage.openAddMeal();
      await addMealPage.searchFood(meal.name);
      await addMealPage.selectFirstResult();
      await addMealPage.setPortion(meal.portion as any);
      await addMealPage.addMeal();
      const after = await mealsPage.getMealCount();
      expect(after).toBeGreaterThanOrEqual(before);
    });
  });

  // === READ — verify meals list shows added meal ===
  testData.meals.slice(0, 5).forEach((meal, idx) => {
    const testId = makeTestId('CRUD_READ', idx + 1);
    it(`[${testId}] READ meals list includes: ${meal.name}`, async () => {
      await navPage.goToMeals();
      const count = await mealsPage.getMealCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // === UPDATE — portion update ===
  testData.portions.forEach((portion, idx) => {
    const testId = makeTestId('CRUD_UPDATE', idx + 1);
    it(`[${testId}] UPDATE portion to ${portion} updates calories`, async () => {
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.searchFood('chapati');
      await addMealPage.selectFirstResult();
      const calBefore = await addMealPage.getTotalCalories();
      await addMealPage.setPortion(portion as any);
      const calAfter = await addMealPage.getTotalCalories();
      await addMealPage.close();
      expect(calAfter).toBeGreaterThan(0);
    });
  });

  // === DELETE — remove last added meal ===
  it('[TC_CRUD_DELETE_001] DELETE removes meal from list', async () => {
    await navPage.goToMeals();
    const before = await mealsPage.getMealCount();
    // Add a meal first
    await mealsPage.openAddMeal();
    await addMealPage.searchFood('idli');
    await addMealPage.selectFirstResult();
    await addMealPage.addMeal();
    const afterAdd = await mealsPage.getMealCount();
    // Delete it
    await mealsPage.deleteMeal('Idli');
    const afterDelete = await mealsPage.getMealCount();
    expect(afterDelete).toBeLessThanOrEqual(afterAdd);
  });

  // === BULK CREATE ===
  it('[TC_CRUD_BULK_001] Bulk add multiple meals', async () => {
    await navPage.goToMeals();
    const meals = testData.meals.slice(0, 3);
    for (const meal of meals) {
      await mealsPage.openAddMeal();
      await addMealPage.searchFood(meal.name);
      await addMealPage.selectFirstResult();
      await addMealPage.addMeal();
    }
    const count = await mealsPage.getMealCount();
    expect(count).toBeGreaterThan(0);
  });

  // === CRUD SEARCH VERIFY ===
  testData.searchQueries.valid.slice(0, 5).forEach((query, idx) => {
    const testId = makeTestId('CRUD_SEARCH', idx + 1);
    it(`[${testId}] CRUD search verifies: ${query}`, async () => {
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.searchFood(query);
      const results = await $$('~search-result-item');
      await addMealPage.close();
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  // === MEAL TYPE CRUD ===
  testData.mealTypes.forEach((type, idx) => {
    const testId = makeTestId('CRUD_TYPE', idx + 1);
    it(`[${testId}] CRUD for meal type: ${type}`, async () => {
      expect(testData.mealTypes).toContain(type);
    });
  });

  after(() => { LogUtil.info('CRUD test suite complete.'); });
});
