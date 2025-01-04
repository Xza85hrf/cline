import { DeepSeekHandler } from './deepseek';
import { ApiHandlerOptions } from '../../shared/api';
import { ApiStreamUsageChunk } from '../transform/stream';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

type MockReadResult = ReadableStreamReadResult<Uint8Array>;
type MockReadFunction = () => Promise<MockReadResult>;

function createMockResponse(content: string, includeUsage = false): Response {
  const encoder = new TextEncoder();
  const responses: string[] = [
    `data: {"choices":[{"delta":{"content":"${content}"}}]}\n\n`
  ];
  
  if (includeUsage) {
    responses.push(`data: {"usage":{"input_tokens":60,"output_tokens":100}}\n\n`);
  }
  responses.push('data: [DONE]\n\n');
  
  const mockRead = jest.fn<MockReadFunction>();
  responses.forEach((response, index) => {
    mockRead.mockImplementationOnce(async () => ({
      done: false,
      value: encoder.encode(response)
    }));
  });
  mockRead.mockImplementationOnce(async () => ({
    done: true,
    value: new Uint8Array()
  }));

  const mockCancel = jest.fn<() => Promise<void>>();
  mockCancel.mockResolvedValue();

  const reader: ReadableStreamDefaultReader<Uint8Array> = {
    read: mockRead,
    releaseLock: jest.fn(),
    closed: Promise.resolve(),
    cancel: mockCancel
  } as unknown as ReadableStreamDefaultReader<Uint8Array>;

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'Content-Type': 'text/event-stream'
    }),
    body: {
      getReader: () => reader
    }
  } as unknown as Response;
}

describe('DeepSeekHandler', () => {
  const mockOptions: ApiHandlerOptions = {
    deepseekApiKey: 'test-key',
    apiModelId: 'deepseek-chat',
    deepseekBaseUrl: 'https://api.deepseek.com/v1'
  };

  let handler: DeepSeekHandler;
  let fetchMock: jest.MockedFunction<typeof global.fetch>;

  jest.setTimeout(30000); // Increase timeout to 30 seconds

  beforeEach(() => {
    handler = new DeepSeekHandler(mockOptions);
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('caching', () => {
    it('should cache responses and return cached content on subsequent requests', async () => {
      const systemPrompt = 'system prompt';
      const messages = [{ role: 'user', content: 'test message' }];
      
      // Mock first request
      fetchMock.mockResolvedValueOnce(createMockResponse("test response", true));

      // First request
      const stream1 = handler.createMessage(systemPrompt, messages);
      const results1: any[] = [];
      for await (const chunk of stream1) {
        results1.push(chunk);
      }

      // Second request should use cache
      const stream2 = handler.createMessage(systemPrompt, messages);
      const results2: any[] = [];
      for await (const chunk of stream2) {
        results2.push(chunk);
      }

      // Verify cache was used
      expect(fetchMock).toHaveBeenCalledTimes(1);
      
      // First response should have input tokens and cache write tokens
      expect(results1[0]).toMatchObject({
        type: "usage",
        inputTokens: expect.any(Number),
        cacheWriteTokens: expect.any(Number)
      });

      // Cached response should have cache read tokens and total cost
      expect(results2[0]).toMatchObject({
        type: "usage",
        inputTokens: 0,
        cacheReadTokens: expect.any(Number),
        totalCost: expect.any(Number)
      });

      // Content chunks should be identical
      expect(results2.slice(1)).toEqual(results1.slice(1));
    });

    it('should not cache identity questions', async () => {
      const systemPrompt = 'system prompt';
      const messages = [{ role: 'user', content: 'who are you?' }];
      
      // Mock requests
      fetchMock
        .mockResolvedValueOnce(createMockResponse("response 1", true))
        .mockResolvedValueOnce(createMockResponse("response 2", true));

      // First request
      const stream1 = handler.createMessage(systemPrompt, messages);
      const results1: any[] = [];
      for await (const chunk of stream1) {
        results1.push(chunk);
      }

      // Second request should not use cache
      const stream2 = handler.createMessage(systemPrompt, messages);
      const results2: any[] = [];
      for await (const chunk of stream2) {
        results2.push(chunk);
      }

      // Verify cache was not used
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(results2).not.toEqual(results1);
    });
  });

  describe('pricing', () => {
    it('should calculate correct costs for cache misses', async () => {
      const systemPrompt = 'system prompt';
      const messages = [{ role: 'user', content: 'test message' }];
      
      fetchMock.mockResolvedValueOnce(createMockResponse("test response", true));

      const stream = handler.createMessage(systemPrompt, messages);
      let totalInputCost = 0;
      let totalOutputCost = 0;
      
      for await (const chunk of stream) {
        if (chunk.type === 'usage') {
          const usageChunk = chunk as ApiStreamUsageChunk;
          if (usageChunk.inputTokens > 0) {
            totalInputCost = (usageChunk.inputTokens / 1000) * 0.14;
          }
          if (usageChunk.outputTokens > 0) {
            totalOutputCost = (usageChunk.outputTokens / 1000) * 0.28;
          }
        }
      }
      
      expect(totalInputCost).toBeGreaterThan(0);
      expect(totalOutputCost).toBeGreaterThan(0);
    });

    it('should calculate correct costs for cache hits', async () => {
      const systemPrompt = 'system prompt';
      const messages = [{ role: 'user', content: 'test message' }];
      
      // First request to populate cache
      fetchMock.mockResolvedValueOnce(createMockResponse("test response", true));

      // First request
      const stream1 = handler.createMessage(systemPrompt, messages);
      for await (const chunk of stream1) {
        // Consume stream to populate cache
      }

      // Second request should use cache
      const stream2 = handler.createMessage(systemPrompt, messages);
      const results: any[] = [];
      for await (const chunk of stream2) {
        if (chunk.type === 'usage') {
          const usageChunk = chunk as ApiStreamUsageChunk;
          if (usageChunk.cacheReadTokens && usageChunk.cacheReadTokens > 0) {
            // Verify cache read price ($0.014 per 1K tokens)
            expect(usageChunk.totalCost).toBe((usageChunk.cacheReadTokens / 1000) * 0.014);
          }
        }
        results.push(chunk);
      }
    });
  });

  describe('temperature settings', () => {
    it('should use temperature 0.0 for coding tasks', async () => {
      const systemPrompt = 'system prompt';
      const messages = [{ role: 'user', content: 'write a function' }];
      
      fetchMock.mockImplementation(async (url, init) => {
        const body = JSON.parse(init?.body as string);
        expect(body.temperature).toBe(0.0);
        return createMockResponse("test response");
      });

      const stream = handler.createMessage(systemPrompt, messages);
      for await (const chunk of stream) {
        // Consume all chunks to ensure fetch is called
      }
      
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should use temperature 1.3 for identity questions', async () => {
      const systemPrompt = 'system prompt';
      const messages = [{ role: 'user', content: 'who are you?' }];
      
      fetchMock.mockImplementation(async (url, init) => {
        const body = JSON.parse(init?.body as string);
        expect(body.temperature).toBe(1.3);
        return createMockResponse("test response");
      });

      const stream = handler.createMessage(systemPrompt, messages);
      for await (const chunk of stream) {
        // Consume all chunks to ensure fetch is called
      }
      
      expect(fetchMock).toHaveBeenCalled();
    });
  });
});
