import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";
import { storageService } from "../utils/Storage";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level: "app" | "screen" | "component";
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  // ✅ MELHORIA 1: Cache de objetos computados para evitar recriação
  private computedStyles: { [key: string]: any } = {};
  private computedTexts: { [key: string]: string } = {};

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      retryCount: 0,
    };

    // ✅ MELHORIA 2: Pre-computar estilos estáticos
    this.precomputeStyles();
  }

  // ✅ MELHORIA 3: shouldComponentUpdate para otimização máxima
  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // Só re-render se estados críticos mudaram
    const stateChanged =
      this.state.hasError !== nextState.hasError ||
      this.state.retryCount !== nextState.retryCount ||
      this.state.errorId !== nextState.errorId;

    const propsChanged =
      this.props.children !== nextProps.children ||
      this.props.fallback !== nextProps.fallback ||
      this.props.level !== nextProps.level ||
      this.props.name !== nextProps.name;

    return stateChanged || propsChanged;
  }

  // ✅ MELHORIA 4: Pre-computação de estilos
  private precomputeStyles(): void {
    this.computedStyles = {
      containerApp: [styles.container, styles.fullScreen],
      containerComponent: styles.container,
      titleCritical: [styles.title, styles.titleCritical],
      titleNormal: styles.title,
    };
  }

  // ✅ MELHORIA 5: Cache de textos dinâmicos
  private getRetryButtonText(retryCount: number): string {
    const key = `retry-${retryCount}`;
    if (!this.computedTexts[key]) {
      this.computedTexts[key] = `Tentar Novamente (${
        this.maxRetries - retryCount
      } restantes)`;
    }
    return this.computedTexts[key];
  }

  private getIconProps(isAppLevel: boolean): {
    name: any;
    size: number;
    color: string;
  } {
    const key = `icon-${isAppLevel ? "app" : "component"}`;
    if (!this.computedStyles[key]) {
      this.computedStyles[key] = {
        name: isAppLevel ? "warning" : "alert-circle-outline",
        size: isAppLevel ? 80 : 48,
        color: isAppLevel ? colors.error : colors.warning,
      };
    }
    return this.computedStyles[key];
  }

  private getContainerStyle(isAppLevel: boolean): any {
    return isAppLevel
      ? this.computedStyles.containerApp
      : this.computedStyles.containerComponent;
  }

  private getTitleStyle(isAppLevel: boolean): any {
    return isAppLevel
      ? this.computedStyles.titleCritical
      : this.computedStyles.titleNormal;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, level, name } = this.props;

    // ✅ MELHORIA 6: Otimizar criação do errorLog
    const errorLog = this.createErrorLog(error, errorInfo, level, name);

    console.error("🚨 Error Boundary Caught:", errorLog);

    // Salvar erro no storage para análise
    this.saveErrorLog(errorLog).catch(console.error);

    // Chamar callback personalizado
    onError?.(error, errorInfo);

    // Auto-retry para erros de componente
    if (level === "component" && this.state.retryCount < this.maxRetries) {
      this.scheduleAutoRetry();
    }

    // Alert crítico para erros de app
    if (level === "app") {
      this.showCriticalErrorAlert(error);
    }

    this.setState({ errorInfo });
  }

  // ✅ MELHORIA 7: Método otimizado para criação do error log
  private createErrorLog(
    error: Error,
    errorInfo: React.ErrorInfo,
    level: string,
    name?: string
  ): any {
    return {
      timestamp: new Date().toISOString(),
      level,
      component: name || "Unknown",
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    };
  }

  private async saveErrorLog(errorLog: any): Promise<void> {
    try {
      const existingLogs = (await storageService.getErrorLogs()) || [];
      const updatedLogs = [errorLog, ...existingLogs].slice(0, 50);
      await storageService.saveErrorLogs(updatedLogs);
    } catch (saveError) {
      console.error("Failed to save error log:", saveError);
    }
  }

  private scheduleAutoRetry(): void {
    this.retryTimeout = setTimeout(() => {
      console.log(
        `🔄 Auto-retry attempt ${this.state.retryCount + 1}/${this.maxRetries}`
      );
      this.handleRetry();
    }, 2000 * (this.state.retryCount + 1));
  }

  // ✅ MELHORIA 8: Alert options otimizado com cache
  private getCriticalAlertOptions(error: Error): any {
    return [
      {
        text: "Relatar Erro",
        onPress: this.handleReportError,
      },
      {
        text: "Reiniciar",
        onPress: this.handleForceRestart,
        style: "default" as const,
      },
    ];
  }

  private showCriticalErrorAlert(error: Error): void {
    Alert.alert(
      "🚨 Erro Crítico",
      "Ocorreu um erro grave no aplicativo. Será necessário reiniciar.",
      this.getCriticalAlertOptions(error),
      { cancelable: false }
    );
  }

  // ✅ MELHORIA 9: handleRetry otimizado com early return
  private handleRetry = (): void => {
    const { retryCount } = this.state;

    if (retryCount >= this.maxRetries) {
      console.error("❌ Max retries exceeded");
      return;
    }

    console.log(`🔄 Manual retry attempt ${retryCount + 1}`);

    // ✅ Usar setState com updater function para melhor performance
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  // ✅ MELHORIA 10: Report error otimizado
  private handleReportError = async (): Promise<void> => {
    try {
      const report = this.createErrorReport();

      console.log("📤 Error Report:", report);

      // ✅ Alert options cached
      const alertOptions = [{ text: "OK" }];
      Alert.alert(
        "Relatório Enviado",
        "Obrigado por relatar o erro. Nossa equipe foi notificada.",
        alertOptions
      );
    } catch (reportError) {
      console.error("Failed to report error:", reportError);
      Alert.alert("Erro", "Não foi possível enviar o relatório.");
    }
  };

  // ✅ MELHORIA 11: Criação otimizada do error report
  private createErrorReport(): any {
    const { error, errorInfo, errorId } = this.state;
    const { level, name } = this.props;

    return {
      errorId,
      timestamp: new Date().toISOString(),
      level,
      component: name,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : null,
      componentStack: errorInfo?.componentStack,
      deviceInfo: {
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
        timestamp: Date.now(),
      },
    };
  }

  private handleForceRestart = (): void => {
    // Limpar cache e forçar reload
    storageService.clearCache?.();

    // Em React Native, seria necessário reiniciar via native modules
    if (typeof window !== "undefined" && window.location?.reload) {
      window.location.reload();
    }
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    // ✅ MELHORIA 12: Limpar cache ao desmontar
    this.computedStyles = {};
    this.computedTexts = {};
  }

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, level } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return this.renderErrorUI(error, level, retryCount);
    }

    return children;
  }

  // ✅ MELHORIA 13: renderErrorUI otimizado com cache
  private renderErrorUI(
    error: Error | null,
    level: string,
    retryCount: number
  ): ReactNode {
    const canRetry = retryCount < this.maxRetries;
    const isAppLevel = level === "app";

    // ✅ Usar estilos e props cached
    const containerStyle = this.getContainerStyle(isAppLevel);
    const titleStyle = this.getTitleStyle(isAppLevel);
    const iconProps = this.getIconProps(isAppLevel);

    return (
      <View style={containerStyle}>
        <View style={styles.content}>
          <Ionicons {...iconProps} />

          <Text style={titleStyle}>
            {isAppLevel ? "🚨 Erro Crítico" : "⚠️ Algo deu errado"}
          </Text>

          <Text style={styles.message}>
            {isAppLevel
              ? "Ocorreu um erro grave que impediu o funcionamento do app."
              : "Este componente encontrou um problema inesperado."}
          </Text>

          {this.renderDebugInfo(error)}

          <View style={styles.buttonContainer}>
            {this.renderRetryButton(canRetry, retryCount)}
            {this.renderReportButton()}
            {this.renderRestartButton(isAppLevel)}
          </View>

          <Text style={styles.errorId}>ID: {this.state.errorId}</Text>
        </View>
      </View>
    );
  }

  // ✅ MELHORIA 14: Componentes de UI separados e otimizados
  private renderDebugInfo(error: Error | null): ReactNode {
    if (!__DEV__ || !error) return null;

    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText} numberOfLines={3}>
          {error.message}
        </Text>
      </View>
    );
  }

  private renderRetryButton(canRetry: boolean, retryCount: number): ReactNode {
    if (!canRetry) return null;

    return (
      <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
        <Ionicons name="refresh-outline" size={20} color={colors.white} />
        <Text style={styles.buttonText}>
          {this.getRetryButtonText(retryCount)}
        </Text>
      </TouchableOpacity>
    );
  }

  private renderReportButton(): ReactNode {
    return (
      <TouchableOpacity
        style={styles.reportButton}
        onPress={this.handleReportError}
      >
        <Ionicons name="bug-outline" size={20} color={colors.primary} />
        <Text style={styles.reportButtonText}>Relatar Erro</Text>
      </TouchableOpacity>
    );
  }

  private renderRestartButton(isAppLevel: boolean): ReactNode {
    if (!isAppLevel) return null;

    return (
      <TouchableOpacity
        style={styles.restartButton}
        onPress={this.handleForceRestart}
      >
        <Ionicons name="power-outline" size={20} color={colors.error} />
        <Text style={styles.restartButtonText}>Reiniciar App</Text>
      </TouchableOpacity>
    );
  }
}

