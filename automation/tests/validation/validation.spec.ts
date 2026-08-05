/**
 * Input Validation — Dynamic Data-Driven Tests
 * Generates test cases for all form fields from testData
 */
import testData from '../../data/testData.json';
import { MealsPage, AddMealPage } from '../../pages/MealsPage';
import { ProfilePage, NavigationPage } from '../../pages/AppPages';
import { makeTestId } from '../../utils/TestRunner';

const mealsPage = new MealsPage();
const addMealPage = new AddMealPage();
const profilePage = new ProfilePage();
const navPage = new NavigationPage();

describe('[VALIDATION] Data-Driven Input Validation Tests', () => {

  // === SEARCH INPUT VALIDATION ===
  const inputEdgeCases = [
    { input: '', label: 'empty string' },
    { input: '   ', label: 'whitespace only' },
    { input: 'a'.repeat(200), label: '200 char string' },
    { input: '<script>alert(1)</script>', label: 'XSS attempt' },
    { input: "'; DROP TABLE meals;--", label: 'SQL injection' },
    { input: '🍛🍚🥘', label: 'emoji only' },
    { input: '123456', label: 'numbers only' },
    { input: '!@#$%^&*()', label: 'special chars' },
  ];

  inputEdgeCases.forEach((tc, idx) => {
    const testId = makeTestId('VALID_SEARCH', idx + 1);
    it(`[${testId}] Search handles: ${tc.label}`, async () => {
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.searchFood(tc.input);
      // App should not crash — just show 0 results or empty state
      const isCameraVisible = await addMealPage.isDisplayed('~camera-preview-box');
      await addMealPage.close();
      expect(isCameraVisible).toBe(true); // App still alive
    });
  });

  // === DESCRIPTION INPUT VALIDATION ===
  inputEdgeCases.forEach((tc, idx) => {
    const testId = makeTestId('VALID_DESC', idx + 1);
    it(`[${testId}] Description handles: ${tc.label}`, async () => {
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.describeAndWait(tc.input);
      const isAlive = await addMealPage.isDisplayed('~capture-analyze-btn');
      await addMealPage.close();
      expect(isAlive).toBe(true);
    });
  });

  // === PROFILE FIELD VALIDATION ===
  testData.profileData.invalid.forEach((inv, idx) => {
    const testId = makeTestId('VALID_PROFILE', idx + 1);
    it(`[${testId}] Profile rejects: ${inv.reason}`, async () => {
      await navPage.goToProfile();
      await profilePage.updateProfile(inv as any);
      const success = await profilePage.isSaveSuccessVisible();
      expect(success).toBe(false);
    });
  });

  // === CALORIE GOAL BOUNDARIES ===
  const calBoundaries = [
    { value: '0', valid: false, reason: 'Zero calories' },
    { value: '-100', valid: false, reason: 'Negative calories' },
    { value: '10000', valid: false, reason: 'Unrealistic high' },
    { value: '500', valid: true, reason: 'Minimum valid' },
    { value: '5000', valid: true, reason: 'Maximum valid' },
  ];

  calBoundaries.forEach((tc, idx) => {
    const testId = makeTestId('VALID_CALGOAL', idx + 1);
    it(`[${testId}] Calorie goal boundary: ${tc.reason} (${tc.value})`, async () => {
      await navPage.goToProfile();
      await profilePage.typeText('~calorie-goal-input', tc.value);
      await profilePage.saveBtn.click();
      const success = await profilePage.isSaveSuccessVisible();
      expect(success).toBe(tc.valid);
    });
  });

  // === PORTION BOUNDARY TESTS ===
  testData.portions.forEach((portion, idx) => {
    const testId = makeTestId('VALID_PORTION', idx + 1);
    it(`[${testId}] Portion '${portion}' is accepted and updates calories`, async () => {
      await navPage.goToMeals();
      await mealsPage.openAddMeal();
      await addMealPage.searchFood('chapati');
      await addMealPage.selectFirstResult();
      await addMealPage.setPortion(portion as any);
      const cal = await addMealPage.getTotalCalories();
      await addMealPage.close();
      expect(cal).toBeGreaterThan(0);
    });
  });
});
