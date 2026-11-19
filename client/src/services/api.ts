import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'Unable to complete your request. Please try again.';
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
