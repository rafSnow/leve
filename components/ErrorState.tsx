import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";
import { ComponentErrorBoundary } from "./ComponentErrorBoundary";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  retryText?: string;
  severity?: "error" | "warning" | "info";
  showIcon?: boolean;
}

// ✅ CORREÇÃO 1: Definir cores que faltam localmente
const severityColors = {
  error: colors.error,
  warning: colors.warning,
  info: colors.accent, // ✅ Usar accent como info
} as const;

const ErrorStateContent: React.FC<ErrorStateProps> = React.memo(
  ({
    message,
    onRetry,
    fullScreen = false,
    title = "Ops! Algo deu errado",
    icon = "alert-circle-outline",
    retryText = "Tentar novamente",
    severity = "error",
    showIcon = true,
  }) => {
    // ✅ MELHORIA 1: Container style memoizado
    const containerStyle = useMemo(
      () => [
        styles.container,
        fullScreen && styles.fullScreen,
        severity === "warning" && styles.containerWarning,
        severity === "info" && styles.containerInfo,
      ],
      [fullScreen, severity]
    );

    // ✅ MELHORIA 2: Title style memoizado
    const titleStyle = useMemo(
      () => [
        styles.title,
        fullScreen && styles.titleLarge,
        severity === "warning" && styles.titleWarning,
        severity === "info" && styles.titleInfo,
      ],
      [fullScreen, severity]
    );

    // ✅ MELHORIA 3: Message style memoizado
    const messageStyle = useMemo(
      () => [styles.message, fullScreen && styles.messageLarge],
      [fullScreen]
    );

    // ✅ CORREÇÃO 2: Icon props com cores corrigidas
    const iconProps = useMemo(() => {
      return {
        name: icon,
        size: fullScreen ? 64 : 48,
        color: severityColors[severity], // ✅ Usar objeto local
      };
    }, [icon, fullScreen, severity]);

    // ✅ MELHORIA 5: Retry button props memoizadas
    const retryButtonProps = useMemo(() => {
      if (!onRetry) return null;

      return {
        style: [
          styles.retryButton,
          severity === "warning" && styles.retryButtonWarning,
          severity === "info" && styles.retryButtonInfo,
        ],
        accessibilityRole: "button" as const,
        accessibilityLabel: retryText,
        accessibilityHint: "Toque para tentar a operação novamente",
      };
    }, [onRetry, severity, retryText]);

    // ✅ MELHORIA 6: Retry handler memoizado
    const handleRetry = useCallback(() => {
      if (onRetry) {
        console.log("🔄 ErrorState retry button pressed");
        onRetry();
      }
    }, [onRetry]);

    // ✅ MELHORIA 7: Retry icon props memoizadas
    const retryIconProps = useMemo(
      () => ({
        name: "refresh-outline" as const,
        size: 20,
        color: colors.white,
      }),
      []
    );

    // ✅ MELHORIA 8: Retry text style memoizado
    const retryTextStyle = useMemo(
      () => [
        styles.retryText,
        severity === "warning" && styles.retryTextWarning,
        severity === "info" && styles.retryTextInfo,
      ],
      [severity]
    );

    return (
      <View style={containerStyle}>
        {showIcon && <Ionicons {...iconProps} />}

        <Text style={titleStyle}>{title}</Text>

        <Text style={messageStyle}>{message}</Text>

        {retryButtonProps && (
          <TouchableOpacity {...retryButtonProps} onPress={handleRetry}>
            <Ionicons {...retryIconProps} />
            <Text style={retryTextStyle}>{retryText}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

ErrorStateContent.displayName = "ErrorStateContent";

export const ErrorState: React.FC<ErrorStateProps> = React.memo((props) => {
  // ✅ MELHORIA 9: ComponentErrorBoundary props memoizadas
  const errorBoundaryProps = useMemo(
    () => ({
      componentName: "ErrorState",
      fallbackMessage: "Erro ao exibir estado de erro",
      showRetry: false,
    }),
    []
  );

  return (
    <ComponentErrorBoundary {...errorBoundaryProps}>
      <ErrorStateContent {...props} />
    </ComponentErrorBoundary>
  );
});

ErrorState.displayName = "ErrorState";

// ✅ MELHORIA 10: Enhanced ErrorState com features avançadas
export const EnhancedErrorState: React.FC<
  ErrorStateProps & {
    actions?: Array<{
      title: string;
      onPress: () => void;
      variant?: "primary" | "secondary" | "outline";
    }>;
    details?: string;
    showDetails?: boolean;
    autoRetry?: {
      enabled: boolean;
      maxAttempts: number;
      delay: number;
    };
  }
> = React.memo(
  ({ actions = [], details, showDetails = false, autoRetry, ...props }) => {
    const [retryAttempts, setRetryAttempts] = React.useState(0);
    const [showDetailsState, setShowDetailsState] = React.useState(showDetails);

    // ✅ Auto retry effect memoizado
    const autoRetryEnabled =
      autoRetry?.enabled && retryAttempts < (autoRetry?.maxAttempts || 3);

    React.useEffect(() => {
      if (autoRetryEnabled && props.onRetry) {
        const timeoutId = setTimeout(() => {
          console.log(`🔄 Auto retry attempt ${retryAttempts + 1}`);
          setRetryAttempts((prev) => prev + 1);
          props.onRetry?.();
        }, autoRetry?.delay || 2000);

        return () => clearTimeout(timeoutId);
      }
    }, [autoRetryEnabled, props.onRetry, retryAttempts, autoRetry?.delay]);

    // ✅ Enhanced retry handler memoizado
    const enhancedRetry = useCallback(() => {
      setRetryAttempts((prev) => prev + 1);
      props.onRetry?.();
    }, [props.onRetry]);

    // ✅ Toggle details handler memoizado
    const toggleDetails = useCallback(() => {
      setShowDetailsState((prev) => !prev);
    }, []);

    // ✅ Actions buttons memoizadas
    const actionButtons = useMemo(() => {
      return actions.map((action, index) => {
        const buttonStyle = [
          styles.actionButton,
          action.variant === "secondary" && styles.actionButtonSecondary,
          action.variant === "outline" && styles.actionButtonOutline,
        ];

        const textStyle = [
          styles.actionButtonText,
          action.variant === "secondary" && styles.actionButtonTextSecondary,
          action.variant === "outline" && styles.actionButtonTextOutline,
        ];

        return (
          <TouchableOpacity
            key={`action-${index}`}
            style={buttonStyle}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.title}
          >
            <Text style={textStyle}>{action.title}</Text>
          </TouchableOpacity>
        );
      });
    }, [actions]);

    // ✅ Enhanced props memoizadas
    const enhancedProps = useMemo(
      () => ({
        ...props,
        onRetry: enhancedRetry,
        title: autoRetryEnabled
          ? `${props.title} (tentativa ${retryAttempts + 1}/${
              autoRetry?.maxAttempts
            })`
          : props.title,
      }),
      [
        props,
        enhancedRetry,
        autoRetryEnabled,
        retryAttempts,
        autoRetry?.maxAttempts,
      ]
    );

    return (
      <View>
        <ErrorState {...enhancedProps} />

        {/* Actions */}
        {actionButtons.length > 0 && (
          <View style={styles.actionsContainer}>{actionButtons}</View>
        )}

        {/* Details */}
        {details && (
          <View style={styles.detailsContainer}>
            <TouchableOpacity
              style={styles.detailsToggle}
              onPress={toggleDetails}
              accessibilityRole="button"
              accessibilityLabel={
                showDetailsState ? "Ocultar detalhes" : "Mostrar detalhes"
              }
            >
              <Text style={styles.detailsToggleText}>
                {showDetailsState ? "Ocultar detalhes" : "Mostrar detalhes"}
              </Text>
              <Ionicons
                name={showDetailsState ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.gray}
              />
            </TouchableOpacity>

            {showDetailsState && (
              <View style={styles.detailsContent}>
                <Text style={styles.detailsText}>{details}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }
);

EnhancedErrorState.displayName = "EnhancedErrorState";

// ✅ MELHORIA 11: Minimal ErrorState para casos simples
export const MinimalErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = React.memo(({ message, onRetry }) => {
  // ✅ Minimal props memoizadas
  const minimalProps = useMemo(
    () => ({
      message,
      onRetry,
      fullScreen: false,
      title: "Erro",
      icon: "alert-circle-outline" as const,
      severity: "error" as const,
      showIcon: true,
    }),
    [message, onRetry]
  );

  return <ErrorState {...minimalProps} />;
});

MinimalErrorState.displayName = "MinimalErrorState";

// ✅ MELHORIA 12: withErrorState HOC
export function withErrorState<P extends object>(
  Component: React.ComponentType<P>,
  errorConfig?: Partial<ErrorStateProps>
) {
  const WrappedComponent = React.memo(
    (
      props: P & {
        hasError?: boolean;
        errorMessage?: string;
        onRetry?: () => void;
      }
    ) => {
      const { hasError, errorMessage, onRetry, ...componentProps } = props;

      if (hasError && errorMessage) {
        return (
          <ErrorState
            message={errorMessage}
            onRetry={onRetry}
            {...errorConfig}
          />
        );
      }

      return <Component {...(componentProps as P)} />;
    }
  );

  WrappedComponent.displayName = `withErrorState(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// ✅ CORREÇÃO 3: Styles com cores corretas
const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 40,
  },
  // ✅ Estilos para severidade com cores existentes
  containerWarning: {
    backgroundColor: colors.warning + "10",
  },
  containerInfo: {
    backgroundColor: colors.accent + "10", // ✅ Usar accent ao invés de info
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.dark,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  titleLarge: {
    fontSize: 20,
  },
  // ✅ Estilos para title por severidade com cores corretas
  titleWarning: {
    color: colors.warning,
  },
  titleInfo: {
    color: colors.accent, // ✅ Usar accent ao invés de info
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  messageLarge: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  // ✅ Estilos para retry button por severidade com cores corretas
  retryButtonWarning: {
    backgroundColor: colors.warning,
  },
  retryButtonInfo: {
    backgroundColor: colors.accent, // ✅ Usar accent ao invés de info
  },
  retryText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.white,
  },
  // ✅ Estilos para retry text (mantidos iguais)
  retryTextWarning: {
    color: colors.white,
  },
  retryTextInfo: {
    color: colors.white,
  },
  // ✅ Estilos para Enhanced ErrorState
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  actionButtonSecondary: {
    backgroundColor: colors.secondary,
  },
  actionButtonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.white,
  },
  actionButtonTextSecondary: {
    color: colors.white,
  },
  actionButtonTextOutline: {
    color: colors.primary,
  },
  detailsContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  detailsToggleText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
  },
  detailsContent: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  detailsText: {
    fontFamily: "Courier",
    fontSize: 12,
    color: colors.dark,
    lineHeight: 16,
  },
});
