import { BasePage } from './BasePage';

export class MealsPage extends BasePage {
  // Selectors
  get mealsTab()           { return $('~meals-tab'); }
  get addMealFab()         { return $('~add-meal-fab'); }
  get mealsList()          { return $('~meals-list'); }
  get macroOverviewCard()  { return $('~macro-overview-card'); }
  get proteinBar()         { return $('~protein-progress'); }
  get carbsBar()           { return $('~carbs-progress'); }
  get fatBar()             { return $('~fat-progress'); }
  get calorieCount()       { return $('~today-calories'); }
  get emptyStateText()     { return $('~empty-meals-state'); }
  get headerTitle()        { return $('//android.widget.TextView[@text="Today\'s Meals"]'); }

  async openAddMeal() {
    await this.addMealFab.click();
  }

  async getMealCount(): Promise<number> {
    try {
      const items = await $$('~meal-item');
      return items.length;
    } catch { return 0; }
  }

  async getMealByName(name: string) {
    return $(`//android.widget.TextView[@text="${name}"]`);
  }

  async deleteMeal(name: string) {
    const meal = await this.getMealByName(name);
    await meal.click();
    await $('~delete-meal-btn').click();
  }

  async getTodayCalories(): Promise<number> {
    const text = await this.getTextSafe('~today-calories');
    return parseInt(text.replace(/\D/g, '')) || 0;
  }

  async isMacroOverviewVisible(): Promise<boolean> {
    return this.isDisplayed('~macro-overview-card');
  }

  async isAddMealButtonVisible(): Promise<boolean> {
    return this.addMealFab.isDisplayed();
  }

  async verifyHeaderHasNoTopRightAddButton(): Promise<boolean> {
    const btn = await $('~header-add-meal-btn');
    try { return !(await btn.isDisplayed()); } catch { return true; }
  }
}

export class AddMealPage extends BasePage {
  // Selectors
  get cameraBox()          { return $('~camera-preview-box'); }
  get captureBtn()         { return $('~capture-analyze-btn'); }
  get uploadBtn()          { return $('~upload-gallery-btn'); }
  get descriptionInput()   { return $('~meal-description-input'); }
  get searchInput()        { return $('~food-search-input'); }
  get searchResults()      { return $$('~search-result-item'); }
  get selectedRecipeCard() { return $('~selected-recipe-card'); }
  get calculationSummary() { return $('~total-calculation-card'); }
  get addMealBtn()         { return $('~submit-add-meal-btn'); }
  get closeBtn()           { return $('~close-add-meal-btn'); }
  get aiResultBanner()     { return $('~ai-vision-result-banner'); }
  get portion05()          { return $('~portion-btn-05x'); }
  get portion1()           { return $('~portion-btn-1x'); }
  get portion15()          { return $('~portion-btn-15x'); }
  get portion2()           { return $('~portion-btn-2x'); }

  async searchFood(query: string) {
    await this.typeText('~food-search-input', query);
    await this.sleep(800);
  }

  async selectFirstResult() {
    const results = await $$('~search-result-item');
    if (results.length > 0) await results[0].click();
  }

  async selectResultByName(name: string) {
    const el = await $(`//android.widget.TextView[@text="${name}"]`);
    await el.click();
  }

  async setPortion(portion: '0.5x' | '1x' | '1.5x' | '2x') {
    const btnMap: Record<string, typeof this.portion1> = {
      '0.5x': this.portion05,
      '1x': this.portion1,
      '1.5x': this.portion15,
      '2x': this.portion2,
    };
    await (await btnMap[portion]).click();
  }

  async describeAndWait(description: string) {
    await this.typeText('~meal-description-input', description);
    await this.sleep(1000);
  }

  async getDetectedFoodName(): Promise<string> {
    return this.getTextSafe('~ai-detected-food-name');
  }

  async getTotalCalories(): Promise<number> {
    const text = await this.getTextSafe('~total-cal-display');
    return parseInt(text.replace(/\D/g, '')) || 0;
  }

  async addMeal() {
    await this.addMealBtn.click();
  }

  async close() {
    await this.closeBtn.click();
  }

  async isCalculationVisible(): Promise<boolean> {
    return this.isDisplayed('~total-calculation-card');
  }

  async getAdditionsChips(): Promise<string[]> {
    const chips = await $$('~addition-chip');
    return Promise.all(chips.map(c => c.getText()));
  }
}
