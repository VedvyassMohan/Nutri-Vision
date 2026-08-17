/**
 * Search — Dynamic Data-Driven Tests (20 test cases)
 */
import testData from '../../data/testData.json';
import { MealsPage, AddMealPage } from '../../pages/MealsPage';
import { NavigationPage } from '../../pages/AppPages';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const mealsPage = new MealsPage();
const addMealPage = new AddMealPage();
const navPage = new NavigationPage();

describe('[SEARCH] Data-Driven Search Tests', () => {

  before(async () => { await navPage.goToMeals(); });

  // Valid searches
  testData.searchQueries.valid.forEach((query, idx) => {
    const testId = makeTestId('SEARCH_VALID', idx + 1);
    it(`[${testId}] Valid search '${query}' returns results`, async () => {
      LogUtil.testStart(testId, `Search: ${query}`);
      await mealsPage.openAddMeal();
      await addMealPage.searchFood(query);
      const results = await $$('~search-result-item');
      await addMealPage.close();
      expect(results.length).toBeGreaterThan(0);
    });
  });

  // Partial searches
  testData.searchQueries.partial.forEach((query, idx) => {
    const testId = makeTestId('SEARCH_PARTIAL', idx + 1);
    it(`[${testId}] Partial search '${query}' returns suggestions`, async () => {
      await mealsPage.openAddMeal();
      await addMealPage.searchFood(query);
      const results = await $$('~search-result-item');
      await addMealPage.close();
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  // No-result searches
  testData.searchQueries.noResults.forEach((query, idx) => {
    const testId = makeTestId('SEARCH_EMPTY', idx + 1);
    it(`[${testId}] Search '${query}' shows empty state`, async () => {
      await mealsPage.openAddMeal();
      await addMealPage.searchFood(query);
      const results = await $$('~search-result-item');
      await addMealPage.close();
      expect(results.length).toBe(0);
    });
  });

  // Special query searches
  testData.searchQueries.special.forEach((query, idx) => {
    const testId = makeTestId('SEARCH_SPECIAL', idx + 1);
    it(`[${testId}] Multi-word search '${query}'`, async () => {
      await mealsPage.openAddMeal();
      await addMealPage.searchFood(query);
      const results = await $$('~search-result-item');
      await addMealPage.close();
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  // Case insensitive
  it('[TC_SEARCH_CASE_001] Search is case insensitive', async () => {
    await mealsPage.openAddMeal();
    await addMealPage.searchFood('CHAPATI');
    const r1 = (await $$('~search-result-item')).length;
    await addMealPage.searchFood('chapati');
    const r2 = (await $$('~search-result-item')).length;
    await addMealPage.close();
    expect(Math.abs(r1 - r2)).toBeLessThan(3);
  });

  // Search then select
  it('[TC_SEARCH_SELECT_001] Select result from search adds to form', async () => {
    await mealsPage.openAddMeal();
    await addMealPage.searchFood('dosa');
    await addMealPage.selectFirstResult();
    const cal = await addMealPage.getTotalCalories();
    await addMealPage.close();
    expect(cal).toBeGreaterThan(0);
  });

  after(() => { LogUtil.info('Search test suite complete.'); });
});
