import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { storageService } from '../utils/Storage';

interface ErrorState {
  error: Error | null;
  isRecovering: boolean;
  retryCount: number;
  lastErrorTime: number;
}

interface UseErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  showUserFriendlyMessages?: boolean;
  logErrors?: boolean;
  onError?: (error: Error) => void;
  onRecover?: () => void;
}

// ✅ MELHORIA 1: Constants memoizados fora do hook
const DEFAULT_OPTIONS = {
  maxRetries: 3,
  retryDelay: 1000,
  showUserFriendlyMessages: true,
  logErrors: true,
};

const RECOVERABLE_ERRORS = ['network', 'timeout', 'storage', 'fetch'];

const ERROR_MESSAGE_MAPPINGS = [
  {
    keywords: ['network', 'fetch'],
    message: 'Problema de conexão. Verifique sua internet.',
  },
  {
    keywords: ['storage', 'asyncstorage'],
    message: 'Erro ao acessar dados locais. Tente novamente.',
  },
  {
    keywords: ['permission'],
    message: 'Permissão negada. Verifique as configurações.',
  },
  {
    keywords: ['timeout'],
    message: 'Operação demorou muito. Tente novamente.',
  },
  {
    keywords: ['parse', 'json'],
    message: 'Erro ao processar dados. Tente novamente.',
  },
];

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  // ✅ MELHORIA 2: Options memoizados
  const memoizedOptions = useMemo(() => ({
    ...DEFAULT_OPTIONS,
    ...options,
  }), [
    options.maxRetries,
    options.retryDelay,
    options.showUserFriendlyMessages,
    options.logErrors,
    options.onError,
    options.onRecover,
  ]);

  const {
    maxRetries,
    retryDelay,
    showUserFriendlyMessages,
    logErrors,
    onError,
    onRecover,
  } = memoizedOptions;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRecovering: false,
    retryCount: 0,
    lastErrorTime: 0,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // ✅ MELHORIA 3: Error state derivado memoizado
  const derivedErrorState = useMemo(() => ({
    hasError: errorState.error !== null,
    canRetry: errorState.retryCount < maxRetries,
    isActive: errorState.error !== null || errorState.isRecovering,
    errorType: errorState.error?.name || null,
    errorContext: errorState.error?.message?.substring(0, 50) || null,
    retryProgress: errorState.retryCount > 0
      ? Math.round((errorState.retryCount / maxRetries) * 100)
      : 0,
  }), [errorState, maxRetries]);

  // ✅ MELHORIA 4: getErrorMessage super otimizado
  const getErrorMessage = useCallback((error: Error): string => {
    const errorMessage = error.message.toLowerCase();

    for (const mapping of ERROR_MESSAGE_MAPPINGS) {
      if (mapping.keywords.some(keyword => errorMessage.includes(keyword))) {
        return mapping.message;
      }
    }

    return 'Erro inesperado. Nossa equipe foi notificada.';
  }, []); // ✅ Função pura - sem dependências

  // ✅ MELHORIA 5: Device info memoizado
  const deviceInfo = useMemo(() => ({
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    platform: 'React Native',
    timestamp: Date.now(),
  }), []);

  // ✅ MELHORIA 6: captureError super otimizado
  const captureError = useCallback(async (error: Error, context?: string) => {
    if (!mountedRef.current) return;

    const now = Date.now();
    const errorLog = {
      timestamp: new Date().toISOString(),
      context: context || 'Unknown',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      retryCount: errorState.retryCount,
      deviceInfo: {
        ...deviceInfo,
        captureTime: now,
      },
    };

    console.error(`🚨 Error captured in ${context}:`, errorLog);

    // Salvar erro no storage
    if (logErrors) {
      try {
        await storageService.logError?.(errorLog);
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }

    // Atualizar estado apenas se mounted
    if (mountedRef.current) {
      setErrorState(prev => ({
        ...prev,
        error,
        lastErrorTime: now,
      }));
    }

    // Callback personalizado
    if (onError) {
      onError(error);
    }

    // Mostrar mensagem amigável
    if (showUserFriendlyMessages && mountedRef.current) {
      const userMessage = getErrorMessage(error);
      Alert.alert('Ops!', userMessage, [
        {
          text: 'OK',
          onPress: () => {
            if (mountedRef.current) {
              setErrorState(prev => ({ ...prev, error: null }));
            }
          },
        },
      ]);
    }
  }, [
    errorState.retryCount, // ✅ Única dependência de estado necessária
    logErrors,
    onError,
    showUserFriendlyMessages,
    getErrorMessage,
    deviceInfo,
  ]);

  // ✅ MELHORIA 7: scheduleRetry mantido perfeito
  const scheduleRetry = useCallback((operation: () => Promise<any>, delay: number) => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      try {
        console.log(`🔄 Auto-retry scheduled after ${delay}ms`);
        await operation();
      } catch (error) {
        console.error('Auto-retry failed:', error);
      }
    }, delay);
  }, []); // ✅ Perfeito - sem dependências

  // ✅ MELHORIA 8: retry otimizado
  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (!mountedRef.current || errorState.retryCount >= maxRetries) {
      console.error('❌ Max retries exceeded or component unmounted');
      return null;
    }

    setErrorState(prev => ({
      ...prev,
      isRecovering: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      const delay = retryDelay * Math.pow(2, errorState.retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));

      if (!mountedRef.current) return null;

      console.log(`🔄 Retry attempt ${errorState.retryCount + 1}/${maxRetries}`);
      const result = await operation();

      if (mountedRef.current) {
        setErrorState({
          error: null,
          isRecovering: false,
          retryCount: 0,
          lastErrorTime: 0,
        });

        if (onRecover) {
          onRecover();
        }
      }

      return result;
    } catch (retryError) {
      console.error(`❌ Retry ${errorState.retryCount + 1} failed:`, retryError);

      if (mountedRef.current) {
        await captureError(retryError as Error, 'Retry Operation');
        setErrorState(prev => ({
          ...prev,
          isRecovering: false,
          error: retryError as Error,
        }));
      }

      return null;
    }
  }, [errorState.retryCount, maxRetries, retryDelay, captureError, onRecover]);

  // ✅ MELHORIA 9: withErrorHandling mantido otimizado
  const withErrorHandling = useCallback(
    <T,>(operation: () => Promise<T>, context?: string): Promise<T | null> => {
      return operation().catch(async (error) => {
        await captureError(error, context);
        return null;
      });
    },
    [captureError]
  );

  // ✅ MELHORIA 10: clearError mantido perfeito
  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (mountedRef.current) {
      setErrorState({
        error: null,
        isRecovering: false,
        retryCount: 0,
        lastErrorTime: 0,
      });
    }
  }, []); // ✅ Perfeito - sem dependências

  // ✅ MELHORIA 11: shouldAutoRecover otimizado
  const shouldAutoRecover = useCallback((error: Error): boolean => {
    const errorMessage = error.message.toLowerCase();
    const timeSinceLastError = Date.now() - errorState.lastErrorTime;

    const isRecoverable = RECOVERABLE_ERRORS.some(type =>
      errorMessage.includes(type)
    );

    return isRecoverable &&
           errorState.retryCount < maxRetries &&
           timeSinceLastError > 5000;
  }, [errorState.lastErrorTime, errorState.retryCount, maxRetries]);

  // ✅ MELHORIA 12: Error operations agrupadas
  const errorOperations = useMemo(() => ({
    captureError,
    retry,
    withErrorHandling,
    clearError,
    scheduleRetry,
    shouldAutoRecover,
    getErrorMessage,
  }), [
    captureError,
    retry,
    withErrorHandling,
    clearError,
    scheduleRetry,
    shouldAutoRecover,
    getErrorMessage,
  ]);

  // ✅ MELHORIA 13: Error statistics memoizadas
  const errorStats = useMemo(() => ({
    totalRetries: errorState.retryCount,
    successRate: errorState.retryCount > 0
      ? Math.round(((maxRetries - errorState.retryCount) / maxRetries) * 100)
      : 100,
    lastErrorAge: errorState.lastErrorTime > 0
      ? Date.now() - errorState.lastErrorTime
      : 0,
    isRecentError: errorState.lastErrorTime > 0 &&
      (Date.now() - errorState.lastErrorTime) < 10000,
  }), [errorState.retryCount, errorState.lastErrorTime, maxRetries]);

  // ✅ MELHORIA 14: Cleanup otimizado
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // ✅ MELHORIA 15: Return memoizado
  const returnValue = useMemo(() => ({
    // Estado base
    error: errorState.error,
    isRecovering: errorState.isRecovering,
    retryCount: errorState.retryCount,

    // Estados derivados
    ...derivedErrorState,

    // Operações
    ...errorOperations,

    // Estatísticas
    stats: errorStats,

    // Configurações
    config: {
      maxRetries,
      retryDelay,
      showUserFriendlyMessages,
      logErrors,
    },
  }), [
    errorState,
    derivedErrorState,
    errorOperations,
    errorStats,
    maxRetries,
    retryDelay,
    showUserFriendlyMessages,
    logErrors,
  ]);

  return returnValue;
}

