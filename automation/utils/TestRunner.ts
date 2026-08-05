/**
 * TestRunner — dynamic test case executor
 * Reads testData.json and generates test permutations at runtime.
 * No hardcoded test cases — all driven by data.
 */
import { TestResult, TestRegistry, recordResult } from './LogUtil';
import { ScreenshotUtil } from './ScreenshotUtil';

export type TestFn = (data: any) => Promise<{ passed: boolean; message?: string }>;

export interface DynamicTestCase {
  id: string;
  module: string;
  name: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  data: any;
  fn: TestFn;
}

/**
 * Generate test IDs from module prefix + index
 */
export function makeTestId(prefix: string, index: number): string {
  return `TC_${prefix.toUpperCase().replace(/\s/g, '_')}_${String(index).padStart(3, '0')}`;
}

/**
 * Execute a single dynamic test with retry, logging, and screenshot on failure
 */
export async function runDynamicTest(tc: DynamicTestCase, retries = 2): Promise<TestResult> {
  const startTime = Date.now();
  let lastError = '';
  let screenshotPath: string | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await tc.fn(tc.data);
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        id: tc.id,
        module: tc.module,
        name: tc.name,
        priority: tc.priority,
        status: result.passed ? 'PASSED' : 'FAILED',
        duration,
        errorMessage: result.passed ? undefined : result.message,
        screenshotPath,
        timestamp: new Date().toISOString()
      };
      recordResult(testResult);
      return testResult;
    } catch (e: any) {
      lastError = e?.message || String(e);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000));
      } else {
        // Final failure: capture screenshot
        try {
          screenshotPath = await ScreenshotUtil.captureOnFailure(tc.name);
        } catch {}
      }
    }
  }

  const duration = Date.now() - startTime;
  const testResult: TestResult = {
    id: tc.id,
    module: tc.module,
    name: tc.name,
    priority: tc.priority,
    status: 'FAILED',
    duration,
    errorMessage: lastError,
    screenshotPath,
    timestamp: new Date().toISOString()
  };
  recordResult(testResult);
  return testResult;
}
