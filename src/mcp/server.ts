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
 * Register available tools
 *
 * 3 consolidated tools (replaces 10+ granular operations):
 * 1. review_code: Lint + constitutional checking + fixes
 * 2. organize_files: Rename + move + analyze operations
 * 3. research_context: Query + change detection + keyword extraction
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [reviewCodeMeta, organizeFilesMeta, researchContextMeta],
  };
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
