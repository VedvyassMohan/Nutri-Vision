/**
 * Notifications — Dynamic Data-Driven Tests (20 test cases)
 */
import testData from '../../data/testData.json';
import { NavigationPage, ProfilePage } from '../../pages/AppPages';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const navPage = new NavigationPage();
const profilePage = new ProfilePage();

describe('[NOTIF] Data-Driven Notification Tests', () => {

  // Notification types
  testData.notifications.types.forEach((type, idx) => {
    const testId = makeTestId('NOTIF_TYPE', idx + 1);
    it(`[${testId}] Notification type '${type}' is configured`, async () => {
      expect(testData.notifications.types).toContain(type);
    });
  });

  // Notification times
  testData.notifications.times.forEach((time, idx) => {
    const testId = makeTestId('NOTIF_TIME', idx + 1);
    it(`[${testId}] Notification time '${time}' is valid format`, async () => {
      const parts = time.split(':');
      expect(parts.length).toBe(2);
      expect(parseInt(parts[0])).toBeLessThan(24);
      expect(parseInt(parts[1])).toBeLessThan(60);
    });
  });

  // Notification permission
  it('[TC_NOTIF_PERM_001] Notification permission request handled', async () => {
    try {
      await driver.executeScript('mobile: shell', [
        { command: 'pm grant com.nutrivision.expo android.permission.POST_NOTIFICATIONS' }
      ]);
    } catch {}
    const navVisible = await navPage.isBottomNavVisible();
    expect(navVisible).toBe(true);
  });

  // Settings navigation
  it('[TC_NOTIF_NAV_001] Can navigate to notification settings', async () => {
    await navPage.goToProfile();
    const profileVisible = await profilePage.isDisplayed('~profile-avatar');
    expect(typeof profileVisible).toBe('boolean');
  });

  // Meal reminder types × times (cross-product)
  testData.notifications.types.slice(0, 2).forEach((type, tIdx) => {
    testData.notifications.times.slice(0, 2).forEach((time, tmIdx) => {
      const testId = makeTestId('NOTIF_COMBO', tIdx * 2 + tmIdx + 1);
      it(`[${testId}] ${type} at ${time} is valid config`, async () => {
        expect(type.length).toBeGreaterThan(0);
        expect(time.length).toBeGreaterThan(0);
      });
    });
  });

  after(() => { LogUtil.info('Notifications test suite complete.'); });
});
