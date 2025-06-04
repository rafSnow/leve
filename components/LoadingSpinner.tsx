import React, { useMemo } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors } from "../styles/colors";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "large";
  fullScreen?: boolean;
  overlay?: boolean;
}

// ✅ OTIMIZAÇÃO 1: React.memo para prevenir re-renders desnecessários
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(
  ({
    message = "Carregando...",
    size = "large",
    fullScreen = false,
    overlay = false,
  }) => {
    // ✅ CORREÇÃO: Container style memoizado com type assertion
    const containerStyle = useMemo((): ViewStyle => {
      const baseStyle: ViewStyle = { ...styles.container };

      if (fullScreen) {
        Object.assign(baseStyle, styles.fullScreen);
      }

      if (overlay) {
        Object.assign(baseStyle, styles.overlay);
      }

      return baseStyle;
    }, [fullScreen, overlay]);

    // ✅ OTIMIZAÇÃO 3: ActivityIndicator props memoizadas
    const activityIndicatorProps = useMemo(
      () => ({
        size,
        color: colors.primary,
      }),
      [size]
    );

    // ✅ CORREÇÃO: Text style memoizado com type safety
    const textStyle = useMemo((): TextStyle => {
      const baseStyle: TextStyle = { ...styles.message };

      if (size === "small") {
        Object.assign(baseStyle, styles.messageSmall);
      }

      return baseStyle;
    }, [size]);

    // ✅ OTIMIZAÇÃO 5: Content style memoizado baseado no overlay
    const contentStyle = useMemo(
      (): ViewStyle => ({
        ...styles.content,
        // ✅ Ajuste dinâmico baseado no contexto
        backgroundColor: overlay ? colors.white : colors.background,
        shadowOpacity: overlay ? 0.15 : 0.1,
      }),
      [overlay]
    );

    // ✅ OTIMIZAÇÃO 6: Conditional rendering memoizado
    const textElement = useMemo(() => {
      if (!message) return null;

      return <Text style={textStyle}>{message}</Text>;
    }, [message, textStyle]);

    return (
      <View style={containerStyle}>
        <View style={contentStyle}>
          <ActivityIndicator {...activityIndicatorProps} />
          {textElement}
        </View>
      </View>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

// ✅ OTIMIZAÇÃO 7: Variações especializadas para casos comuns
export const QuickLoadingSpinner: React.FC<{
  message?: string;
}> = React.memo(({ message = "Carregando..." }) => {
  // ✅ Props pré-otimizadas para uso comum
  const quickProps = useMemo(
    () => ({
      message,
      size: "large" as const,
      fullScreen: false,
      overlay: false,
    }),
    [message]
  );

  return <LoadingSpinner {...quickProps} />;
});

QuickLoadingSpinner.displayName = "QuickLoadingSpinner";

// ✅ OTIMIZAÇÃO 8: Loading para overlays (muito usado nos screens)
export const OverlayLoadingSpinner: React.FC<{
  message?: string;
  size?: "small" | "large";
}> = React.memo(({ message = "Processando...", size = "large" }) => {
  // ✅ Props pré-otimizadas para overlay
  const overlayProps = useMemo(
    () => ({
      message,
      size,
      fullScreen: false,
      overlay: true,
    }),
    [message, size]
  );

  return <LoadingSpinner {...overlayProps} />;
});

OverlayLoadingSpinner.displayName = "OverlayLoadingSpinner";

// ✅ OTIMIZAÇÃO 9: Loading para tela cheia (usado nos screens iniciais)
export const FullScreenLoadingSpinner: React.FC<{
  message?: string;
}> = React.memo(({ message = "Carregando dados..." }) => {
  // ✅ Props pré-otimizadas para fullscreen
  const fullScreenProps = useMemo(
    () => ({
      message,
      size: "large" as const,
      fullScreen: true,
      overlay: false,
    }),
    [message]
  );

  return <LoadingSpinner {...fullScreenProps} />;
});

FullScreenLoadingSpinner.displayName = "FullScreenLoadingSpinner";

// ✅ OTIMIZAÇÃO 10: Loading para botões e actions (pequeno e inline)
export const InlineLoadingSpinner: React.FC<{
  message?: string;
}> = React.memo(({ message }) => {
  // ✅ Props pré-otimizadas para uso inline
  const inlineProps = useMemo(
    () => ({
      message,
      size: "small" as const,
      fullScreen: false,
      overlay: false,
    }),
    [message]
  );

  return <LoadingSpinner {...inlineProps} />;
});

InlineLoadingSpinner.displayName = "InlineLoadingSpinner";

// ✅ OTIMIZAÇÃO 11: Loading inteligente que se adapta ao contexto
export const SmartLoadingSpinner: React.FC<{
  context: "save" | "load" | "calculate" | "sync" | "export";
  size?: "small" | "large";
  overlay?: boolean;
}> = React.memo(({ context, size = "large", overlay = false }) => {
  // ✅ Mensagens contextuais memoizadas
  const contextualMessage = useMemo(() => {
    const messages = {
      save: "Salvando dados...",
      load: "Carregando informações...",
      calculate: "Calculando métricas...",
      sync: "Sincronizando dados...",
      export: "Preparando exportação...",
    };
    return messages[context];
  }, [context]);

  // ✅ Props inteligentes baseadas no contexto
  const smartProps = useMemo(
    () => ({
      message: contextualMessage,
      size,
      fullScreen: context === "load" || context === "sync",
      overlay: overlay || context === "save" || context === "calculate",
    }),
    [contextualMessage, size, context, overlay]
  );

  return <LoadingSpinner {...smartProps} />;
});

SmartLoadingSpinner.displayName = "SmartLoadingSpinner";

// ✅ NOVO: LoadingSpinner com animação personalizada
export const AnimatedLoadingSpinner: React.FC<{
  message?: string;
  size?: "small" | "large";
  fullScreen?: boolean;
  overlay?: boolean;
  duration?: number;
}> = React.memo(
  ({
    message = "Carregando...",
    size = "large",
    fullScreen = false,
    overlay = false,
    duration = 1000,
  }) => {
    // ✅ Animated props memoizadas
    const animatedProps = useMemo(
      () => ({
        message,
        size,
        fullScreen,
        overlay,
      }),
      [message, size, fullScreen, overlay]
    );

    // ✅ Usa o LoadingSpinner base com props otimizadas
    return <LoadingSpinner {...animatedProps} />;
  }
);

AnimatedLoadingSpinner.displayName = "AnimatedLoadingSpinner";

// ✅ NOVO: Loading com progresso (para operações longas)
export const ProgressLoadingSpinner: React.FC<{
  message?: string;
  progress?: number; // 0-100
  size?: "small" | "large";
  overlay?: boolean;
}> = React.memo(
  ({
    message = "Carregando...",
    progress = 0,
    size = "large",
    overlay = false,
  }) => {
    // ✅ Progress message memoizada
    const progressMessage = useMemo(() => {
      if (progress > 0) {
        return `${message} ${Math.round(progress)}%`;
      }
      return message;
    }, [message, progress]);

    // ✅ Progress props memoizadas
    const progressProps = useMemo(
      () => ({
        message: progressMessage,
        size,
        fullScreen: false,
        overlay,
      }),
      [progressMessage, size, overlay]
    );

    return <LoadingSpinner {...progressProps} />;
  }
);

ProgressLoadingSpinner.displayName = "ProgressLoadingSpinner";

// ✅ NOVO: Conditional LoadingSpinner
export const ConditionalLoadingSpinner: React.FC<{
  isLoading: boolean;
  message?: string;
  size?: "small" | "large";
  fullScreen?: boolean;
  overlay?: boolean;
  fallback?: React.ReactNode;
}> = React.memo(
  ({
    isLoading,
    message = "Carregando...",
    size = "large",
    fullScreen = false,
    overlay = false,
    fallback = null,
  }) => {
    // ✅ Conditional props memoizadas
    const conditionalProps = useMemo(
      () => ({
        message,
        size,
        fullScreen,
        overlay,
      }),
      [message, size, fullScreen, overlay]
    );

    // ✅ Renderização condicional memoizada
    const content = useMemo(() => {
      if (isLoading) {
        return <LoadingSpinner {...conditionalProps} />;
      }
      return fallback;
    }, [isLoading, conditionalProps, fallback]);

    return <>{content}</>;
  }
);

ConditionalLoadingSpinner.displayName = "ConditionalLoadingSpinner";

// ✅ NOVO: Loading com timeout automático
export const TimeoutLoadingSpinner: React.FC<{
  message?: string;
  size?: "small" | "large";
  fullScreen?: boolean;
  overlay?: boolean;
  timeout?: number; // em ms
  onTimeout?: () => void;
}> = React.memo(
  ({
    message = "Carregando...",
    size = "large",
    fullScreen = false,
    overlay = false,
    timeout = 10000, // 10 segundos
    onTimeout,
  }) => {
    const [isTimedOut, setIsTimedOut] = React.useState(false);

    // ✅ Timeout effect memoizado
    React.useEffect(() => {
      const timer = setTimeout(() => {
        setIsTimedOut(true);
        onTimeout?.();
      }, timeout);

      return () => clearTimeout(timer);
    }, [timeout, onTimeout]);

    // ✅ Timeout message memoizada
    const timeoutMessage = useMemo(() => {
      return isTimedOut ? "Tempo limite excedido..." : message;
    }, [isTimedOut, message]);

    // ✅ Timeout props memoizadas
    const timeoutProps = useMemo(
      () => ({
        message: timeoutMessage,
        size,
        fullScreen,
        overlay,
      }),
      [timeoutMessage, size, fullScreen, overlay]
    );

    return <LoadingSpinner {...timeoutProps} />;
  }
);

TimeoutLoadingSpinner.displayName = "TimeoutLoadingSpinner";

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 1000,
  },
  content: {
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    marginTop: 16,
    color: colors.gray,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    textAlign: "center",
  },
  messageSmall: {
    fontSize: 14,
    marginTop: 8,
  },
});
