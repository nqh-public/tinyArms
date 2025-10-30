/**
 * Utility for checking Ollama model availability and pulling models
 * Location: apps/tinyArms/src/utils/model-checker.ts
 */

import { Ollama } from 'ollama';

export class ModelChecker {
  private ollama = new Ollama();

  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.ollama.list();
      return models.models.some((m) => m.name === modelName);
    } catch (error) {
      console.error('Error checking model availability:', error);
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const models = await this.ollama.list();
      return models.models.map((m) => m.name);
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  async pullModelIfNeeded(modelName: string): Promise<void> {
    if (await this.isModelAvailable(modelName)) {
      console.log(`✅ Model ${modelName} already available`);
      return;
    }

    console.log(`📥 Pulling ${modelName} (1.9GB, ~5-10 min)...`);
    console.log(`This is a one-time download. Future runs will be instant.`);

    try {
      await this.ollama.pull({ model: modelName, stream: false });
      console.log(`✅ Model ${modelName} ready`);
    } catch (error) {
      throw new Error(`Failed to pull model ${modelName}: ${error}`);
    }
  }
}
