/**
 * TinyArms MCP Server
 * Location: apps/tinyArms/src/mcp/server.ts
 *
 * @what Model Context Protocol server exposing tinyArms capabilities to AI agents
 * @why Enable Claude Code, Aider, Cursor to use local AI without cloud APIs
 * @exports MCP server with 3 consolidated tools (review_code, organize_files, research_context)
 *
 * Implements: Anthropic's "Writing Tools for Agents" principles
 * - Consolidated workflows (3 tools, not 10+)
 * - Token budget enforcement (25k max like Claude Code)
 * - Response format control (concise vs detailed)
 * - Semantic identifiers (principle names, not UUIDs)
 * - Actionable error messages
 *
 * Architecture:
 * - Tools registered via MCP SDK
 * - Input validation before routing
 * - Tiered routing for efficiency (Level 0-3)
 * - Token counting and budget enforcement
 * - Metadata tracking (latency, tier used, tokens consumed)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Tool implementations
import { organizeFiles, organizeFilesMeta } from './tools/organize-files.js';
import {
  researchContext,
  researchContextMeta,
} from './tools/research-context.js';
import { reviewCode, reviewCodeMeta } from './tools/review-code.js';

// Skill registry for token budget enforcement
import { getSkillRegistry } from '@/skills/index.js';

/**
 * Initialize skill registry on server start
 * Enables token budget lookup for all tools
 */
let skillRegistry: ReturnType<typeof getSkillRegistry> | null = null;
try {
  skillRegistry = getSkillRegistry();
  console.error(`✅ Loaded ${skillRegistry.getSkillNames().length} skills`);
  console.error(`📊 Total token budget: ${skillRegistry.getTotalTokenBudget().toLocaleString()}`);
} catch (error) {
  console.error('⚠️ Failed to load skill registry:', error);
}

/**
 * Initialize MCP Server
 */
const server = new Server(
  {
    name: 'tinyarms',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Register available tools with skill metadata
 *
 * 3 consolidated tools (replaces 10+ granular operations):
 * 1. review_code: Lint + constitutional checking + fixes
 * 2. organize_files: Rename + move + analyze operations
 * 3. research_context: Query + change detection + keyword extraction
 *
 * Token budgets from skill registry:
 * - code-linting-fast: 15,000 tokens (review_code)
 * - file-naming: 5,000 tokens (organize_files, when implemented)
 * - markdown-analysis: 10,000 tokens (research_context, when implemented)
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Enhance tool descriptions with skill metadata
  const tools = [reviewCodeMeta, organizeFilesMeta, researchContextMeta];

  if (skillRegistry) {
    // Annotate review_code with code-linting skill budget
    const lintingSkill = skillRegistry.getSkill('code-linting-fast');
    if (lintingSkill) {
      tools[0] = {
        ...reviewCodeMeta,
        description: `${reviewCodeMeta.description} (Token budget: ${lintingSkill.metadata.token_budget.toLocaleString()})`,
      };
    }
  }

  return { tools };
});

/**
 * Handle tool calls
 *
 * Flow:
 * 1. Validate tool exists
 * 2. Route to appropriate handler
 * 3. Enforce token budgets
 * 4. Return structured response with metadata
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'review_code':
        return await reviewCode(args);

      case 'organize_files':
        return await organizeFiles(args);

      case 'research_context':
        return await researchContext(args);

      default:
        return {
          success: false,
          error: {
            code: 'UNKNOWN_TOOL',
            message: `Tool "${name}" not found`,
            suggestion:
              'Available tools: review_code, organize_files, research_context',
          },
          metadata: {
            latencyMs: 0,
            level: 'Error',
            tokensUsed: 0,
          },
        };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check server logs for details. Verify input schema.',
      },
      metadata: {
        latencyMs: 0,
        level: 'Error',
        tokensUsed: 0,
      },
    };
  }
});

/**
 * Start server
 *
 * Transport: stdio (standard for MCP servers)
 * Claude Code/Aider/Cursor connect via command: `node /path/to/server.js`
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('TinyArms MCP Server running on stdio');
  console.error('Tools available: review_code, organize_files, research_context');
  console.error('Token budget: 25k max per response (Anthropic standard)');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
