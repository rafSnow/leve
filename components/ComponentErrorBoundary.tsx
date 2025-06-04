import React, { useMemo, useCallback } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  fallbackMessage?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export const ComponentErrorBoundary: React.FC<ComponentErrorBoundaryProps> =
  React.memo(
    ({
      children,
      componentName = "Este componente",
      fallbackMessage,
      showRetry = true,
      onRetry,
    }) => {
      // ✅ MELHORIA 1: handleRetry memoizado
      const handleRetry = useCallback(() => {
        if (onRetry) {
          onRetry();
        } else {
          // Fallback: recarregar página (apenas no web)
          if (typeof window !== "undefined" && window.location?.reload) {
            window.location.reload();
          }
        }
      }, [onRetry]);

      // ✅ MELHORIA 2: Error message memoizada
      const errorMessage = useMemo(() => {
        return (
          fallbackMessage ||
          `${componentName} encontrou um problema temporário.`
        );
      }, [fallbackMessage, componentName]);

      // ✅ CORREÇÃO 1: onError handler com tipo correto do React.ErrorInfo
      const handleError = useCallback(
        (error: Error, errorInfo: React.ErrorInfo) => {
          console.error(`Component Error in ${componentName}:`, {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            component: componentName,
          });
        },
        [componentName]
      );

      // ✅ MELHORIA 4: Retry button props memoizadas
      const retryButtonProps = useMemo(
        () => ({
          style: styles.retryButton,
          onPress: handleRetry,
          accessibilityRole: "button" as const,
          accessibilityLabel: "Tentar carregar componente novamente",
        }),
        [handleRetry]
      );

      // ✅ MELHORIA 5: Icon props memoizadas
      const warningIconProps = useMemo(
        () => ({
          name: "warning-outline" as const,
          size: 32,
          color: colors.warning,
        }),
        []
      );

      const refreshIconProps = useMemo(
        () => ({
          name: "refresh-outline" as const,
          size: 16,
          color: colors.white,
        }),
        []
      );

      // ✅ MELHORIA 6: ComponentErrorFallback memoizado
      const ComponentErrorFallback = useMemo(
        () => (
          <View style={styles.container}>
            <Ionicons {...warningIconProps} />
            <Text style={styles.title}>Componente Indisponível</Text>
            <Text style={styles.message}>{errorMessage}</Text>
            {showRetry && (
              <TouchableOpacity {...retryButtonProps}>
                <Ionicons {...refreshIconProps} />
                <Text style={styles.retryText}>Tentar Novamente</Text>
              </TouchableOpacity>
            )}
          </View>
        ),
        [
          errorMessage,
          showRetry,
          retryButtonProps,
          warningIconProps,
          refreshIconProps,
        ]
      );

      // ✅ CORREÇÃO 2: ErrorBoundary props com tipos corretos
      const errorBoundaryProps = useMemo(
        () => ({
          level: "component" as const,
          name: componentName,
          fallback: ComponentErrorFallback,
          onError: handleError, // ✅ Agora usa React.ErrorInfo correto
        }),
        [componentName, ComponentErrorFallback, handleError]
      );

      return <ErrorBoundary {...errorBoundaryProps}>{children}</ErrorBoundary>;
    }
  );

ComponentErrorBoundary.displayName = "ComponentErrorBoundary";

// ✅ MELHORIA 8: Enhanced ComponentErrorBoundary com retry automático
export const SmartComponentErrorBoundary: React.FC<
  ComponentErrorBoundaryProps & {
    maxRetries?: number;
    retryDelay?: number;
    autoRetry?: boolean;
    onMaxRetriesReached?: () => void;
  }
> = React.memo(
  ({
    maxRetries = 3,
    retryDelay = 1000,
    autoRetry = false,
    onMaxRetriesReached,
    ...props
  }) => {
    const [retryCount, setRetryCount] = React.useState(0);
    const [isRetrying, setIsRetrying] = React.useState(false);

    // ✅ Enhanced retry handler memoizado
    const enhancedRetry = useCallback(async () => {
      if (retryCount >= maxRetries) {
        onMaxRetriesReached?.();
        return;
      }

      setIsRetrying(true);
      setRetryCount((prev) => prev + 1);

      try {
        // Delay antes do retry
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        if (props.onRetry) {
          props.onRetry();
        }
      } catch (error) {
        console.error("Retry failed:", error);
      } finally {
        setIsRetrying(false);
      }
    }, [
      retryCount,
      maxRetries,
      retryDelay,
      props.onRetry,
      onMaxRetriesReached,
    ]);

    // ✅ Auto retry effect memoizado
    React.useEffect(() => {
      if (autoRetry && retryCount < maxRetries && !isRetrying) {
        const timeoutId = setTimeout(enhancedRetry, retryDelay);
        return () => clearTimeout(timeoutId);
      }
    }, [
      autoRetry,
      retryCount,
      maxRetries,
      isRetrying,
      enhancedRetry,
      retryDelay,
    ]);

    // ✅ Enhanced props memoizadas
    const enhancedProps = useMemo(
      () => ({
        ...props,
        onRetry: enhancedRetry,
        fallbackMessage:
          props.fallbackMessage ||
          `${props.componentName || "Este componente"} encontrou um problema. ${
            retryCount > 0 ? `Tentativa ${retryCount}/${maxRetries}` : ""
          }`,
      }),
      [props, enhancedRetry, retryCount, maxRetries]
    );

    return <ComponentErrorBoundary {...enhancedProps} />;
  }
);

