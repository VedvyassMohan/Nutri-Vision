import type { Options } from '@wdio/types';
import path from 'path';

const APK_PATH = process.env.APK_PATH || path.resolve(__dirname, '../../expo-app/android/app/build/outputs/apk/debug/app-debug.apk');

export const config: Options.Testrunner = {
  runner: 'local',
  port: 4723,
  path: '/',
  specs: ['./tests/**/*.spec.ts'],
  exclude: [],
  maxInstances: 1,
  capabilities: [{
    platformName: 'Android',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'emulator-5554',
    'appium:platformVersion': process.env.ANDROID_VERSION || '13.0',
    'appium:automationName': 'UiAutomator2',
    'appium:app': APK_PATH,
    'appium:appPackage': 'com.nutrivision.expo',
    'appium:appActivity': 'com.nutrivision.expo.MainActivity',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 120,
    'appium:androidInstallTimeout': 90000,
    'appium:uiautomator2ServerInstallTimeout': 90000,
    'appium:adbExecTimeout': 60000,
    'appium:settings[waitForIdleTimeout]': 100,
    'appium:settings[waitForSelectorTimeout]': 10000,
  }],
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: [],
  framework: 'mocha',
  reporters: [
    'spec',
    ['allure', {
      outputDir: './reports/allure-results',
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
    }],
    ['junit', {
      outputDir: './reports/junit',
      outputFileFormat(options: any) {
        return `test-results-${options.cid}.xml`;
      }
    }]
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 90000,
    retries: 2,
  },
  before: async function () {
    const fs = await import('fs');
    ['./reports', './reports/allure-results', './reports/junit', './screenshots', './logs'].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  },
  afterTest: async function (test, context, { passed }) {
    if (!passed) {
      const { ScreenshotUtil } = await import('../utils/ScreenshotUtil');
      await ScreenshotUtil.captureOnFailure(test.title);
    }
  },
  onComplete: async function () {
    const { ExcelReporter } = await import('../reporters/ExcelReporter');
    const { HtmlReporter } = await import('../reporters/HtmlReporter');
    await ExcelReporter.generate();
    await HtmlReporter.generate();
  }
};