// ✅ MELHORIA 16: useAsyncOperation super otimizado
export function useAsyncOperation<T>() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [lastExecuted, setLastExecuted] = useState<number>(0);

  const errorHandler = useErrorHandler();

  // ✅ Operation state memoizado
  const operationState = useMemo(() => ({
    isIdle: !loading && !data && !errorHandler.hasError,
    hasData: data !== null,
    isSuccess: data !== null && !errorHandler.hasError,
    isFailed: errorHandler.hasError,
    lastExecutedAge: lastExecuted > 0 ? Date.now() - lastExecuted : 0,
  }), [loading, data, errorHandler.hasError, lastExecuted]);

  // ✅ Execute otimizado
  const execute = useCallback(async (
    operation: () => Promise<T>,
    context?: string
  ) => {
    setLoading(true);
    setLastExecuted(Date.now());

    try {
      const result = await errorHandler.withErrorHandling(operation, context);
      if (result !== null) {
        setData(result);
      }
    } finally {
      setLoading(false);
    }
  }, [errorHandler.withErrorHandling]);

  // ✅ Reset otimizado
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setLastExecuted(0);
    errorHandler.clearError();
  }, [errorHandler.clearError]);

  // ✅ Operations memoizadas
  const operations = useMemo(() => ({
    execute,
    reset,
  }), [execute, reset]);

  // ✅ Return memoizado
  const returnValue = useMemo(() => ({
    // Estado da operação
    loading,
    data,

    // Estados derivados
    ...operationState,

    // Operações
    ...operations,

    // Error handler completo
    ...errorHandler,
  }), [
    loading,
    data,
    operationState,
    operations,
    errorHandler,
  ]);

  return returnValue;
}

