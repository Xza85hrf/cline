import { ApiHandler } from '../index';
import { ApiHandlerOptions } from '../../shared/api';
import { ApiStream, ApiStreamChunk, ApiStreamTextChunk, ApiStreamUsageChunk } from '../transform/stream';
import { ModelInfo } from '../../shared/api';
import { DeepSeekTokenizer } from '../../utils/tokenizers/deepseek';

export class DeepSeekHandler implements ApiHandler {
  private apiKey: string;
  private baseUrl: string;
  private modelId: string;
  private cache: Map<string, { response: ApiStreamChunk[]; timestamp: number }> = new Map();
  private readonly cacheDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(options: ApiHandlerOptions) {
    if (!options.deepseekApiKey) {throw new Error('DeepSeek API key is required');}
    this.apiKey = options.deepseekApiKey;
    this.baseUrl = options.deepseekBaseUrl || 'https://api.deepseek.com/v1';
    this.modelId = options.apiModelId || 'deepseek-chat';
  }

  private lastRequestTime = 0;
  private readonly rateLimit = 60; // requests per minute
  private readonly rateLimitWindow = 60 * 1000; // 1 minute in milliseconds

  private async checkRateLimit() {
    const now = Date.now();
    if (now - this.lastRequestTime < this.rateLimitWindow / this.rateLimit) {
      const waitTime = (this.rateLimitWindow / this.rateLimit) - (now - this.lastRequestTime);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  async *createMessage(systemPrompt: string, messages: Array<{
    role: string;
    content: string | Array<{ type: string; text?: string }>;
  }>): ApiStream {
    await this.checkRateLimit();

    // Only use cache for complex programming tasks, not simple identity questions
    const isIdentityQuestion = messages.some(msg => 
      typeof msg.content === 'string' && 
      msg.content.toLowerCase().includes('who are you')
    );

    // Generate cache key from messages and system prompt
    const cacheKey = JSON.stringify({
      systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: isIdentityQuestion ? Date.now() : undefined // Add timestamp only for identity questions
      }))
    });

