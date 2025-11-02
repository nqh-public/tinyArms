/**
 * Research Context Tool
 * Location: apps/tinyArms/src/mcp/tools/research-context.ts
 *
 * @what Consolidated research/query tool (replaces query_system, analyze_changes, extract_keywords)
 * @why Multi-source synthesis in one call, reduces agent round-trips
 * @exports researchContext function and researchContextMeta schema
 *
 * Implements: Anthropic's context-aware architecture
 * - Search across constitution, filesystem, logs in one call
 * - Return only relevant excerpts (not full files)
 * - Confidence scores for ranking
 * - Change detection with time-based filtering
 */

import type {
  Finding,
  ResearchContextInput,
  ResearchContextOutput,
  ToolResponse,
} from '@/mcp/types';

const DETAILED_MULTIPLIER = 1.5;
const CONCISE_MULTIPLIER = 0.8;
const CHARS_PER_TOKEN = 4;
const MULTI_SOURCE_THRESHOLD = 2;

/**
 * Research context from multiple sources
 *
 * Consolidates:
 * - query_system: Natural language queries
 * - analyze_changes: Markdown change detection
 * - extract_keywords: Intent extraction
 */
export async function researchContext(
  input: ResearchContextInput
): Promise<ToolResponse<ResearchContextOutput>> {
  const startTime = Date.now();

  // Validate input
  if (!input.query || input.query.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'No query provided',
        suggestion: 'Provide a natural language query (e.g., "What changed in Principle VI?")',
      },
      metadata: {
        latencyMs: Date.now() - startTime,
        level: 'Level 0: Validation',
        tokensUsed: 0,
      },
    };
  }

  // Default sources: search everything
  const sources = input.sources || ['constitution', 'filesystem', 'logs'];

  const isDetailed = input.response_format === 'detailed';

  try {
    // TODO: Implement actual research logic
    // This is a placeholder for the tiered routing system
    //
    // Flow:
    // 1. Level 1: Semantic search (embedding-based)
    // 2. Level 2: Analyze findings with AI
    // 3. Level 3: Deep multi-source synthesis (if needed)
    //
    // Sources:
    // - constitution: .specify/memory/constitution.md
    // - filesystem: Watch paths, recent changes
    // - logs: tinyArms execution logs

    const findings: Finding[] = [
      // Placeholder example
      {
        source: '.specify/memory/constitution.md',
        content:
          'Principle VI: Brutal Honesty - State problems bluntly with specific reasons. No sugar coating.',
        relevance: 0.92,
        context: 'Lines 277-306',
      },
    ];

    // Apply time filter if provided
    const filteredFindings = input.since
      ? findings.filter(() => isRecentChange())
      : findings;

    const output: ResearchContextOutput = {
      findings: filteredFindings,
      summary: isDetailed
        ? `Found ${filteredFindings.length} relevant findings across ${sources.length} sources for query: "${input.query}". Top match: ${filteredFindings[0]?.source || 'none'} (${Math.round((filteredFindings[0]?.relevance || 0) * 100)}% confidence).`
        : `${filteredFindings.length} findings from ${sources.join(', ')}`,
      sources: [...new Set(filteredFindings.map((f) => f.source))],
    };

    return {
      success: true,
      data: output,
      metadata: {
        latencyMs: Date.now() - startTime,
        level: determineLevel(input),
        tokensUsed: estimateTokens(output, isDetailed),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'RESEARCH_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestion:
          'Check that sources are accessible. Try narrowing your query or specifying fewer sources.',
      },
      metadata: {
        latencyMs: Date.now() - startTime,
        level: 'Error',
        tokensUsed: 0,
      },
    };
  }
}

/**
 * Check if finding matches time filter
 * Placeholder implementation
 */
function isRecentChange(): boolean {
  // TODO: Implement actual timestamp checking with finding and since parameters
  // For now, accept all findings
  return true;
}

/**
 * Determine which tier handled this request
 */
function determineLevel(input: ResearchContextInput): string {
  const sourceCount = (input.sources || []).length;

  // Single source = Level 1 (semantic search)
  if (sourceCount === 1) {
    return 'Level 1: Embedding Routing';
  }

  // Multiple sources = Level 3 (research synthesis)
  if (sourceCount > MULTI_SOURCE_THRESHOLD) {
    return 'Level 3: Research Agent';
  }

  // Default: Level 2
  return 'Level 2: Code Analysis';
}

/**
 * Estimate token usage
 */
function estimateTokens(
  output: ResearchContextOutput,
  detailed: boolean
): number {
  const json = JSON.stringify(output);
  const chars = json.length;
  const multiplier = detailed ? DETAILED_MULTIPLIER : CONCISE_MULTIPLIER;
  return Math.ceil((chars / CHARS_PER_TOKEN) * multiplier);
}

/**
 * Tool metadata for MCP registration
 */
export const researchContextMeta = {
  name: 'research_context',
  description:
    'Research information across constitution, filesystem, and logs. Returns relevant findings with confidence scores. Consolidates querying, change detection, and keyword extraction.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Natural language query (e.g., "What changed in Principle VI?", "Files modified today")',
      },
      sources: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['constitution', 'filesystem', 'logs'],
        },
        description:
          'Where to search. Default: all sources. Narrow for faster results.',
        default: ['constitution', 'filesystem', 'logs'],
      },
      response_format: {
        type: 'string',
        enum: ['concise', 'detailed'],
        description: 'Output verbosity. Concise: top findings. Detailed: full context.',
        default: 'concise',
      },
      max_tokens: {
        type: 'number',
        description: 'Max tokens in response. Default: 5000, Max: 25000',
        default: 5000,
        maximum: 25000,
      },
      since: {
        type: 'string',
        description:
          'ISO date for change detection (e.g., "2025-10-27T00:00:00Z"). Only return changes after this timestamp.',
        optional: true,
      },
    },
    required: ['query'],
  },
};
