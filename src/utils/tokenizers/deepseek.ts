import { spawn } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

export class DeepSeekTokenizer {
  private static pythonPath: string | undefined;

  private static async getPythonPath(): Promise<string> {
    if (this.pythonPath) {
      return this.pythonPath;
    }

    // Try to find Python in common locations
    const pythonCommands = ['python3', 'python'];
    for (const cmd of pythonCommands) {
      try {
        const process = spawn(cmd, ['--version']);
        await new Promise((resolve) => process.on('exit', resolve));
        if (process.exitCode === 0) {
          this.pythonPath = cmd;
          return cmd;
        }
      } catch (e) {
        // Continue to next command if this one fails
        continue;
      }
    }

    throw new Error('Python not found. Please install Python 3.x');
  }

  public static async countTokens(text: string): Promise<number> {
    try {
      const pythonPath = await this.getPythonPath();
      const scriptPath = path.join(__dirname, 'deepseek_tokenizer.py');

      return new Promise((resolve, reject) => {
        const process = spawn(pythonPath, [scriptPath]);
        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('error', (error) => {
          reject(new Error(`Failed to start Python process: ${error.message}`));
        });

        process.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            if (result.error) {
              reject(new Error(`Tokenizer error: ${result.error}`));
              return;
            }
            resolve(result.count);
          } catch (e) {
            reject(new Error(`Failed to parse tokenizer output: ${e}`));
          }
        });

        // Send input to the Python script
        process.stdin.write(JSON.stringify({ text }));
        process.stdin.end();
      });
    } catch (error) {
      console.error('DeepSeek tokenizer error:', error);
      throw error;
    }
  }

  public static async calculateMessageTokens(messages: Array<{
    role: string;
    content: string | Array<{ type: string; text?: string }>;
  }>, systemPrompt?: string): Promise<{ inputTokens: number; outputTokens: number }> {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Count system prompt tokens if present
    if (systemPrompt) {
      totalInputTokens += await this.countTokens(systemPrompt);
    }

    // Process each message
    for (const msg of messages) {
      let content = '';
      if (Array.isArray(msg.content)) {
        content = msg.content
          .map((block) => (block.type === 'text' && block.text ? block.text : ''))
          .join('\n')
          .trim();
      } else {
        content = msg.content;
      }

      const tokens = await this.countTokens(content);
      if (msg.role === 'assistant') {
        totalOutputTokens += tokens;
      } else {
        totalInputTokens += tokens;
      }
    }

    return {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    };
  }
}
