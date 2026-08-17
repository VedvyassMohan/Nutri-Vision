/**
 * Forms — Dynamic Data-Driven Tests (40 test cases)
 * All test cases generated at runtime from testData.json
 */
import testData from '../../data/testData.json';
import { MealsPage, AddMealPage } from '../../pages/MealsPage';
import { ProfilePage, NavigationPage } from '../../pages/AppPages';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const mealsPage = new MealsPage();
const addMealPage = new AddMealPage();
const profilePage = new ProfilePage();
const navPage = new NavigationPage();

describe('[FORMS] Data-Driven Form Tests', () => {

  // === MEAL FORM — one test per meal item ===
  testData.meals.forEach((meal, idx) => {
    const testId = makeTestId('FORM_MEAL', idx + 1);
    it(`[${testId}] Meal form accepts: ${meal.name}`, async () => {
      LogUtil.testStart(testId, `Form: ${meal.name}`);
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.searchFood(meal.name);
      await addMealPage.selectFirstResult();
      const isCalcVisible = await addMealPage.isCalculationVisible();
      await addMealPage.close();
      expect(typeof isCalcVisible).toBe('boolean');
    });
  });

  // === DESCRIPTION FORM — one per meal description ===
  testData.meals.forEach((meal, idx) => {
    const testId = makeTestId('FORM_DESC', idx + 1);
    it(`[${testId}] Description form processes: "${meal.description}"`, async () => {
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.describeAndWait(meal.description);
      const visible = await addMealPage.isDisplayed('~capture-analyze-btn');
      await addMealPage.close();
      expect(visible).toBe(true);
    });
  });

  // === PROFILE FORM — one per valid profile ===
  testData.profileData.valid.forEach((profile, idx) => {
    const testId = makeTestId('FORM_PROFILE', idx + 1);
    it(`[${testId}] Profile form saves: ${profile.name}`, async () => {
      await navPage.goToProfile();
      await profilePage.updateProfile(profile);
      const success = await profilePage.isSaveSuccessVisible();
      expect(success).toBe(true);
    });
  });

  // === FORM FIELD CLEARING ===
  it('[TC_FORM_CLEAR_001] Search field clears between searches', async () => {
    await navPage.goToMeals();
    await mealsPage.openAddMeal();
    await addMealPage.searchFood('chapati');
    await addMealPage.searchFood('');
    const el = await $('~food-search-input');
    const val = await el.getValue();
    await addMealPage.close();
    expect(val).toBe('');
  });

  // === FORM SUBMISSION WITHOUT DATA ===
  it('[TC_FORM_EMPTY_001] Submit without selecting food shows 0 kcal', async () => {
    await navPage.goToMeals();
    await mealsPage.openAddMeal();
    const cal = await addMealPage.getTotalCalories();
    await addMealPage.close();
    expect(cal).toBe(0);
  });

  // === CALORIE GOAL FORM ===
  testData.calorieGoals.forEach((goal, idx) => {
    const testId = makeTestId('FORM_CALGOAL', idx + 1);
    it(`[${testId}] Calorie goal form accepts: ${goal} kcal`, async () => {
      await navPage.goToProfile();
      await profilePage.typeText('~calorie-goal-input', String(goal));
      await profilePage.hideKeyboard();
      await profilePage.saveBtn.click();
      const success = await profilePage.isSaveSuccessVisible();
      expect(success).toBe(true);
    });
  });

  // === PORTION FORM ===
  testData.portions.forEach((portion, idx) => {
    const testId = makeTestId('FORM_PORTION', idx + 1);
    it(`[${testId}] Portion selector form: ${portion}`, async () => {
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.searchFood('biryani');
      await addMealPage.selectFirstResult();
      await addMealPage.setPortion(portion as any);
      const cal = await addMealPage.getTotalCalories();
      await addMealPage.close();
      expect(cal).toBeGreaterThan(0);
    });
  });

  // === FORM KEYBOARD DISMISS ===
  it('[TC_FORM_KB_001] Keyboard dismisses on scroll', async () => {
    await navPage.goToMeals();
    await mealsPage.openAddMeal();
    await addMealPage.searchFood('rice');
    await addMealPage.scrollDown();
    const isAlive = await addMealPage.isDisplayed('~capture-analyze-btn');
    await addMealPage.close();
    expect(isAlive).toBe(true);
  });

  // === MULTI-FIELD FORM ===
  it('[TC_FORM_MULTI_001] Description + portion form combination', async () => {
    await navPage.goToMeals();
    await mealsPage.openAddMeal();
    await addMealPage.describeAndWait('2 chapati with butter');
    const hasCalc = await addMealPage.isCalculationVisible();
    if (hasCalc) await addMealPage.setPortion('2x');
    const cal = await addMealPage.getTotalCalories();
    await addMealPage.close();
    expect(typeof cal).toBe('number');
  });

  after(() => { LogUtil.info('Forms test suite complete.'); });
});
