/**
 * Session Management — Dynamic Data-Driven Tests (20 test cases)
 */
import testData from '../../data/testData.json';
import { LoginPage, NavigationPage, HomePage, ProfilePage } from '../../pages/AppPages';
import { makeTestId } from '../../utils/TestRunner';
import { LogUtil } from '../../utils/LogUtil';

const loginPage = new LoginPage();
const navPage = new NavigationPage();
const homePage = new HomePage();
const profilePage = new ProfilePage();

describe('[SESSION] Data-Driven Session Management Tests', () => {

  // Session persistence per user
  testData.users.validUsers.forEach((user, idx) => {
    const testId = makeTestId('SESS_PERSIST', idx + 1);
    it(`[${testId}] Session persists for: ${user.name}`, async () => {
      await loginPage.login(user.email, user.password);
      await navPage.goToMeals();
      await navPage.goToProfile();
      await navPage.goToHome();
      const visible = await homePage.isHomeVisible();
      expect(visible).toBe(true);
    });
  });

  // Session cleared on logout
  testData.users.validUsers.forEach((user, idx) => {
    const testId = makeTestId('SESS_LOGOUT', idx + 1);
    it(`[${testId}] Session cleared on logout: ${user.name}`, async () => {
      await loginPage.login(user.email, user.password);
      await navPage.goToProfile();
      await profilePage.logout();
      const isLoginVisible = await loginPage.isLoginPageVisible();
      expect(isLoginVisible).toBe(true);
    });
  });

  // Session timeout simulation
  it('[TC_SESS_TIMEOUT_001] Session remains after 30s idle', async () => {
    await loginPage.login(
      testData.users.validUsers[0].email,
      testData.users.validUsers[0].password
    );
    await new Promise(r => setTimeout(r, 30000));
    const visible = await homePage.isHomeVisible();
    expect(visible).toBe(true);
  });

  // Multiple sessions (back-to-back login/logout)
  it('[TC_SESS_MULTI_001] Multiple login/logout cycles work', async () => {
    for (const user of testData.users.validUsers) {
      await loginPage.login(user.email, user.password);
      await navPage.goToProfile();
      await profilePage.logout();
    }
    const isLogin = await loginPage.isLoginPageVisible();
    expect(isLogin).toBe(true);
  });

  // Token invalidation
  it('[TC_SESS_TOKEN_001] Invalid user cannot access protected screens', async () => {
    await loginPage.login('invalid@user.com', 'WrongPass123');
    const onLogin = await loginPage.isLoginPageVisible();
    expect(onLogin).toBe(true);
  });

  after(() => { LogUtil.info('Session test suite complete.'); });
});
