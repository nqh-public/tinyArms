// src/types.ts
export interface Config {
  skills: Record<string, SkillConfig>;
  system: SystemConfig;
  rules: RulesConfig;
}

export interface SkillConfig {
  enabled: boolean;
  schedule?: string;
  trigger?: 'manual' | 'scheduled' | 'watch';
  watch_paths?: string[];
  model: string;
  description: string;
  batch_size?: number;
  constitution_path?: string;
  max_file_size_kb?: number;
  transcription_path?: string;
}

export interface SystemConfig {
  ollama_host: string;
  log_level: 'debug' | 'info' | 'warn' | 'error';
  require_ac_power: boolean;
  max_memory_mb: number;
  notification: boolean;
  models: Record<string, ModelConfig>;
  routing: RoutingConfig;
  cache: CacheConfig;
  paths: PathsConfig;
}

export interface ModelConfig {
  path: string;
  context_length: number;
  temperature: number;
}

export interface RoutingConfig {
  level0_confidence: number;
  level1_confidence: number;
  level2_confidence: number;
  fallback: 'ask_user' | 'skip' | 'error';
}

export interface CacheConfig {
  enabled: boolean;
  ttl_hours: number;
  max_entries: number;
}

export interface PathsConfig {
  logs: string;
  database: string;
  skills: string;
  cache: string;
}

export interface RulesConfig {
  file_types: Record<string, FileTypeRule>;
  filename_patterns: FilenamePatterns;
}

export interface FileTypeRule {
  extensions: string[];
  keywords?: string[];
  source_paths?: string[];
  destination: string;
}

export interface FilenamePatterns {
  remove: string[];
  replace: Array<{ pattern: string; with: string }>;
}

// Router types
export interface RouterLevel {
  name: string;
  execute: (input: RouterInput) => Promise<RouterResult>;
  confidenceThreshold: number;
}

export interface RouterInput {
  skill: string;
  data: any;
  context?: Record<string, any>;
}

export interface RouterResult {
  output: any;
  confidence: number;
  level: string;
  latencyMs: number;
  cached?: boolean;
}

// Skill execution types
export interface SkillResult {
  status: 'success' | 'error' | 'skipped' | 'needs_review';
  skill: string;
  timestamp: string;
  results: any[];
  stats: SkillStats;
  errors?: string[];
}

export interface SkillStats {
  total_items: number;
  processed: number;
  skipped: number;
  errors: number;
  duration_ms: number;
}

// MCP types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

// Database types
export interface TaskHistory {
  id: number;
  skill: string;
  timestamp: string;
  status: string;
  input: string;
  output: string;
  level: string;
  confidence: number;
  duration_ms: number;
}

export interface CacheEntry {
  id: number;
  key: string;
  value: string;
  created_at: string;
  expires_at: string;
}

// CLI types
export interface CLIOptions {
  json?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  config?: string;
}

export interface CLICommand {
  name: string;
  description: string;
  options?: CLIOptions;
  action: (...args: any[]) => Promise<void>;
}
