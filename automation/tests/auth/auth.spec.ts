/**
 * Authentication — Dynamic Data-Driven Tests
 * Login, Logout, Session — all driven by testData.json users
 */
import testData from '../../data/testData.json';
import { LoginPage, NavigationPage, HomePage } from '../../pages/AppPages';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const loginPage = new LoginPage();
const navPage = new NavigationPage();
const homePage = new HomePage();

describe('[AUTH] Data-Driven Authentication Tests', () => {

  // === VALID LOGIN TESTS — one per valid user ===
  testData.users.validUsers.forEach((user, idx) => {
    const testId = makeTestId('AUTH_LOGIN', idx + 1);
    it(`[${testId}] Valid login: ${user.email}`, async () => {
      LogUtil.testStart(testId, `Login: ${user.email}`);
      await loginPage.login(user.email, user.password);
      const homeVisible = await homePage.isHomeVisible();
      if (!homeVisible) {
        // Attempt logout to reset state
        try { await navPage.goToProfile(); } catch {}
      }
      expect(homeVisible).toBe(true);
    });
  });

  // === INVALID LOGIN TESTS — one per invalid user scenario ===
  testData.users.invalidUsers.forEach((user, idx) => {
    const testId = makeTestId('AUTH_INVALID', idx + 1);
    it(`[${testId}] Invalid login rejected: ${user.reason}`, async () => {
      LogUtil.testStart(testId, `Invalid login: ${user.reason}`);
      await loginPage.login(user.email, user.password);
      const isLoginPage = await loginPage.isLoginPageVisible();
      const errText = await loginPage.getError();
      expect(isLoginPage || errText.length > 0).toBe(true);
    });
  });

  // === LOGOUT TESTS — for each valid user ===
  testData.users.validUsers.forEach((user, idx) => {
    const testId = makeTestId('AUTH_LOGOUT', idx + 1);
    it(`[${testId}] Logout works for: ${user.name}`, async () => {
      await loginPage.login(user.email, user.password);
      await navPage.goToProfile();
      const profilePage = (await import('../../pages/AppPages')).ProfilePage;
      const pg = new profilePage();
      await pg.logout();
      const isLoginPage = await loginPage.isLoginPageVisible();
      expect(isLoginPage).toBe(true);
    });
  });

  // === SESSION TESTS — per valid user ===
  testData.users.validUsers.forEach((user, idx) => {
    const testId = makeTestId('AUTH_SESSION', idx + 1);
    it(`[${testId}] Session persists after login for: ${user.name}`, async () => {
      await loginPage.login(user.email, user.password);
      const homeVisible = await homePage.isHomeVisible();
      // Navigate away and back
      await navPage.goToMeals();
      await navPage.goToHome();
      const stillVisible = await homePage.isHomeVisible();
      expect(homeVisible && stillVisible).toBe(true);
    });
  });

  // === EMPTY FIELD VALIDATION ===
  const fieldTests = [
    { email: '', password: 'Test@123', reason: 'Empty email' },
    { email: 'test@test.com', password: '', reason: 'Empty password' },
    { email: '', password: '', reason: 'Both fields empty' },
  ];

  fieldTests.forEach((test, idx) => {
    const testId = makeTestId('AUTH_FIELD', idx + 1);
    it(`[${testId}] Field validation: ${test.reason}`, async () => {
      await loginPage.login(test.email, test.password);
      const isLoginPage = await loginPage.isLoginPageVisible();
      expect(isLoginPage).toBe(true);
    });
  });

  // === EMAIL FORMAT VALIDATION ===
  const invalidEmailFormats = [
    'notanemail', 'missing@', '@nodomain.com', 'a@b', 'test@@test.com', 'test@.com'
  ];

  invalidEmailFormats.forEach((email, idx) => {
    const testId = makeTestId('AUTH_EMAIL', idx + 1);
    it(`[${testId}] Invalid email format rejected: '${email}'`, async () => {
      await loginPage.login(email, 'SomePassword1!');
      const isLoginPage = await loginPage.isLoginPageVisible();
      expect(isLoginPage).toBe(true);
    });
  });

  after(() => {
    LogUtil.info('Auth test suite complete.');
  });
});
