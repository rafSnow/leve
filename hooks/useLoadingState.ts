import { useState, useCallback, useMemo } from 'react';

interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
}

interface LoadingActions {
  setLoading: (isLoading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

interface ComputedStates {
  hasError: boolean;
  isIdle: boolean;
  canReset: boolean;
  isActive: boolean;
  status: 'idle' | 'loading' | 'error' | 'success';
}

interface LoadingStateReturn extends LoadingState, LoadingActions, ComputedStates {}

export function useLoadingState(initialMessage = 'Carregando...'): LoadingStateReturn {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    loadingMessage: initialMessage,
    error: null,
  });

  // ✅ MELHORIA 1: Actions memoizadas (já estavam boas)
  const setLoading = useCallback((isLoading: boolean, message?: string) => {
    setState(prev => ({
      ...prev,
      isLoading,
      loadingMessage: message || prev.loadingMessage,
      error: null,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      loadingMessage: initialMessage,
      error: null,
    });
  }, [initialMessage]);

  // ✅ MELHORIA 2: Actions agrupadas memoizadas
  const actions = useMemo((): LoadingActions => ({
    setLoading,
    setError,
    reset,
  }), [setLoading, setError, reset]);

  // ✅ MELHORIA 3: Computed states memoizados
  const computedStates = useMemo((): ComputedStates => ({
    hasError: !!state.error,
    isIdle: !state.isLoading && !state.error,
    canReset: state.isLoading || !!state.error,
    isActive: state.isLoading,
    status: state.error ? 'error' : state.isLoading ? 'loading' : 'idle',
  }), [state.isLoading, state.error]);

  // ✅ MELHORIA 4: Estado completo memoizado
  const loadingState = useMemo((): LoadingState => ({
    isLoading: state.isLoading,
    loadingMessage: state.loadingMessage,
    error: state.error,
  }), [state.isLoading, state.loadingMessage, state.error]);

  // ✅ MELHORIA 5: Retorno completo memoizado
  const returnValue = useMemo((): LoadingStateReturn => ({
    ...loadingState,
    ...actions,
    ...computedStates,
  }), [loadingState, actions, computedStates]);

  return returnValue;
}

// ✅ MELHORIA 6: Hook auxiliar para múltiplos loading states
export function useMultipleLoadingStates(
  initialStates: Record<string, string> = {}
) {
  const [states, setStates] = useState<Record<string, LoadingState>>(() => {
    const initial: Record<string, LoadingState> = {};

    Object.entries(initialStates).forEach(([key, message]) => {
      initial[key] = {
        isLoading: false,
        loadingMessage: message,
        error: null,
      };
    });

    return initial;
  });

  // ✅ Actions para múltiplos states memoizadas
  const setLoading = useCallback((key: string, isLoading: boolean, message?: string) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading,
        loadingMessage: message || prev[key]?.loadingMessage || 'Carregando...',
        error: null,
      },
    }));
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: false,
        error,
      },
    }));
  }, []);

  const reset = useCallback((key?: string) => {
    if (key) {
      setStates(prev => ({
        ...prev,
        [key]: {
          isLoading: false,
          loadingMessage: initialStates[key] || 'Carregando...',
          error: null,
        },
      }));
    } else {
      // Reset all states
      const resetStates: Record<string, LoadingState> = {};
      Object.entries(initialStates).forEach(([stateKey, message]) => {
        resetStates[stateKey] = {
          isLoading: false,
          loadingMessage: message,
          error: null,
        };
      });
      setStates(resetStates);
    }
  }, [initialStates]);

  // ✅ Global computed states memoizados
  const globalStates = useMemo(() => ({
    isAnyLoading: Object.values(states).some(state => state.isLoading),
    hasAnyError: Object.values(states).some(state => !!state.error),
    allIdle: Object.values(states).every(state => !state.isLoading && !state.error),
    loadingCount: Object.values(states).filter(state => state.isLoading).length,
    errorCount: Object.values(states).filter(state => !!state.error).length,
    totalStates: Object.keys(states).length,
  }), [states]);

  // ✅ Actions memoizadas
  const actions = useMemo(() => ({
    setLoading,
    setError,
    reset,
  }), [setLoading, setError, reset]);

  return {
    states,
    globalStates,
    ...actions,
  };
}

// ✅ MELHORIA 7: Hook para loading com timeout
export function useLoadingWithTimeout(
  initialMessage = 'Carregando...',
  timeoutMs = 30000
) {
  const loadingState = useLoadingState(initialMessage);

  // ✅ Timeout memoizado
  const startLoadingWithTimeout = useCallback((message?: string) => {
    loadingState.setLoading(true, message);

    const timeoutId = setTimeout(() => {
      loadingState.setError('Operação expirou. Tente novamente.');
    }, timeoutMs);

    // Retorna função para limpar timeout
    return () => clearTimeout(timeoutId);
  }, [loadingState.setLoading, loadingState.setError, timeoutMs]);

  // ✅ Retorno memoizado
  const returnValue = useMemo(() => ({
    ...loadingState,
    startLoadingWithTimeout,
    timeoutMs,
  }), [loadingState, startLoadingWithTimeout, timeoutMs]);

  return returnValue;
}

// ✅ MELHORIA 8: Hook para loading steps
export function useLoadingSteps(steps: string[] = []) {
  const [currentStep, setCurrentStep] = useState(0);
  const loadingState = useLoadingState();

  // ✅ Step actions memoizadas
  const stepActions = useMemo(() => ({
    nextStep: () => {
      setCurrentStep(prev => {
        const next = Math.min(prev + 1, steps.length - 1);
        if (next < steps.length) {
          loadingState.setLoading(true, steps[next]);
        }
        return next;
      });
    },

    previousStep: () => {
      setCurrentStep(prev => {
        const previous = Math.max(prev - 1, 0);
        loadingState.setLoading(true, steps[previous]);
        return previous;
      });
    },

    goToStep: (step: number) => {
      const validStep = Math.max(0, Math.min(step, steps.length - 1));
      setCurrentStep(validStep);
      loadingState.setLoading(true, steps[validStep]);
    },

    complete: () => {
      setCurrentStep(steps.length);
      loadingState.setLoading(false);
    },
  }), [steps, loadingState.setLoading]);

  // ✅ Step info memoizada
  const stepInfo = useMemo(() => ({
    currentStep,
    totalSteps: steps.length,
    currentMessage: steps[currentStep] || '',
    progress: steps.length > 0 ? (currentStep / steps.length) * 100 : 0,
    isLastStep: currentStep === steps.length - 1,
    isFirstStep: currentStep === 0,
    isComplete: currentStep >= steps.length,
  }), [currentStep, steps]);

  return {
    ...loadingState,
    ...stepActions,
    ...stepInfo,
  };
}