    if (!isIdentityQuestion) {
      // Check cache first
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse && Date.now() - cachedResponse.timestamp < this.cacheDuration) {
        // Calculate tokens for cached response
        try {
          const { inputTokens } = await DeepSeekTokenizer.calculateMessageTokens(
            messages,
            systemPrompt
          );
          yield {
            type: "usage",
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: inputTokens,
            totalCost: (inputTokens / 1000) * 0.014 // Calculate cost for cache reads
          } as ApiStreamUsageChunk;
          
          // Return cached response
          for (const chunk of cachedResponse.response) {
            yield chunk;
          }
          return;
        } catch (error) {
          console.error('Failed to process cached response:', error);
          // Fall through to make fresh API request
        }
      }
    }

    // Calculate token usage offline before making the API request
    try {
      const { inputTokens } = await DeepSeekTokenizer.calculateMessageTokens(
        messages,
        systemPrompt
      );
      yield {
        type: "usage",
        inputTokens,
        outputTokens: 0, // Initial output tokens are 0 since response hasn't started
        cacheWriteTokens: inputTokens // Track tokens being written to cache
      } as ApiStreamUsageChunk;
    } catch (error) {
      console.error('Failed to calculate tokens offline:', error);
      // Continue with API request even if token calculation fails
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    // Format messages to match DeepSeek's expected format
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : 
        msg.content
          .filter(block => block.type === 'text' && block.text)
          .map(block => block.text)
          .join('\n')
          .trim()
    }));

    if (systemPrompt) {
      formattedMessages.unshift({ role: 'system', content: systemPrompt });
    }

    const body = {
      model: this.modelId,
      messages: formattedMessages,
      stream: true,
      temperature: isIdentityQuestion ? 1.3 : 0.0 // 1.3 for general conversation, 0.0 for coding tasks
    };

    let response;
    try {
      const url = `${this.baseUrl}/chat/completions`;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
      } catch (fetchError) {
        throw new Error(`DeepSeek API request failed: Network error - ${fetchError.message} (URL: ${url})`);
      }

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
          
          // Handle specific error codes with more detailed messages
          if (response.status === 422) {
            errorMessage = `Unprocessable Entity: ${errorMessage}. Please check the message format and ensure all required fields are present.`;
          } else if (response.status === 400) {
            errorMessage = `Bad Request: ${errorMessage}. Please verify the request parameters.`;
          } else if (response.status === 401) {
            errorMessage = `Unauthorized: ${errorMessage}. Please check your API key.`;
          } else if (response.status === 403) {
            errorMessage = `Forbidden: ${errorMessage}. You don't have permission to access this resource.`;
          } else if (response.status === 429) {
            // Rate limit exceeded
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return yield* this.createMessage(systemPrompt, messages);
          }
        } catch (e) {
          // If we can't parse the error JSON, provide more context
          errorMessage = `${errorMessage} (Status: ${response.status}, URL: ${url})`;
        }
        throw new Error(`DeepSeek API error: ${errorMessage}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error; // Re-throw the error with our custom messages
      }
      throw new Error(`DeepSeek API request failed: Unknown error occurred`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to read response stream');
    }

    // Store response chunks for caching
    const responseChunks: ApiStreamChunk[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {break;}

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        const message = line.replace(/^data: /, '');
        if (message === '[DONE]') {
          // Only store in cache if it's not an identity question
          if (!isIdentityQuestion) {
            this.cache.set(cacheKey, {
              response: responseChunks,
              timestamp: Date.now()
            });

            // Clean up old cache entries
            for (const [key, value] of this.cache.entries()) {
              if (Date.now() - value.timestamp > this.cacheDuration) {
                this.cache.delete(key);
              }
            }
          }
          return;
        }

        try {
          const data = JSON.parse(message);
          
          // Handle different types of responses
          if (data.error) {
            throw new Error(`DeepSeek API error: ${data.error.message || data.error}`);
          }
          
          if (data.choices?.[0]?.delta?.content) {
            const content = data.choices[0].delta.content;
            if (content) {
              const textChunk: ApiStreamTextChunk = {
                type: "text",
                text: content
              };
              responseChunks.push(textChunk);
              yield textChunk;

              // Track output tokens using offline tokenizer
              try {
                const tokens = await DeepSeekTokenizer.countTokens(content);
                const usageChunk: ApiStreamUsageChunk = {
                  type: "usage",
                  inputTokens: 0, // Input tokens already reported
                  outputTokens: tokens,
                  totalCost: (tokens / 1000) * 0.28 // Calculate cost for output tokens
                };
                responseChunks.push(usageChunk);
                yield usageChunk;
              } catch (error) {
                console.error('Failed to count output tokens:', error);
              }
            }
          }

          // Handle usage information if present
          if (data.usage) {
            const inputTokens = data.usage.prompt_tokens || 0;
            const outputTokens = data.usage.completion_tokens || 0;
            const usageChunk: ApiStreamUsageChunk = {
              type: "usage",
              inputTokens,
              outputTokens,
              totalCost: (inputTokens / 1000) * 0.14 + (outputTokens / 1000) * 0.28
            };
            responseChunks.push(usageChunk);
            yield usageChunk;
          }
        } catch (error) {
          console.error('Error parsing DeepSeek response:', error);
        }
      }
    }
  }

  getModel(): { id: string; info: ModelInfo } {
    const models = {
      'deepseek-chat': {
        name: "deepseek-chat",
        provider: "deepseek",
        maxTokens: 8192,
        contextWindow: 64_000,
        supportsImages: false,
        supportsComputerUse: true,
        supportsPromptCache: true,
        inputPrice: 0.14,          // Discounted cache miss price until Feb 8, 2025
        outputPrice: 0.28,         // Discounted price until Feb 8, 2025
        cacheReadsPrice: 0.014,    // Discounted cache hit price until Feb 8, 2025
        tokensPerSecond: 60,
        architecture: "MoE",
        activatedParams: 37_000_000_000,
        totalParams: 671_000_000_000,
        description: "DeepSeek-V3 Chat - 671B MoE model optimized for fast (60 tokens/sec) and high-quality responses."
      },
      'deepseek-coder': {
        name: "deepseek-coder",
        provider: "deepseek",
        maxTokens: 8192,
        contextWindow: 64_000,
        supportsImages: false,
        supportsComputerUse: true,
        supportsPromptCache: true,
        inputPrice: 0.14,          // Using same pricing as chat model
        outputPrice: 0.28,
        cacheReadsPrice: 0.014,
        tokensPerSecond: 60,
        architecture: "MoE",
        activatedParams: 37_000_000_000,
        totalParams: 671_000_000_000,
        description: "DeepSeek-V3 Coder - Specialized for programming tasks with enhanced capabilities."
      }
    };
    return {
      id: this.modelId,
      info: models[this.modelId as keyof typeof models] || models['deepseek-chat']
    };
  }
}