// ✅ MELHORIA 17: Hook para múltiplas operações
export function useMultipleAsyncOperations<T extends Record<string, any>>() {
  const [operations, setOperations] = useState<Record<string, {
    loading: boolean;
    data: any;
    error: Error | null;
    lastExecuted: number;
  }>>({});

  const errorHandler = useErrorHandler();

  // ✅ Operations stats memoizadas
  const operationsStats = useMemo(() => {
    const keys = Object.keys(operations);
    return {
      total: keys.length,
      loading: keys.filter(key => operations[key]?.loading).length,
      success: keys.filter(key => operations[key]?.data !== null).length,
      failed: keys.filter(key => operations[key]?.error !== null).length,
      isAnyLoading: keys.some(key => operations[key]?.loading),
      isAllSuccess: keys.length > 0 && keys.every(key => operations[key]?.data !== null),
    };
  }, [operations]);

  // ✅ Execute operation memoizada
  const executeOperation = useCallback(async <K extends keyof T>(
    key: K,
    operation: () => Promise<T[K]>,
    context?: string
  ) => {
    setOperations(prev => ({
      ...prev,
      [key]: {
        ...prev[key as string],
        loading: true,
        lastExecuted: Date.now(),
      },
    }));

    try {
      const result = await errorHandler.withErrorHandling(operation, context);

      setOperations(prev => ({
        ...prev,
        [key]: {
          ...prev[key as string],
          loading: false,
          data: result,
          error: null,
        },
      }));

      return result;
    } catch (error) {
      setOperations(prev => ({
        ...prev,
        [key]: {
          ...prev[key as string],
          loading: false,
          error: error as Error,
        },
      }));
      return null;
    }
  }, [errorHandler.withErrorHandling]);

  // ✅ Reset operation memoizada
   const resetOperation = useCallback((key?: keyof T) => {
    if (key) {
      setOperations(prev => ({
        ...prev,
        [key]: {
          loading: false,
          data: null,
          error: null,
          lastExecuted: 0,
        },
      }));
    } else {
      setOperations({});
    }
  }, []);

  const returnValue = useMemo(() => ({
    // Operações específicas
    operations,
    operationsStats, // ✅ Nome específico para evitar conflito
    executeOperation,
    resetOperation,

    // Error handler (sem conflito de nomes)
    error: errorHandler.error,
    isRecovering: errorHandler.isRecovering,
    retryCount: errorHandler.retryCount,
    hasError: errorHandler.hasError,
    canRetry: errorHandler.canRetry,
    isActive: errorHandler.isActive,
    errorType: errorHandler.errorType,
    errorContext: errorHandler.errorContext,
    retryProgress: errorHandler.retryProgress,

    // Operações do error handler
    captureError: errorHandler.captureError,
    retry: errorHandler.retry,
    withErrorHandling: errorHandler.withErrorHandling,
    clearError: errorHandler.clearError,
    scheduleRetry: errorHandler.scheduleRetry,
    shouldAutoRecover: errorHandler.shouldAutoRecover,
    getErrorMessage: errorHandler.getErrorMessage,

    // Stats específicas do error handler
    errorStats: errorHandler.stats, // ✅ Nome específico para evitar conflito

    // Configurações
    config: errorHandler.config,
  }), [
    operations,
    operationsStats,
    executeOperation,
    resetOperation,
    errorHandler,
  ]);

  return returnValue;
}