import { driver } from '@wdio/globals';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

export class ScreenshotUtil {
  /**
   * Capture a screenshot with a given name
   */
  static async capture(name: string): Promise<string> {
    const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${sanitized}_${timestamp}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    await driver.saveScreenshot(filepath);
    console.log(`📸 Screenshot saved: ${filepath}`);
    return filepath;
  }

  /**
   * Capture on test failure
   */
  static async captureOnFailure(testTitle: string): Promise<string> {
    return ScreenshotUtil.capture(`FAIL_${testTitle}`);
  }

  /**
   * Capture on test pass
   */
  static async captureOnPass(testTitle: string): Promise<string> {
    return ScreenshotUtil.capture(`PASS_${testTitle}`);
  }

  /**
   * List all screenshots
   */
  static listScreenshots(): string[] {
    if (!fs.existsSync(SCREENSHOTS_DIR)) return [];
    return fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  }
}
