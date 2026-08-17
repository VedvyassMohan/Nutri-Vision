/**
 * ParallelRunner — manages parallel WebdriverIO execution across multiple workers.
 * Each module runs in a separate worker with its own Appium session.
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface ParallelConfig {
  maxWorkers: number;
  specs: string[];
  outputDir: string;
}

export class ParallelRunner {
  static readonly DEFAULT_MAX_WORKERS = 1; // Increase if multiple emulators available

  /**
   * Get all spec files grouped by module for parallel execution
   */
  static getSpecGroups(): Record<string, string[]> {
    const testsDir = path.resolve(__dirname, '../tests');
    const groups: Record<string, string[]> = {};

    const modules = fs.readdirSync(testsDir).filter(d =>
      fs.statSync(path.join(testsDir, d)).isDirectory()
    );

    for (const mod of modules) {
      const specs = fs.readdirSync(path.join(testsDir, mod))
        .filter(f => f.endsWith('.spec.ts'))
        .map(f => path.join(testsDir, mod, f));
      if (specs.length > 0) {
        groups[mod] = specs;
      }
    }

    return groups;
  }

  /**
   * Get all spec files as flat array
   */
  static getAllSpecs(): string[] {
    const groups = ParallelRunner.getSpecGroups();
    return Object.values(groups).flat();
  }

  /**
   * Generate wdio parallel config with maxInstances
   */
  static generateParallelConfig(maxWorkers: number = 1): string {
    return `
// Auto-generated parallel config
export const parallelConfig = {
  maxInstances: ${maxWorkers},
  specs: ${JSON.stringify(ParallelRunner.getAllSpecs(), null, 2)},
};
`;
  }

  /**
   * Print spec distribution table for CI summary
   */
  static printSpecTable() {
    const groups = ParallelRunner.getSpecGroups();
    console.log('\n📋 Test Suite Distribution:');
    console.log('─'.repeat(50));
    let total = 0;
    for (const [mod, specs] of Object.entries(groups)) {
      console.log(`  ${mod.padEnd(25)} ${specs.length} spec file(s)`);
      total += specs.length;
    }
    console.log('─'.repeat(50));
    console.log(`  ${'TOTAL'.padEnd(25)} ${total} spec files`);
    console.log('');
  }
}

// Run if called directly
if (require.main === module) {
  ParallelRunner.printSpecTable();
}
