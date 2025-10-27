/**
 * @what: Benchmark TinyArms tiered routing performance with test cases
 * @why: Validate routing accuracy and speed targets (Level 0-2: <4s)
 * @usage: tsx scripts/benchmark.ts [config-file]
 * @author: NQH
 * @date: 2025-10-27
 */

import { TieredRouter } from '../src/router/tiered-router';
import { Config } from '../src/types';
import fs from 'fs/promises';
import path from 'path';

interface TestCase {
  id: string;
  skill: 'file-naming' | 'code-linting' | 'markdown-analysis' | 'voice-actions';
  input: any;
  expected: {
    output: any;
    minConfidence?: number;
    maxLatency?: number;
  };
  category: string;
}

// Test cases for file naming
const fileNamingTests: TestCase[] = [
  {
    id: 'fn-001',
    skill: 'file-naming',
    input: { filePath: 'Screenshot 2024-10-27.png', context: 'hero section mockup for mobile' },
    expected: { output: 'hero-mockup-mobile', minConfidence: 0.80 },
    category: 'file-naming-screenshot',
  },
  {
    id: 'fn-002',
    skill: 'file-naming',
    input: { filePath: 'IMG_1234.jpg', context: 'golden gate bridge at sunset' },
    expected: { output: 'golden-gate-sunset', minConfidence: 0.80 },
    category: 'file-naming-photo',
  },
  {
    id: 'fn-003',
    skill: 'file-naming',
    input: { filePath: 'Untitled design.fig', context: 'dashboard redesign project' },
    expected: { output: 'dashboard-redesign', minConfidence: 0.80 },
    category: 'file-naming-design',
  },
  {
    id: 'fn-004',
    skill: 'file-naming',
    input: { filePath: 'document.pdf', context: 'Q3 2024 financial report DRAFT' },
    expected: { output: 'q3-2024-financial-report-draft', minConfidence: 0.80 },
    category: 'file-naming-document',
  },
  {
    id: 'fn-005',
    skill: 'file-naming',
    input: { filePath: 'recording.mp3', context: 'team meeting notes october 27' },
    expected: { output: 'team-meeting-oct-27', minConfidence: 0.75 },
    category: 'file-naming-audio',
  },
];

// Test cases for code linting
const codeLintingTests: TestCase[] = [
  {
    id: 'cl-001',
    skill: 'code-linting',
    input: {
      filePath: 'test.tsx',
      code: 'const Button = () => <div style={{ color: "#ff0000" }}>Click</div>',
    },
    expected: {
      output: { issues: [{ category: 'constitutional', message: /hardcoded.*color/i }] },
      minConfidence: 0.80,
    },
    category: 'code-linting-hardcoded-color',
  },
  {
    id: 'cl-002',
    skill: 'code-linting',
    input: {
      filePath: 'utils.ts',
      code: 'export function formatDate(date: Date) { return date.toString(); }\nexport function formatDate2(date: Date) { return date.toString(); }',
    },
    expected: {
      output: { issues: [{ category: 'constitutional', message: /DRY.*duplicate/i }] },
      minConfidence: 0.75,
    },
    category: 'code-linting-dry-violation',
  },
  {
    id: 'cl-003',
    skill: 'code-linting',
    input: {
      filePath: 'clean.ts',
      code: 'const primaryColor = "var(--color-primary)";\nexport const Button = () => <div style={{ color: primaryColor }}>Click</div>',
    },
    expected: {
      output: { issues: [] },
      minConfidence: 0.85,
    },
    category: 'code-linting-clean',
  },
];

// Test cases for markdown analysis
const markdownAnalysisTests: TestCase[] = [
  {
    id: 'ma-001',
    skill: 'markdown-analysis',
    input: {
      changes: [
        {
          file: 'constitution.md',
          additions: ['## New Principle: Always validate user input'],
          deletions: [],
        },
      ],
    },
    expected: {
      output: { summary: /new principle/i, suggestions: [] },
      minConfidence: 0.70,
    },
    category: 'markdown-analysis-addition',
  },
  {
    id: 'ma-002',
    skill: 'markdown-analysis',
    input: {
      changes: [
        {
          file: 'README.md',
          additions: ['- New dependency: `lodash`'],
          deletions: ['- Old dependency: `underscore`'],
        },
      ],
    },
    expected: {
      output: { summary: /dependency.*change/i },
      minConfidence: 0.75,
    },
    category: 'markdown-analysis-dependency',
  },
];

// Test cases for voice actions
const voiceActionsTests: TestCase[] = [
  {
    id: 'va-001',
    skill: 'voice-actions',
    input: { text: 'um, like, rename this file to, uh, hero mockup mobile' },
    expected: {
      output: { keywords: ['rename', 'file', 'hero', 'mockup', 'mobile'] },
      minConfidence: 0.70,
    },
    category: 'voice-actions-filler-words',
  },
  {
    id: 'va-002',
    skill: 'voice-actions',
    input: { text: 'create a new project folder called website redesign' },
    expected: {
      output: { action: /create/i, keywords: ['project', 'folder', 'website', 'redesign'] },
      minConfidence: 0.80,
    },
    category: 'voice-actions-intent',
  },
];

const allTestCases: TestCase[] = [
  ...fileNamingTests,
  ...codeLintingTests,
  ...markdownAnalysisTests,
  ...voiceActionsTests,
];

interface BenchmarkResult {
  testCase: TestCase;
  result: {
    output: any;
    confidence: number;
    level: string;
    latencyMs: number;
  } | null;
  passed: boolean;
  errors: string[];
}

