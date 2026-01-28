import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

export function createRetryClient(): AxiosInstance {
  const client = axios.create({
    timeout: 10000
  });

  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      // Retry on network errors
      if (axiosRetry.isNetworkError(error)) {
        return true;
      }

      // Retry on 429 (rate limit) and 5xx errors
      if (error.response) {
        const status = error.response.status;
        return status === 429 || status >= 500;
      }

      return false;
    }
  });

  return client;
}
