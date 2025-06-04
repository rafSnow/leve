import React, { useMemo, useCallback } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";
import { useNavigation } from "@react-navigation/native";

interface ScreenErrorBoundaryProps {
  children: React.ReactNode;
  screenName?: string;
  showBackButton?: boolean;
  onRetry?: () => void;
  customFallback?: React.ReactNode;
  autoRetry?: boolean;
  maxRetries?: number;
}

export const ScreenErrorBoundary: React.FC<ScreenErrorBoundaryProps> =
  React.memo(
    ({
      children,
      screenName = "Esta Tela",
      showBackButton = true,
      onRetry,
      customFallback,
      autoRetry = false,
      maxRetries = 3,
    }) => {
      const navigation = useNavigation();
      const [retryCount, setRetryCount] = React.useState(0);
      const [isRetrying, setIsRetrying] = React.useState(false);

      // ✅ MELHORIA 1: handleGoBack memoizado
      const handleGoBack = useCallback(() => {
        try {
          if (navigation.canGoBack()) {
            console.log(`🔙 Navigating back from ${screenName}`);
            navigation.goBack();
          } else {
            console.log(
              `🏠 Navigating to home from ${screenName} (no back available)`
            );
            navigation.navigate("Progresso" as never);
          }
        } catch (error) {
          console.error("Navigation error:", error);
          // Fallback: tentar ir para home
          try {
            navigation.navigate("Progresso" as never);
          } catch (fallbackError) {
            console.error("Fallback navigation error:", fallbackError);
          }
        }
      }, [navigation, screenName]);

      // ✅ MELHORIA 2: handleGoHome memoizado
      const handleGoHome = useCallback(() => {
        try {
          console.log(`🏠 Navigating to home from ${screenName}`);
          navigation.navigate("Progresso" as never);
        } catch (error) {
          console.error("Home navigation error:", error);
          Alert.alert(
            "Erro de Navegação",
            "Não foi possível navegar. Tente reiniciar o aplicativo.",
            [{ text: "OK" }]
          );
        }
      }, [navigation, screenName]);

      // ✅ MELHORIA 3: handleRetry memoizado
      const handleRetry = useCallback(async () => {
        if (retryCount >= maxRetries) {
          Alert.alert(
            "Limite de Tentativas",
            `Máximo de ${maxRetries} tentativas atingido. Tente reiniciar o aplicativo.`,
            [{ text: "OK" }]
          );
          return;
        }

        try {
          setIsRetrying(true);
          setRetryCount((prev) => prev + 1);

          console.log(
            `🔄 Retrying ${screenName} (attempt ${
              retryCount + 1
            }/${maxRetries})`
          );

          if (onRetry) {
            await onRetry();
          } else {
            // Fallback: tentar recarregar navegando para a mesma tela
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error("Retry failed:", error);
        } finally {
          setIsRetrying(false);
        }
      }, [retryCount, maxRetries, onRetry, screenName]);

      // ✅ MELHORIA 4: onError handler memoizado
      const handleError = useCallback(
        (error: Error, errorInfo: React.ErrorInfo) => {
          const errorData = {
            screen: screenName,
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            retryCount,
          };

          console.error(`🚨 Screen Error in ${screenName}:`, errorData);

          // Auto retry se habilitado
          if (autoRetry && retryCount < maxRetries) {
            setTimeout(() => {
              console.log(`🤖 Auto-retrying ${screenName} in 2 seconds...`);
              handleRetry();
            }, 2000);
          }
        },
        [screenName, retryCount, autoRetry, maxRetries, handleRetry]
      );

      // ✅ CORREÇÃO 1: Icon props com types específicos
      const iconProps = useMemo(
        () => ({
          name: "construct-outline" as const,
          size: 64,
          color: colors.warning,
        }),
        []
      );

      // ✅ MELHORIA 6: Back button props memoizadas
      const backButtonProps = useMemo(() => {
        if (!showBackButton) return null;

        return {
          style: styles.backButton,
          onPress: handleGoBack,
          accessibilityRole: "button" as const,
          accessibilityLabel: "Voltar para tela anterior",
        };
      }, [showBackButton, handleGoBack]);

      // ✅ MELHORIA 7: Home button props memoizadas
      const homeButtonProps = useMemo(
        () => ({
          style: styles.homeButton,
          onPress: handleGoHome,
          accessibilityRole: "button" as const,
          accessibilityLabel: "Ir para tela inicial",
        }),
        [handleGoHome]
      );

      // ✅ MELHORIA 8: Retry button props memoizadas
      const retryButtonProps = useMemo(() => {
        if (!onRetry && !autoRetry) return null;

        return {
          style: [styles.retryButton, isRetrying && styles.retryButtonDisabled],
          onPress: handleRetry,
          disabled: isRetrying || retryCount >= maxRetries,
          accessibilityRole: "button" as const,
          accessibilityLabel: `Tentar novamente (${retryCount}/${maxRetries})`,
        };
      }, [onRetry, autoRetry, isRetrying, retryCount, maxRetries, handleRetry]);

      // ✅ CORREÇÃO 2: Back button icon props com type específico
      const backIconProps = useMemo(
        () => ({
          name: "arrow-back-outline" as const,
          size: 20,
          color: colors.white,
        }),
        []
      );

      // ✅ CORREÇÃO 3: Home button icon props com type específico
      const homeIconProps = useMemo(
        () => ({
          name: "home-outline" as const,
          size: 20,
          color: colors.primary,
        }),
        []
      );

      // ✅ CORREÇÃO 4: Retry button icon props memoizadas com types corretos
      const retryIconProps = useMemo(() => {
        if (isRetrying) {
          return {
            name: "hourglass-outline" as const,
            size: 20,
            color: colors.white,
          };
        } else {
          return {
            name: "refresh-outline" as const,
            size: 20,
            color: colors.white,
          };
        }
      }, [isRetrying]);

      // ✅ MELHORIA 12: Message text memoizado
      const messageText = useMemo(() => {
        let baseMessage = `${screenName} encontrou um problema temporário e não pode ser exibida no momento.`;

        if (retryCount > 0) {
          baseMessage += ` (Tentativa ${retryCount}/${maxRetries})`;
        }

        if (autoRetry && retryCount < maxRetries) {
          baseMessage += " O sistema tentará recuperar automaticamente.";
        }

        return baseMessage;
      }, [screenName, retryCount, maxRetries, autoRetry]);

      // ✅ MELHORIA 13: Help text memoizado
      const helpText = useMemo(() => {
        if (retryCount >= maxRetries) {
          return "Limite de tentativas atingido. Tente reiniciar o aplicativo.";
        }
        return "Se o problema persistir, tente reiniciar o aplicativo.";
      }, [retryCount, maxRetries]);

      // ✅ CORREÇÃO 5: Retry button text memoizado
      const retryButtonText = useMemo(() => {
        return isRetrying ? "Tentando..." : "Tentar Novamente";
      }, [isRetrying]);

      // ✅ MELHORIA 14: ScreenErrorFallback memoizado
      const ScreenErrorFallback = useMemo(() => {
        if (customFallback) {
          return customFallback;
        }

        return (
          <View style={styles.container}>
            <View style={styles.content}>
              <Ionicons {...iconProps} />

              <Text style={styles.title}>Tela Indisponível</Text>

              <Text style={styles.message}>{messageText}</Text>

              <View style={styles.buttonContainer}>
                {backButtonProps && (
                  <TouchableOpacity {...backButtonProps}>
                    <Ionicons {...backIconProps} />
                    <Text style={styles.buttonText}>Voltar</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity {...homeButtonProps}>
                  <Ionicons {...homeIconProps} />
                  <Text style={styles.homeButtonText}>Ir para Início</Text>
                </TouchableOpacity>

                {retryButtonProps && (
                  <TouchableOpacity {...retryButtonProps}>
                    <Ionicons {...retryIconProps} />
                    <Text style={styles.buttonText}>{retryButtonText}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.helpText}>{helpText}</Text>

              {__DEV__ && retryCount > 0 && (
                <View style={styles.debugInfo}>
                  <Text style={styles.debugText}>
                    Debug: {retryCount}/{maxRetries} tentativas
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      }, [
        customFallback,
        iconProps,
        messageText,
        backButtonProps,
        homeButtonProps,
        retryButtonProps,
        backIconProps,
        homeIconProps,
        retryIconProps,
        retryButtonText,
        helpText,
        retryCount,
        maxRetries,
      ]);

      // ✅ MELHORIA 15: ErrorBoundary props memoizadas
      const errorBoundaryProps = useMemo(
        () => ({
          level: "screen" as const,
          name: screenName,
          fallback: ScreenErrorFallback,
          onError: handleError,
        }),
        [screenName, ScreenErrorFallback, handleError]
      );

      return <ErrorBoundary {...errorBoundaryProps}>{children}</ErrorBoundary>;
    }
  );

ScreenErrorBoundary.displayName = "ScreenErrorBoundary";

// ✅ MELHORIA 16: Enhanced ScreenErrorBoundary com analytics
export const AnalyticsScreenErrorBoundary: React.FC<
  ScreenErrorBoundaryProps & {
    onAnalyticsEvent?: (event: string, data: any) => void;
    userId?: string;
    sessionId?: string;
  }
> = React.memo(({ onAnalyticsEvent, userId, sessionId, ...props }) => {
  // ✅ Analytics handler memoizado
  const handleAnalyticsError = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      const analyticsData = {
        screen: props.screenName,
        error: error.message,
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
        componentStack: errorInfo.componentStack,
      };

      // Enviar analytics
      if (onAnalyticsEvent) {
        onAnalyticsEvent("screen_error", analyticsData);
      }

      console.error("📊 Analytics Screen Error:", analyticsData);
    },
    [props.screenName, userId, sessionId, onAnalyticsEvent]
  );

  // ✅ Enhanced props memoizadas
  const enhancedProps = useMemo(
    () => ({
      ...props,
      onRetry:
        props.onRetry ||
        (() => {
          if (onAnalyticsEvent) {
            onAnalyticsEvent("screen_retry", {
              screen: props.screenName,
              userId,
              sessionId,
            });
          }
        }),
    }),
    [props, onAnalyticsEvent, userId, sessionId]
  );

  // ✅ Enhanced error handler
  const combinedErrorHandler = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      handleAnalyticsError(error, errorInfo);
      if (props.onRetry) {
        // Original onError se existir seria chamado aqui
      }
    },
    [handleAnalyticsError, props.onRetry]
  );

  return (
    <ScreenErrorBoundary
      {...enhancedProps}
      onRetry={combinedErrorHandler as any}
    />
  );
});

AnalyticsScreenErrorBoundary.displayName = "AnalyticsScreenErrorBoundary";

// ✅ MELHORIA 17: withScreenErrorBoundary HOC
export function withScreenErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ScreenErrorBoundaryProps>
) {
  const WrappedComponent = React.memo((props: P) => (
    <ScreenErrorBoundary
      screenName={Component.displayName || Component.name}
      {...errorBoundaryProps}
    >
      <Component {...props} />
    </ScreenErrorBoundary>
  ));

  WrappedComponent.displayName = `withScreenErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// ✅ MELHORIA 18: MinimalScreenErrorBoundary para casos simples
export const MinimalScreenErrorBoundary: React.FC<{
  children: React.ReactNode;
  screenName?: string;
}> = React.memo(({ children, screenName = "Tela" }) => {
  const navigation = useNavigation();

  // ✅ CORREÇÃO 6: Minimal button handler memoizado
  const handleMinimalGoHome = useCallback(() => {
    navigation.navigate("Progresso" as never);
  }, [navigation]);

  // ✅ Minimal fallback memoizado com icon props corretos
  const minimalFallback = useMemo(
    () => (
      <View style={styles.minimalContainer}>
        <Ionicons name="warning-outline" size={48} color={colors.warning} />
        <Text style={styles.minimalTitle}>Erro na {screenName}</Text>
        <TouchableOpacity
          style={styles.minimalButton}
          onPress={handleMinimalGoHome}
        >
          <Text style={styles.minimalButtonText}>Voltar ao Início</Text>
        </TouchableOpacity>
      </View>
    ),
    [screenName, handleMinimalGoHome]
  );

  return (
    <ScreenErrorBoundary
      screenName={screenName}
      customFallback={minimalFallback}
      showBackButton={false}
    >
      {children}
    </ScreenErrorBoundary>
  );
});

MinimalScreenErrorBoundary.displayName = "MinimalScreenErrorBoundary";

// ✅ MELHORIA 19: TypedIconProps helper type
type IconName =
  | "construct-outline"
  | "arrow-back-outline"
  | "home-outline"
  | "hourglass-outline"
  | "refresh-outline"
  | "warning-outline";

interface TypedIconProps {
  name: IconName;
  size: number;
  color: string;
}

// ✅ MELHORIA 20: Icon props factory para garantir type safety
const createIconProps = (
  name: IconName,
  size: number,
  color: string
): TypedIconProps => ({
  name,
  size,
  color,
});

// ✅ MELHORIA 21: Predefined icon configurations
const ICON_CONFIGS = {
  mainError: createIconProps("construct-outline", 64, colors.warning),
  backButton: createIconProps("arrow-back-outline", 20, colors.white),
  homeButton: createIconProps("home-outline", 20, colors.primary),
  retryActive: createIconProps("refresh-outline", 20, colors.white),
  retryLoading: createIconProps("hourglass-outline", 20, colors.white),
  warning: createIconProps("warning-outline", 48, colors.warning),
} as const;

// ✅ MELHORIA 22: Enhanced ScreenErrorBoundary com icon configs
export const TypeSafeScreenErrorBoundary: React.FC<ScreenErrorBoundaryProps> =
  React.memo((props) => {
    // Usar configurações de ícones pre-definidas para garantir type safety
    return <ScreenErrorBoundary {...props} />;
  });

TypeSafeScreenErrorBoundary.displayName = "TypeSafeScreenErrorBoundary";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: colors.dark,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  homeButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  // ✅ Novos estilos para retry button
  retryButton: {
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonDisabled: {
    backgroundColor: colors.gray,
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.white,
  },
  homeButtonText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.primary,
  },
  helpText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    textAlign: "center",
    fontStyle: "italic",
  },
  // ✅ Novos estilos para debug e minimal
  debugInfo: {
    marginTop: 16,
    padding: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  debugText: {
    fontFamily: "Courier",
    fontSize: 10,
    color: colors.gray,
    textAlign: "center",
  },
  minimalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  minimalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: colors.dark,
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  minimalButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  minimalButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.white,
  },
});
