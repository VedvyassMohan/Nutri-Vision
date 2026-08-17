import { driver } from '@wdio/globals';

export class RetryUtil {
  /**
   * Retry a function up to `maxRetries` times with delay between attempts
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 2,
    delayMs: number = 2000,
    label: string = 'operation'
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error');
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await fn();
        if (attempt > 1) {
          console.log(`  ♻️  Succeeded on attempt ${attempt}: ${label}`);
        }
        return result;
      } catch (err: any) {
        lastError = err;
        if (attempt <= maxRetries) {
          console.log(`  ⚠️  Attempt ${attempt} failed (${label}): ${err?.message?.slice(0, 80)}`);
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }
    throw lastError;
  }

  /**
   * Wait for a condition to be true with polling
   */
  static async waitForCondition(
    fn: () => Promise<boolean>,
    timeoutMs: number = 10000,
    pollMs: number = 500,
    label: string = 'condition'
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await fn().catch(() => false)) return;
      await new Promise(r => setTimeout(r, pollMs));
    }
    throw new Error(`Timeout waiting for: ${label}`);
  }

  /**
   * Retry tap on an element that may need time to appear
   */
  static async tapWithRetry(selector: string, retries = 2): Promise<void> {
    await RetryUtil.withRetry(async () => {
      const el = await $(selector);
      await el.waitForDisplayed({ timeout: 8000 });
      await el.click();
    }, retries, 1500, `tap(${selector})`);
  }
}
