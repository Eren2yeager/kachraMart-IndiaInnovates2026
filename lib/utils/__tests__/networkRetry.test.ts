import { retryWithBackoff, fetchWithRetry, isOnline } from '../networkRetry';

describe('networkRetry', () => {
  describe('retryWithBackoff', () => {
    it('returns result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('throws error after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('persistent failure'));

      await expect(
        retryWithBackoff(fn, { maxRetries: 2, initialDelay: 10 })
      ).rejects.toThrow('persistent failure');
      
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('does not retry when shouldRetry returns false', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('no retry'));

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 3,
          initialDelay: 10,
          shouldRetry: () => false,
        })
      ).rejects.toThrow('no retry');
      
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it('calls onRetry callback on each retry', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const onRetry = jest.fn();

      await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
        onRetry,
      });
      
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
      expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error));
    });

    it('uses exponential backoff delays', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      
      await retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelay: 100,
        backoffMultiplier: 2,
      });
      
      const elapsed = Date.now() - startTime;
      
      // Should wait at least 100ms + 200ms = 300ms
      expect(elapsed).toBeGreaterThanOrEqual(300);
    });

    it('respects maxDelay cap', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      
      await retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelay: 1000,
        maxDelay: 500, // Cap at 500ms
        backoffMultiplier: 2,
      });
      
      const elapsed = Date.now() - startTime;
      
      // Should wait 500ms + 500ms (capped) = 1000ms, not 1000ms + 2000ms
      expect(elapsed).toBeLessThan(1500);
    });
  });

  describe('fetchWithRetry', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('returns response on success', async () => {
      const mockResponse = { ok: true, status: 200 } as Response;
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await fetchWithRetry('https://api.example.com', {}, { maxRetries: 2, initialDelay: 10 });
      
      expect(response).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on HTTP error status', async () => {
      const errorResponse = { ok: false, status: 500, statusText: 'Server Error' } as Response;
      const successResponse = { ok: true, status: 200 } as Response;
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const response = await fetchWithRetry('https://api.example.com', {}, { maxRetries: 2, initialDelay: 10 });
      
      expect(response).toBe(successResponse);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('throws error after max retries on persistent failure', async () => {
      const errorResponse = { ok: false, status: 500, statusText: 'Server Error' } as Response;
      (global.fetch as jest.Mock).mockResolvedValue(errorResponse);

      await expect(
        fetchWithRetry('https://api.example.com', {}, { maxRetries: 2, initialDelay: 10 })
      ).rejects.toThrow('HTTP 500');
      
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('isOnline', () => {
    it('returns true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(isOnline()).toBe(true);
    });

    it('returns false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      expect(isOnline()).toBe(false);
    });
  });
});
