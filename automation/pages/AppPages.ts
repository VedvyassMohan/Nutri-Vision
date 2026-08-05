import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  get emailInput()    { return $('~login-email-input'); }
  get passwordInput() { return $('~login-password-input'); }
  get loginButton()   { return $('~login-submit-btn'); }
  get googleBtn()     { return $('~google-signin-btn'); }
  get errorMessage()  { return $('~login-error-msg'); }
  get signupLink()    { return $('~goto-signup-link'); }
  get forgotPwdLink() { return $('~forgot-password-link'); }

  async login(email: string, password: string) {
    await this.typeText('~login-email-input', email);
    await this.typeText('~login-password-input', password);
    await this.hideKeyboard();
    await this.loginButton.click();
    await this.sleep(2000);
  }

  async getError(): Promise<string> {
    return this.getTextSafe('~login-error-msg');
  }

  async isLoginPageVisible(): Promise<boolean> {
    return this.isDisplayed('~login-email-input');
  }
}

export class HomePage extends BasePage {
  get homeTab()        { return $('~home-tab'); }
  get welcomeText()    { return $('~welcome-header-text'); }
  get calorieRing()    { return $('~calorie-ring'); }
  get macroCards()     { return $$('~macro-card'); }
  get mealsPreview()   { return $('~meals-preview-list'); }
  get progressBar()    { return $('~daily-progress-bar'); }
  get waterTracker()   { return $('~water-tracker'); }

  async isHomeVisible(): Promise<boolean> {
    return this.isDisplayed('~welcome-header-text');
  }

  async getCalorieDisplay(): Promise<string> {
    return this.getTextSafe('~calorie-ring');
  }

  async getMacroCount(): Promise<number> {
    const cards = await $$('~macro-card');
    return cards.length;
  }
}

export class ProfilePage extends BasePage {
  get profileTab()    { return $('~profile-tab'); }
  get nameInput()     { return $('~profile-name-input'); }
  get ageInput()      { return $('~profile-age-input'); }
  get weightInput()   { return $('~profile-weight-input'); }
  get heightInput()   { return $('~profile-height-input'); }
  get goalSelector()  { return $('~profile-goal-selector'); }
  get saveBtn()       { return $('~profile-save-btn'); }
  get successMsg()    { return $('~profile-save-success'); }
  get avatar()        { return $('~profile-avatar'); }
  get logoutBtn()     { return $('~logout-btn'); }
  get darkModeToggle(){ return $('~dark-mode-toggle'); }
  get calorieGoalInput(){ return $('~calorie-goal-input'); }

  async updateProfile(data: { name?: string; age?: number; weight?: number; height?: number; goal?: string }) {
    if (data.name)   await this.typeText('~profile-name-input', data.name);
    if (data.age)    await this.typeText('~profile-age-input', String(data.age));
    if (data.weight) await this.typeText('~profile-weight-input', String(data.weight));
    if (data.height) await this.typeText('~profile-height-input', String(data.height));
    await this.hideKeyboard();
    await this.saveBtn.click();
    await this.sleep(1500);
  }

  async logout() {
    await this.logoutBtn.click();
    await this.sleep(1000);
  }

  async toggleDarkMode() {
    await this.darkModeToggle.click();
  }

  async isSaveSuccessVisible(): Promise<boolean> {
    return this.isDisplayed('~profile-save-success');
  }
}

export class NavigationPage extends BasePage {
  get homeTab()   { return $('~home-tab'); }
  get mealsTab()  { return $('~meals-tab'); }
  get profileTab(){ return $('~profile-tab'); }

  async goToHome()    { await this.homeTab.click(); await this.sleep(500); }
  async goToMeals()   { await this.mealsTab.click(); await this.sleep(500); }
  async goToProfile() { await this.profileTab.click(); await this.sleep(500); }

  async isBottomNavVisible(): Promise<boolean> {
    return this.isDisplayed('~home-tab');
  }

  async getActiveTab(): Promise<string> {
    // Returns which tab is currently focused
    for (const tab of ['home', 'meals', 'profile']) {
      try {
        const el = await $(`~${tab}-tab`);
        const selected = await el.getAttribute('selected');
        if (selected === 'true') return tab;
      } catch {}
    }
    return 'unknown';
  }
}
