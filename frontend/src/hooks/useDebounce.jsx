import { useEffect } from 'react';
import { useTimeout } from './useTimeout';

export const useDebounce = (callback, delay, deps) => {
  const { reset, clear } = useTimeout(async () => {
    try {
      await callback();
    } catch (error) {
      console.error('Error in debounced callback:', error);
    }
  }, delay);

  useEffect(reset, [...deps, reset]);
  useEffect(clear, []);
}