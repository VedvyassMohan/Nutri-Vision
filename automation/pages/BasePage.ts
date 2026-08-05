import { driver } from '@wdio/globals';

export class BasePage {
  /**
   * Wait for an element by its accessibility id or XPath and return it
   */
  async findElement(selector: string, timeout = 15000) {
    const el = await $(selector);
    await el.waitForDisplayed({ timeout });
    return el;
  }

  async tap(selector: string) {
    const el = await this.findElement(selector);
    await el.click();
  }

  async typeText(selector: string, text: string) {
    const el = await this.findElement(selector);
    await el.clearValue();
    await el.setValue(text);
  }

  async getText(selector: string): Promise<string> {
    const el = await this.findElement(selector);
    return el.getText();
  }

  async isDisplayed(selector: string): Promise<boolean> {
    try {
      const el = await $(selector);
      return el.isDisplayed();
    } catch {
      return false;
    }
  }

  async waitForVisible(selector: string, timeout = 15000) {
    const el = await $(selector);
    await el.waitForDisplayed({ timeout });
  }

  async scrollDown() {
    await driver.executeScript('mobile: scroll', [{ direction: 'down' }]);
  }

  async scrollUp() {
    await driver.executeScript('mobile: scroll', [{ direction: 'up' }]);
  }

  async swipeLeft(startX = 800, startY = 400, endX = 100, endY = 400) {
    await driver.action('pointer', {
      parameters: { pointerType: 'touch' }
    })
      .move({ x: startX, y: startY })
      .down()
      .move({ x: endX, y: endY })
      .up()
      .perform();
  }

  async getTextSafe(selector: string): Promise<string> {
    try {
      return await this.getText(selector);
    } catch {
      return '';
    }
  }

  async isEnabled(selector: string): Promise<boolean> {
    const el = await $(selector);
    return el.isEnabled();
  }

  async getAttribute(selector: string, attr: string): Promise<string> {
    const el = await this.findElement(selector);
    return el.getAttribute(attr);
  }

  async hideKeyboard() {
    try {
      await driver.hideKeyboard();
    } catch {}
  }

  async sleep(ms: number) {
    await new Promise(r => setTimeout(r, ms));
  }

  async retry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (e) {
        if (i === retries) throw e;
        await this.sleep(2000);
      }
    }
    throw new Error('Retry failed');
  }
}
