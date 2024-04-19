import { useDebounce } from '@uidotdev/usehooks';
import { DependencyList, EffectCallback, useEffect, useRef, useState } from 'react';

export const useDebounceState = <T,>(initialValue: T, delay = 300) => {
  const [state, setState] = useState<T>(initialValue);
  const debounceState = useDebounce(state, delay);
  return { state, debounceState, setState };
};
export const useEffectSkipFirst = (effect: EffectCallback, deps?: DependencyList) => {
  const isFirst = useRef(true);
  useEffect(() => {
    if (!isFirst.current) {
      effect();
    }
    isFirst.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