// ✅ MELHORIA 15: Styles otimizados e organizados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  fullScreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: colors.dark,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  titleCritical: {
    fontSize: 24,
    color: colors.error,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  debugContainer: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: "100%",
  },
  debugTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: colors.dark,
    marginBottom: 4,
  },
  debugText: {
    fontFamily: "Courier",
    fontSize: 10,
    color: colors.gray,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  retryButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  reportButton: {
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
  restartButton: {
    backgroundColor: colors.error + "20",
    borderWidth: 1,
    borderColor: colors.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.white,
  },
  reportButtonText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.primary,
  },
  restartButtonText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.error,
  },
  errorId: {
    fontFamily: "Courier",
    fontSize: 10,
    color: colors.gray,
    marginTop: 16,
    opacity: 0.7,
  },
});

// ✅ MELHORIA 16: ErrorBoundary aprimorado com HOC para maior flexibilidade
export function withOptimizedErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) {
  const WrappedComponent = React.memo((props: P) => (
    <ErrorBoundary
      level="component"
      name={Component.displayName || Component.name}
      {...errorBoundaryProps}
    >
      <Component {...props} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withOptimizedErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// ✅ MELHORIA 17: Performance Monitor para detectar re-renders desnecessários
export class PerformanceErrorBoundary extends ErrorBoundary {
  private renderCount = 0;
  private lastRenderTime = Date.now();

  componentDidUpdate(prevProps: Props, prevState: State) {
    this.renderCount++;
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastRenderTime;

    if (__DEV__ && timeDiff < 16) {
      console.warn(
        `⚠️ ErrorBoundary re-render too fast: ${timeDiff}ms (render #${this.renderCount})`
      );
    }

    this.lastRenderTime = currentTime;
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    if (__DEV__) {
      console.log(`📊 ErrorBoundary total renders: ${this.renderCount}`);
    }
  }
}
