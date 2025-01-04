import { ApiHandler } from "./index";
import { ModelInfo } from "../shared/api";
import type { ApiStreamTextChunk, ApiStreamUsageChunk } from "./transform/stream";

export interface BatchJob {
  id: string;
  requests: ApiRequest[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: ApiResponse[];
  createdAt: Date;
  completedAt?: Date;
}

export interface ApiRequest {
  prompt: string;
  modelId: string;
  parameters: Record<string, any>;
}

export interface ApiResponse {
  success: boolean;
  result?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class BatchProcessor {
  private handlers: Record<string, ApiHandler>;
  private maxConcurrentRequests: number;
  private retryLimit: number;

  constructor(handlers: ApiHandler[], options: { maxConcurrentRequests?: number, retryLimit?: number } = {}) {
    this.handlers = Object.fromEntries(handlers.map(handler => [handler.getModel().id, handler]));
    this.maxConcurrentRequests = options.maxConcurrentRequests || 5;
    this.retryLimit = options.retryLimit || 3;
  }

  async processBatch(job: BatchJob): Promise<BatchJob> {
    job.status = 'processing';
    const results: ApiResponse[] = [];
    const queue = [...job.requests];
    
    while (queue.length > 0) {
      const batch = queue.splice(0, this.maxConcurrentRequests);
      const batchResults = await Promise.all(
        batch.map(request => this.processRequest(request))
      );
      results.push(...batchResults);
      job.progress = (results.length / job.requests.length) * 100;
    }

    job.results = results;
    job.status = 'completed';
    job.completedAt = new Date();
    return job;
  }

  private async processRequest(request: ApiRequest, retryCount = 0): Promise<ApiResponse> {
    try {
      const handler = this.handlers[request.modelId];
      if (!handler) {
        throw new Error(`No handler found for model ${request.modelId}`);
      }

      let fullResponse = '';
      let usage = { inputTokens: 0, outputTokens: 0 };
      
      const stream = handler.createMessage(
        request.parameters.systemPrompt || '',
        [{ role: 'user', content: request.prompt }]
      );

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          fullResponse += chunk.text;
        }
        if (chunk.type === 'usage') {
          usage = {
            inputTokens: chunk.inputTokens,
            outputTokens: chunk.outputTokens
          };
        }
      }

      return {
        success: true,
        result: fullResponse,
        usage
      };
    } catch (error) {
      if (retryCount < this.retryLimit) {
        return this.processRequest(request, retryCount + 1);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public static createJob(requests: ApiRequest[]): BatchJob {
    return {
      id: crypto.randomUUID(),
      requests,
      status: 'pending',
      progress: 0,
      results: [],
      createdAt: new Date()
    };
  }
}
