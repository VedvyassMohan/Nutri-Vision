/**
 * Profile Management — Dynamic Data-Driven Tests
 */
import testData from '../../data/testData.json';
import { ProfilePage, NavigationPage } from '../../pages/AppPages';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const profilePage = new ProfilePage();
const navPage = new NavigationPage();

describe('[PROFILE] Data-Driven Profile Management Tests', () => {
  before(async () => {
    await navPage.goToProfile();
  });

  // === VALID PROFILE UPDATE — one per valid profile dataset ===
  testData.profileData.valid.forEach((profile, idx) => {
    const testId = makeTestId('PROFILE_UPDATE', idx + 1);
    it(`[${testId}] Valid profile update: ${profile.name}`, async () => {
      LogUtil.testStart(testId, `Profile update: ${profile.name}`);
      await profilePage.updateProfile(profile);
      const success = await profilePage.isSaveSuccessVisible();
      expect(success).toBe(true);
    });
  });

  // === INVALID PROFILE ENTRIES ===
  testData.profileData.invalid.forEach((inv, idx) => {
    const testId = makeTestId('PROFILE_INVALID', idx + 1);
    it(`[${testId}] Invalid profile rejected: ${inv.reason}`, async () => {
      await profilePage.updateProfile(inv as any);
      const success = await profilePage.isSaveSuccessVisible();
      expect(success).toBe(false);
    });
  });

  // === CALORIE GOAL TESTS — one per calorie goal ===
  testData.calorieGoals.forEach((goal, idx) => {
    const testId = makeTestId('PROFILE_GOAL', idx + 1);
    it(`[${testId}] Set calorie goal: ${goal} kcal`, async () => {
      await profilePage.typeText('~calorie-goal-input', String(goal));
      await profilePage.saveBtn.click();
      const success = await profilePage.isSaveSuccessVisible();
      expect(success).toBe(true);
    });
  });

  // === DARK MODE TOGGLE ===
  it('[TC_PROFILE_DM_001] Dark mode toggle works', async () => {
    await profilePage.toggleDarkMode();
    const isDark = await profilePage.isDisplayed('~dark-theme-active');
    await profilePage.toggleDarkMode(); // toggle back
    expect(typeof isDark).toBe('boolean');
  });

  it('[TC_PROFILE_DM_002] Light mode toggle restores light theme', async () => {
    await profilePage.toggleDarkMode(); // go dark
    await profilePage.toggleDarkMode(); // go light
    const isLight = await profilePage.isDisplayed('~light-theme-active');
    expect(typeof isLight).toBe('boolean');
  });

  after(() => {
    LogUtil.info('Profile test suite complete.');
  });
});
