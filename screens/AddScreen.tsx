import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useMemo } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { ErrorState } from "../components/ErrorState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { MotivationalCard } from "../components/MotivationalCard";
import { ScreenErrorBoundary } from "../components/ScreenErrorBoundary";
import { useErrorHandler } from "../hooks/useErrorHandler";
import {
  useMeasurementRecords,
  usePreloadData,
  useStorageStats,
  useWeightRecords,
} from "../hooks/useStorage";
import { colors } from "../styles/colors";

// ✅ Types
type AddStackParamList = {
  AddMain: undefined;
  WeightInput: undefined;
  MeasurementsInput: undefined;
};

type AddScreenNavigationProp = StackNavigationProp<
  AddStackParamList,
  "AddMain"
>;

interface ButtonSuggestion {
  type: "weight" | "measurement";
  priority: "high" | "normal";
  title: string;
  subtitle: string;
  variant: "primary" | "secondary";
}

interface MotivationalMessageData {
  message: string;
  icon: "star-outline" | "scale-outline" | "body-outline";
}

interface DataStats {
  totalRecords: number;
  weightCount: number;
  measurementCount: number;
  daysSinceWeight: number | null;
  daysSinceMeasurement: number | null;
  hasWeightData: boolean;
  hasMeasurementData: boolean;
  hasValidData: boolean;
  lastWeightDate: string | null;
  lastMeasurementDate: string | null;
}