async function runBenchmark(configPath?: string): Promise<void> {
  console.log('🦖 TinyArms Benchmark\n');

  // Load config
  const config = await loadConfig(configPath);
  console.log(`Using config: ${configPath || 'default'}\n`);

  // Initialize router
  const router = new TieredRouter(config);

  // Run all test cases
  const results: BenchmarkResult[] = [];
  let testNum = 0;

  for (const testCase of allTestCases) {
    testNum++;
    console.log(`[${testNum}/${allTestCases.length}] ${testCase.id}: ${testCase.category}...`);

    try {
      const startTime = Date.now();
      const result = await router.route({
        skill: testCase.skill,
        data: testCase.input,
      });
      const totalLatency = Date.now() - startTime;

      // Validate result
      const errors: string[] = [];

      if (testCase.expected.minConfidence && result.confidence < testCase.expected.minConfidence) {
        errors.push(
          `Low confidence: ${result.confidence.toFixed(2)} < ${testCase.expected.minConfidence}`
        );
      }

      if (testCase.expected.maxLatency && totalLatency > testCase.expected.maxLatency) {
        errors.push(`Slow: ${totalLatency}ms > ${testCase.expected.maxLatency}ms`);
      }

      // Check output matches expected (basic validation)
      if (!validateOutput(result.output, testCase.expected.output)) {
        errors.push('Output mismatch');
      }

      const passed = errors.length === 0;
      console.log(
        `  ${passed ? '✓' : '✗'} ${result.level} | ${result.confidence.toFixed(2)} confidence | ${result.latencyMs}ms`
      );
      if (!passed) {
        console.log(`    Errors: ${errors.join(', ')}`);
      }

      results.push({
        testCase,
        result,
        passed,
        errors,
      });
    } catch (error) {
      console.log(`  ✗ ERROR: ${error}`);
      results.push({
        testCase,
        result: null,
        passed: false,
        errors: [String(error)],
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  printSummary(results);

  // Save detailed results
  await saveResults(results);
}

function validateOutput(actual: any, expected: any): boolean {
  if (typeof expected === 'string') {
    return actual === expected;
  }

  if (expected instanceof RegExp) {
    return expected.test(String(actual));
  }

  if (typeof expected === 'object') {
    // Check if expected properties exist and match
    for (const [key, value] of Object.entries(expected)) {
      if (value instanceof RegExp) {
        if (!value.test(String(actual[key]))) return false;
      } else if (Array.isArray(value)) {
        if (!Array.isArray(actual[key])) return false;
        // Check if array has items matching criteria
        if (value.length > 0 && typeof value[0] === 'object') {
          // Check if at least one item matches the pattern
          const matches = actual[key].some((item: any) =>
            Object.entries(value[0]).every(([k, v]) => {
              if (v instanceof RegExp) return v.test(String(item[k]));
              return item[k] === v;
            })
          );
          if (!matches) return false;
        }
      } else if (actual[key] !== value) {
        return false;
      }
    }
  }

  return true;
}

function printSummary(results: BenchmarkResult[]): void {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`\n📊 BENCHMARK RESULTS`);
  console.log(`Total tests: ${total}`);
  console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed}`);

  // Aggregate metrics
  const validResults = results.filter((r) => r.result !== null);
  const avgLatency =
    validResults.reduce((sum, r) => sum + (r.result?.latencyMs || 0), 0) / validResults.length;
  const avgConfidence =
    validResults.reduce((sum, r) => sum + (r.result?.confidence || 0), 0) / validResults.length;

  console.log(`\nAvg Latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`Avg Confidence: ${avgConfidence.toFixed(2)}`);

  // Level distribution
  const levelCounts: Record<string, number> = {};
  validResults.forEach((r) => {
    const level = r.result?.level || 'Unknown';
    levelCounts[level] = (levelCounts[level] || 0) + 1;
  });

  console.log(`\nLevel Distribution:`);
  Object.entries(levelCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([level, count]) => {
      const pct = ((count / validResults.length) * 100).toFixed(1);
      console.log(`  ${level}: ${count} (${pct}%)`);
    });

  // Category breakdown
  const categoryStats: Record<string, { passed: number; total: number }> = {};
  results.forEach((r) => {
    const cat = r.testCase.category;
    if (!categoryStats[cat]) {
      categoryStats[cat] = { passed: 0, total: 0 };
    }
    categoryStats[cat].total++;
    if (r.passed) categoryStats[cat].passed++;
  });

  console.log(`\nBy Category:`);
  Object.entries(categoryStats).forEach(([cat, stats]) => {
    const pct = ((stats.passed / stats.total) * 100).toFixed(0);
    console.log(`  ${cat}: ${stats.passed}/${stats.total} (${pct}%)`);
  });
}

async function saveResults(results: BenchmarkResult[]): Promise<void> {
  const outputPath = path.join(__dirname, '../benchmark-results.json');
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed results saved to: ${outputPath}`);
}

async function loadConfig(configPath?: string): Promise<Config> {
  // For now, return a mock config
  // TODO: Load from actual config file
  return {
    rules: {
      file_types: {},
      directory_map: {},
      voice: { filler_words: ['um', 'uh', 'like'] },
    },
    system: {
      ollama_host: 'http://localhost:11434',
      models: {
        gemma3: { path: 'gemma3:4b', temperature: 0.3 },
        'qwen-coder': { path: 'qwen2.5-coder:7b', temperature: 0.2 },
      },
      routing: {
        level0_confidence: 1.0,
        level1_confidence: 0.80,
        level2_confidence: 0.70,
        fallback: 'ask_user',
      },
      cache: {
        enabled: true,
        ttl_hours: 24,
        max_entries: 1000,
      },
    },
    skills: {},
  } as any;
}

// Run benchmark
const configArg = process.argv[2];
runBenchmark(configArg).catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