SmartComponentErrorBoundary.displayName = "SmartComponentErrorBoundary";

// ✅ MELHORIA 9: MinimalErrorBoundary para casos simples
export const MinimalErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = React.memo(({ children, fallback }) => {
  // ✅ Default fallback memoizado
  const defaultFallback = useMemo(
    () => (
      <View style={styles.minimalContainer}>
        <Text style={styles.minimalText}>⚠️ Erro temporário</Text>
      </View>
    ),
    []
  );

  // ✅ CORREÇÃO 3: Error handler com React.ErrorInfo correto
  const handleError = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      console.error("Minimal Error Boundary:", {
        error: error.message,
        componentStack: errorInfo.componentStack,
      });
    },
    []
  );

  // ✅ Props memoizadas
  const errorBoundaryProps = useMemo(
    () => ({
      level: "component" as const,
      name: "MinimalComponent",
      fallback: fallback || defaultFallback,
      onError: handleError, // ✅ Tipo correto
    }),
    [fallback, defaultFallback, handleError]
  );

  return <ErrorBoundary {...errorBoundaryProps}>{children}</ErrorBoundary>;
});

MinimalErrorBoundary.displayName = "MinimalErrorBoundary";

// ✅ MELHORIA 10: withErrorBoundary HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ComponentErrorBoundaryProps>
) {
  const WrappedComponent = React.memo((props: P) => (
    <ComponentErrorBoundary
      componentName={Component.displayName || Component.name}
      {...errorBoundaryProps}
    >
      <Component {...props} />
    </ComponentErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// ✅ CORREÇÃO 4: Typed Error Boundary Hook para uso funcional
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error: Error) => {
    setError(error);
  }, []);

  // ✅ Throw error para ser capturado por ErrorBoundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// ✅ CORREÇÃO 5: Async Error Boundary para capturar erros assíncronos
export const AsyncErrorBoundary: React.FC<
  ComponentErrorBoundaryProps & {
    onAsyncError?: (error: Error) => void;
  }
> = React.memo(({ onAsyncError, children, ...props }) => {
  const { captureError } = useErrorBoundary();

  // ✅ Global error handler memoizado
  const handleGlobalError = useCallback(
    (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      onAsyncError?.(event.error);
      captureError(event.error);
    },
    [onAsyncError, captureError]
  );

  // ✅ Unhandled promise rejection handler memoizado
  const handleUnhandledRejection = useCallback(
    (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));
      onAsyncError?.(error);
      captureError(error);
    },
    [onAsyncError, captureError]
  );

  // ✅ Setup global error listeners
  React.useEffect(() => {
    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, [handleGlobalError, handleUnhandledRejection]);

  return <ComponentErrorBoundary {...props}>{children}</ComponentErrorBoundary>;
});

AsyncErrorBoundary.displayName = "AsyncErrorBoundary";

// ✅ CORREÇÃO 6: Error Context para compartilhamento de estado de erro
interface ErrorContextType {
  errors: Map<string, Error>;
  addError: (key: string, error: Error) => void;
  removeError: (key: string) => void;
  clearErrors: () => void;
  hasErrors: boolean;
}

const ErrorContext = React.createContext<ErrorContextType | null>(null);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> =
  React.memo(({ children }) => {
    const [errors, setErrors] = React.useState<Map<string, Error>>(new Map());

    // ✅ Error management functions memoizadas
    const addError = useCallback((key: string, error: Error) => {
      setErrors((prev) => new Map(prev).set(key, error));
    }, []);

    const removeError = useCallback((key: string) => {
      setErrors((prev) => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    }, []);

    const clearErrors = useCallback(() => {
      setErrors(new Map());
    }, []);

    // ✅ Context value memoizado
    const contextValue = useMemo(
      () => ({
        errors,
        addError,
        removeError,
        clearErrors,
        hasErrors: errors.size > 0,
      }),
      [errors, addError, removeError, clearErrors]
    );

    return (
      <ErrorContext.Provider value={contextValue}>
        {children}
      </ErrorContext.Provider>
    );
  });

ErrorProvider.displayName = "ErrorProvider";

// ✅ Hook para usar Error Context
export function useErrorContext() {
  const context = React.useContext(ErrorContext);
  if (!context) {
    throw new Error("useErrorContext must be used within an ErrorProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    minHeight: 120,
    justifyContent: "center",
    margin: 8,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: colors.dark,
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  retryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: colors.white,
  },
  // ✅ Novos estilos para componentes adicionais
  minimalContainer: {
    padding: 8,
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    minHeight: 40,
    justifyContent: "center",
  },
  minimalText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: colors.gray,
    textAlign: "center",
  },
});