const AddScreenContent: React.FC = () => {
  const navigation = useNavigation<AddScreenNavigationProp>();

  // ✅ Error handling configurado
  const errorHandler = useErrorHandler({
    maxRetries: 3,
    showUserFriendlyMessages: true,
    onError: (error) => {
      console.error("AddScreen Error:", error);
    },
  });

  // ✅ Hooks com error handling adequado
  const { preloaded, preloadError } = usePreloadData();
  const { stats, error: statsError } = useStorageStats();

  const {
    records: weightRecords,
    loading: weightLoading,
    error: weightError,
    lastUpdate: weightLastUpdate,
  } = useWeightRecords();

  const {
    records: measurementRecords,
    loading: measurementLoading,
    error: measurementError,
    lastUpdate: measurementLastUpdate,
  } = useMeasurementRecords();

  // ✅ MELHORIA 1: Função helper para extrair mensagem de erro - PERFEITAMENTE ESTÁVEL
  const extractErrorMessage = useCallback((error: any): string => {
    if (!error) return "";

    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    if (error?.message && typeof error.message === "string")
      return error.message;
    if (error?.message instanceof Error) return error.message.message;

    try {
      return JSON.stringify(error);
    } catch {
      return "Erro desconhecido";
    }
  }, []); // ✅ Sem dependências - função pura

  // ✅ MELHORIA 2: Agrupar todos os erros em um objeto estável
  const allErrors = useMemo(
    () => ({
      weight: weightError,
      measurement: measurementError,
      preload: preloadError,
      stats: statsError,
    }),
    [weightError, measurementError, preloadError, statsError]
  );

  // ✅ MELHORIA 3: Estados de erro simplificados
  const errorStates = useMemo(
    () => ({
      hasErrorHandlerError: errorHandler.hasError,
      hasAnyDataError: Object.values(allErrors).some(Boolean),
    }),
    [errorHandler.hasError, allErrors]
  );

  // ✅ MELHORIA 4: getErrorMessage OTIMIZADO - apenas 3 dependências
  const getErrorMessage = useCallback((): string => {
    // Prioridade 1: Error handler
    if (errorStates.hasErrorHandlerError && errorHandler.error) {
      return errorHandler.getErrorMessage(errorHandler.error);
    }

    // Prioridade 2: Erros de dados
    const errorMappings = [
      {
        key: "weight",
        error: allErrors.weight,
        fallback: "Erro nos dados de peso",
      },
      {
        key: "measurement",
        error: allErrors.measurement,
        fallback: "Erro nos dados de medidas",
      },
      {
        key: "preload",
        error: allErrors.preload,
        fallback: "Erro no pré-carregamento",
      },
      {
        key: "stats",
        error: allErrors.stats,
        fallback: "Erro nas estatísticas",
      },
    ];

    for (const { error, fallback } of errorMappings) {
      if (error) {
        const message = extractErrorMessage(error);
        return message || fallback;
      }
    }

    return "Erro desconhecido";
  }, [
    errorStates.hasErrorHandlerError,
    errorHandler,
    allErrors,
    extractErrorMessage,
  ]);

  // ✅ MELHORIA 5: Memoizar estatísticas dos dados com validação robusta
  const dataStats = useMemo((): DataStats => {
    try {
      const validWeightRecords = Array.isArray(weightRecords)
        ? weightRecords
        : [];
      const validMeasurementRecords = Array.isArray(measurementRecords)
        ? measurementRecords
        : [];

      const totalRecords =
        validWeightRecords.length + validMeasurementRecords.length;
      const lastWeightDate = validWeightRecords[0]?.date || null;
      const lastMeasurementDate = validMeasurementRecords[0]?.date || null;

      const calculateDaysSince = (dateString: string | null): number | null => {
        if (!dateString) return null;

        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return null;

          return Math.floor(
            (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
          );
        } catch {
          return null;
        }
      };

      const daysSinceWeight = calculateDaysSince(lastWeightDate);
      const daysSinceMeasurement = calculateDaysSince(lastMeasurementDate);

      return {
        totalRecords,
        weightCount: validWeightRecords.length,
        measurementCount: validMeasurementRecords.length,
        daysSinceWeight,
        daysSinceMeasurement,
        hasWeightData: validWeightRecords.length > 0,
        hasMeasurementData: validMeasurementRecords.length > 0,
        hasValidData: totalRecords > 0,
        lastWeightDate,
        lastMeasurementDate,
      };
    } catch (error) {
      console.error("Error calculating dataStats:", error);
      return {
        totalRecords: 0,
        weightCount: 0,
        measurementCount: 0,
        daysSinceWeight: null,
        daysSinceMeasurement: null,
        hasWeightData: false,
        hasMeasurementData: false,
        hasValidData: false,
        lastWeightDate: null,
        lastMeasurementDate: null,
      };
    }
  }, [weightRecords, measurementRecords]);

  // ✅ MELHORIA 6: Extrair apenas campos específicos do stats
  const relevantStats = useMemo(
    () => ({
      cacheHitRate: stats?.cache?.hitRate || 0,
      cacheSize: stats?.cache?.size || 0,
      healthScore: stats?.health?.score || 100,
      healthIssues: stats?.health?.issues || [],
      totalSize: stats?.storage?.totalSize || "0KB",
      averageResponseTime: stats?.performance?.averageResponseTime || 0,
    }),
    [
      stats?.cache?.hitRate,
      stats?.cache?.size,
      stats?.health?.score,
      stats?.health?.issues,
      stats?.storage?.totalSize,
      stats?.performance?.averageResponseTime,
    ]
  );

  // ✅ MELHORIA 7: navigationData apenas com campos essenciais
  const navigationData = useMemo(
    () => ({
      totalRecords: dataStats.totalRecords,
      hasValidData: dataStats.hasValidData,
    }),
    [dataStats.totalRecords, dataStats.hasValidData]
  );

  // ✅ MELHORIA 8: handleNavigation com dependências MÍNIMAS
  const handleNavigation = useCallback(
    async (screen: keyof AddStackParamList, title: string) => {
      try {
        await errorHandler.withErrorHandling(async () => {
          if (!navigation) {
            throw new Error("Navigation not available");
          }

          console.log(`📱 Navigating to ${screen}:`, {
            timestamp: new Date().toISOString(),
            from: "AddScreen",
            dataStats: navigationData,
          });

          navigation.navigate(screen);
        }, `Navigate to ${title}`);
      } catch (error) {
        console.error(`Navigation error to ${screen}:`, error);

        Alert.alert(
          "Erro de Navegação",
          `Não foi possível abrir ${title}. Tente novamente.`,
          [
            { text: "OK" },
            {
              text: "Tentar Novamente",
              onPress: () => handleNavigation(screen, title),
            },
          ]
        );
      }
    },
    [navigation, errorHandler, navigationData] // ✅ Apenas 3 dependências estáveis
  );

  // ✅ MELHORIA 9: callbacks de navegação estáveis
  const navigationCallbacks = useMemo(
    () => ({
      handleWeightInput: () =>
        handleNavigation("WeightInput", "Adicionar Peso"),
      handleMeasurementsInput: () =>
        handleNavigation("MeasurementsInput", "Adicionar Medidas"),
    }),
    [handleNavigation]
  );

  // ✅ MELHORIA 10: handlePhotoProgress com dependências mínimas
  const handlePhotoProgress = useCallback(() => {
    try {
      Alert.alert(
        "Em Breve! 📸",
        "A funcionalidade de fotos de progresso estará disponível em breve!",
        [
          {
            text: "OK",
            onPress: () => {
              console.log("📊 Feature Request: Photo Progress", {
                timestamp: new Date().toISOString(),
                userStats: navigationData,
              });
            },
          },
        ]
      );
    } catch (error) {
      errorHandler.captureError(error as Error, "Photo Progress Alert");
    }
  }, [navigationData, errorHandler]);

  // ✅ MELHORIA 11: Estados de mensagem motivacional separados
  const motivationalConditions = useMemo(
    () => ({
      isFirstTime: !dataStats.hasValidData || dataStats.totalRecords === 0,
      needsWeightUpdate:
        dataStats.daysSinceWeight !== null && dataStats.daysSinceWeight > 7,
      needsMeasurementUpdate:
        dataStats.daysSinceMeasurement !== null &&
        dataStats.daysSinceMeasurement > 14,
    }),
    [
      dataStats.hasValidData,
      dataStats.totalRecords,
      dataStats.daysSinceWeight,
      dataStats.daysSinceMeasurement,
    ]
  );

  // ✅ MELHORIA 12: motivationalMessage com dependências otimizadas
  const motivationalMessage = useMemo((): MotivationalMessageData => {
    try {
      if (motivationalConditions.isFirstTime) {
        return {
          message: "Comece sua jornada! Registre seu primeiro dado! 🚀",
          icon: "star-outline",
        };
      }

      if (motivationalConditions.needsWeightUpdate) {
        return {
          message: "Que tal registrar seu peso? Já faz uma semana! ⚖️",
          icon: "scale-outline",
        };
      }

      if (motivationalConditions.needsMeasurementUpdate) {
        return {
          message: "Suas medidas estão esperando por uma atualização! 📏",
          icon: "body-outline",
        };
      }

      return {
        message: "Registrar é o primeiro passo para o sucesso! 💪",
        icon: "star-outline",
      };
    } catch (error) {
      console.error("Error generating motivational message:", error);
      errorHandler.captureError(error as Error, "Motivational Message");
      return {
        message: "Continue registrando seus progressos! 💪",
        icon: "star-outline",
      };
    }
  }, [motivationalConditions, errorHandler]);

  // ✅ MELHORIA 13: Dados específicos para sugestões de botões
  const buttonData = useMemo(
    () => ({
      weightCount: dataStats.weightCount,
      measurementCount: dataStats.measurementCount,
      daysSinceWeight: dataStats.daysSinceWeight,
      daysSinceMeasurement: dataStats.daysSinceMeasurement,
    }),
    [
      dataStats.weightCount,
      dataStats.measurementCount,
      dataStats.daysSinceWeight,
      dataStats.daysSinceMeasurement,
    ]
  );

  // ✅ MELHORIA 14: buttonSuggestions com dependências mínimas
  const buttonSuggestions = useMemo((): ButtonSuggestion[] => {
    try {
      const suggestions: ButtonSuggestion[] = [];

      // Botão de peso
      const weightPriority =
        buttonData.weightCount === 0 ||
        (buttonData.daysSinceWeight !== null && buttonData.daysSinceWeight > 3)
          ? "high"
          : "normal";

      const weightSubtitle =
        buttonData.weightCount === 0
          ? "Primeiro registro"
          : buttonData.daysSinceWeight !== null
          ? `${buttonData.daysSinceWeight} dias atrás`
          : "Registrar peso";

      suggestions.push({
        type: "weight",
        priority: weightPriority,
        title: "⚖️ Adicionar Peso",
        subtitle: weightSubtitle,
        variant: "primary",
      });

      // Botão de medidas
      const measurementPriority =
        buttonData.measurementCount === 0 ||
        (buttonData.daysSinceMeasurement !== null &&
          buttonData.daysSinceMeasurement > 7)
          ? "high"
          : "normal";

      const measurementSubtitle =
        buttonData.measurementCount === 0
          ? "Primeiro registro"
          : buttonData.daysSinceMeasurement !== null
          ? `${buttonData.daysSinceMeasurement} dias atrás`
          : "Registrar medidas";

      suggestions.push({
        type: "measurement",
        priority: measurementPriority,
        title: "📏 Adicionar Medidas",
        subtitle: measurementSubtitle,
        variant: "secondary",
      });

      return suggestions;
    } catch (error) {
      console.error("Error generating button suggestions:", error);
      // Fallback robusto
      return [
        {
          type: "weight",
          priority: "high",
          title: "⚖️ Adicionar Peso",
          subtitle: "Registrar peso",
          variant: "primary",
        },
        {
          type: "measurement",
          priority: "normal",
          title: "📏 Adicionar Medidas",
          subtitle: "Registrar medidas",
          variant: "secondary",
        },
      ];
    }
  }, [buttonData]);

  // ✅ MELHORIA 15: handleRetryAll estável
  const handleRetryAll = useCallback(() => {
    try {
      console.log("🔄 Retrying all data loading...");
      errorHandler.clearError();
    } catch (error) {
      console.error("Error during retry:", error);
    }
  }, [errorHandler]);

  // ✅ MELHORIA 16: Estados computados mais específicos
  const loadingStates = useMemo(
    () => ({
      isWeightLoading: weightLoading,
      isMeasurementLoading: measurementLoading,
      isAnyLoading: weightLoading || measurementLoading,
    }),
    [weightLoading, measurementLoading]
  );

  const computedStates = useMemo(
    () => ({
      isLoading: loadingStates.isAnyLoading,
      hasError: errorStates.hasAnyDataError,
      hasCriticalError:
        errorStates.hasAnyDataError && !dataStats.hasValidData && !preloaded,
    }),
    [
      loadingStates.isAnyLoading,
      errorStates.hasAnyDataError,
      dataStats.hasValidData,
      preloaded,
    ]
  );

  // ✅ MELHORIA 17: Props memoizadas para componentes
  const motivationalCardProps = useMemo(
    () => ({
      message: motivationalMessage.message,
      icon: motivationalMessage.icon,
    }),
    [motivationalMessage.message, motivationalMessage.icon]
  );

  // ✅ MELHORIA 18: Debug info com campos específicos
  const debugInfo = useMemo(
    () => ({
      loading: loadingStates,
      computed: computedStates,
      preloaded,
      buttonCount: buttonSuggestions.length,
      dataStats: {
        total: dataStats.totalRecords,
        weight: dataStats.weightCount,
        measurement: dataStats.measurementCount,
        hasData: dataStats.hasValidData,
      },
      stats: {
        cache: `${relevantStats.cacheSize} itens, ${relevantStats.cacheHitRate}% hit rate`,
        storage: relevantStats.totalSize,
        performance: `${relevantStats.averageResponseTime}ms avg`,
        health: `${relevantStats.healthScore}% (${relevantStats.healthIssues.length} issues)`,
      },
      error: {
        hasError: errorHandler.hasError,
        message: errorHandler.error?.message || null,
      },
    }),
    [
      loadingStates,
      computedStates,
      preloaded,
      buttonSuggestions.length,
      dataStats.totalRecords,
      dataStats.weightCount,
      dataStats.measurementCount,
      dataStats.hasValidData,
      relevantStats,
      errorHandler.hasError,
      errorHandler.error?.message,
    ]
  );

  // ✅ Loading inicial
  if (computedStates.isLoading && !preloaded) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen message="Carregando dados..." />
      </SafeAreaView>
    );
  }

  // ✅ Estado de erro crítico
  if (computedStates.hasCriticalError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          fullScreen
          message={getErrorMessage()}
          onRetry={handleRetryAll}
          title="Erro ao Carregar Dados"
          icon="warning-outline"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading overlay */}
      {errorHandler.isRecovering && (
        <LoadingSpinner overlay message="Recuperando dados..." size="large" />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Registrar Progresso</Text>
          <Text style={styles.subtitle}>
            O que você gostaria de registrar hoje? 📝
          </Text>

          {/* Estatísticas de uso */}
          {dataStats.hasValidData && dataStats.totalRecords > 0 && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                📊 {dataStats.totalRecords} registro
                {dataStats.totalRecords !== 1 ? "s" : ""} total
              </Text>
              {relevantStats.cacheHitRate > 0 && (
                <Text style={styles.cacheText}>
                  ⚡ Cache: {relevantStats.cacheHitRate}%
                </Text>
              )}
            </View>
          )}

          {/* Indicadores de saúde do sistema */}
          {relevantStats.healthScore < 70 && (
            <View style={styles.healthWarning}>
              <Text style={styles.healthWarningText}>
                ⚠️ Sistema: {relevantStats.healthScore}% -{" "}
                {relevantStats.healthIssues[0] || "Problemas detectados"}
              </Text>
            </View>
          )}
        </View>

        {/* Card motivacional */}
        <MotivationalCard {...motivationalCardProps} />

        {/* Botões principais */}
        <View style={styles.buttonContainer}>
          {buttonSuggestions.map((suggestion) => (
            <View key={suggestion.type} style={styles.buttonWrapper}>
              <Button
                title={suggestion.title}
                onPress={
                  suggestion.type === "weight"
                    ? navigationCallbacks.handleWeightInput
                    : navigationCallbacks.handleMeasurementsInput
                }
                variant={suggestion.variant}
                size="large"
                style={styles.button}
                disabled={errorHandler.isRecovering}
              />
              {suggestion.subtitle && (
                <Text
                  style={[
                    styles.buttonSubtitle,
                    suggestion.priority === "high" && styles.buttonSubtitleHigh,
                  ]}
                >
                  {suggestion.subtitle}
                </Text>
              )}
            </View>
          ))}

          {/* Botão de foto */}
          <Button
            title="📸 Foto de Progresso"
            onPress={handlePhotoProgress}
            variant="outline"
            size="large"
            style={styles.button}
            disabled={errorHandler.isRecovering}
          />
        </View>

        {/* Error display */}
        {computedStates.hasError && dataStats.hasValidData && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={24} color={colors.warning} />
            <View style={styles.errorText}>
              <Text style={styles.errorTitle}>Erro Parcial</Text>
              <Text style={styles.errorMessage}>{getErrorMessage()}</Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryAll}
              accessible
              accessibilityLabel="Tentar novamente"
              accessibilityRole="button"
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Debug info */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>🔧 Debug Info:</Text>
            <Text style={styles.debugText}>
              Buttons: {debugInfo.buttonCount} suggestions
            </Text>
            <Text style={styles.debugText}>
              Data: {debugInfo.dataStats.total} records
            </Text>
            <Text style={styles.debugText}>
              Weight: {debugInfo.dataStats.weight} | Measurements:{" "}
              {debugInfo.dataStats.measurement}
            </Text>
            <Text style={styles.debugText}>Cache: {debugInfo.stats.cache}</Text>
            <Text style={styles.debugText}>
              Storage: {debugInfo.stats.storage}
            </Text>
            <Text style={styles.debugText}>
              Performance: {debugInfo.stats.performance}
            </Text>
            <Text style={styles.debugText}>
              Health: {debugInfo.stats.health}
            </Text>
            {debugInfo.error.hasError && (
              <Text style={[styles.debugText, { color: colors.error }]}>
                Error: {debugInfo.error.message || "Unknown"}
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// ✅ Styles otimizados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: colors.dark,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.gray,
    textAlign: "center",
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  statsText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.primary,
  },
  cacheText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    fontStyle: "italic",
  },
  healthWarning: {
    backgroundColor: colors.warning + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  healthWarningText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: colors.warning,
    textAlign: "center",
  },
  buttonContainer: {
    gap: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  buttonWrapper: {
    alignItems: "center",
  },
  button: {
    width: "100%",
    minHeight: 56,
  },
  buttonSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
    textAlign: "center",
  },
  buttonSubtitleHigh: {
    color: colors.primary,
    fontWeight: "600",
  },
  errorCard: {
    backgroundColor: colors.error + "20",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
  },
  errorTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.error,
  },
  errorMessage: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  retryButton: {
    padding: 8,
  },
  debugContainer: {
    marginTop: 32,
    padding: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  debugTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: colors.dark,
    marginBottom: 4,
  },
  debugText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: colors.gray,
    marginVertical: 1,
  },
});

// ✅ Wrapper com Error Boundary
const AddScreen: React.FC = () => {
  return (
    <ScreenErrorBoundary screenName="Adicionar">
      <AddScreenContent />
    </ScreenErrorBoundary>
  );
};

export default AddScreen;
