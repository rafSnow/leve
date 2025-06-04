import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorState } from "../components/ErrorState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ScreenErrorBoundary } from "../components/ScreenErrorBoundary";
import { useErrorHandler } from "../hooks/useErrorHandler";
import {
  useMeasurementRecords,
  usePreloadData,
  useWeightRecords,
} from "../hooks/useStorage";
import { colors } from "../styles/colors";
import { MeasurementRecord, WeightRecord } from "../types";
import { CalculationUtils } from "../utils/Calculations";

interface HistoryItem {
  id: string;
  type: "weight" | "measurement";
  date: string;
  data: WeightRecord | MeasurementRecord;
}

const HistoryScreenContent: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Error handling configurado
  const errorHandler = useErrorHandler({
    maxRetries: 3,
    showUserFriendlyMessages: true,
    onError: (error) => {
      console.error("HistoryScreen Error:", error);
    },
  });

  // ✅ Hooks com error handling adequado
  const { preloaded, preloadError } = usePreloadData();

  const {
    records: weightRecords,
    loading: weightLoading,
    error: weightError,
    refresh: refreshWeight,
    lastUpdate: weightLastUpdate,
  } = useWeightRecords();

  const {
    records: measurementRecords,
    loading: measurementLoading,
    error: measurementError,
    refresh: refreshMeasurements,
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
    }),
    [weightError, measurementError, preloadError]
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
        fallback: "Erro ao carregar registros de peso",
      },
      {
        key: "measurement",
        error: allErrors.measurement,
        fallback: "Erro ao carregar registros de medidas",
      },
      {
        key: "preload",
        error: allErrors.preload,
        fallback: "Erro no pré-carregamento",
      },
    ];

    for (const { error, fallback } of errorMappings) {
      if (error) {
        const message = extractErrorMessage(error);
        return message || fallback;
      }
    }

    return "Erro ao carregar histórico";
  }, [
    errorStates.hasErrorHandlerError,
    errorHandler,
    allErrors,
    extractErrorMessage,
  ]);

  // ✅ MELHORIA 5: Estados computados memoizados
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
      hasAnyError: errorStates.hasAnyDataError,
    }),
    [loadingStates.isAnyLoading, errorStates.hasAnyDataError]
  );

  // ✅ MELHORIA 6: Callbacks de refresh otimizados
  const refreshCallbacks = useMemo(
    () => ({
      refreshWeight,
      refreshMeasurements,
    }),
    [refreshWeight, refreshMeasurements]
  );

  // ✅ MELHORIA 7: handleRefresh com dependências mínimas
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await errorHandler.withErrorHandling(async () => {
        await Promise.all([
          refreshCallbacks.refreshWeight(),
          refreshCallbacks.refreshMeasurements(),
        ]);
      }, "Refresh History Data");
    } catch (error) {
      console.error("Error refreshing history:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshCallbacks, errorHandler]);

  // ✅ MELHORIA 8: handleRetry otimizado
  const handleRetry = useCallback(async () => {
    try {
      await errorHandler.withErrorHandling(async () => {
        console.log("🔄 Retrying history data loading...");
        await Promise.all([
          refreshCallbacks.refreshWeight(),
          refreshCallbacks.refreshMeasurements(),
        ]);
      }, "Retry History Data");
    } catch (error) {
      console.error("Retry failed:", error);
    }
  }, [refreshCallbacks, errorHandler]);

  const handleRetryAll = useCallback(() => {
    errorHandler.clearError();
    handleRetry();
  }, [errorHandler, handleRetry]);

  // ✅ MELHORIA 9: allRecords memoizado com validação robusta
  const allRecords = useMemo(() => {
    try {
      const validWeightRecords = Array.isArray(weightRecords)
        ? weightRecords
        : [];
      const validMeasurementRecords = Array.isArray(measurementRecords)
        ? measurementRecords
        : [];

      const combined: HistoryItem[] = [
        ...validWeightRecords.map((record) => ({
          id: `weight-${record.id}`,
          type: "weight" as const,
          date: record.date,
          data: record,
        })),
        ...validMeasurementRecords.map((record) => ({
          id: `measurement-${record.id}`,
          type: "measurement" as const,
          date: record.date,
          data: record,
        })),
      ];

      return combined.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      errorHandler.captureError(error as Error, "History Records Processing");
      return [];
    }
  }, [weightRecords, measurementRecords, errorHandler]);

  // ✅ MELHORIA 10: Estados derivados memoizados
  const derivedStates = useMemo(
    () => ({
      hasData: allRecords.length > 0,
      totalRecords: allRecords.length,
      hasCriticalError:
        computedStates.hasAnyError && allRecords.length === 0 && !preloaded,
    }),
    [allRecords.length, computedStates.hasAnyError, preloaded]
  );

  // ✅ MELHORIA 11: Labels memoizados para medidas
  const measurementLabels = useMemo(
    () => ({
      chest: "Peito",
      waist: "Cintura",
      hip: "Quadril",
      thigh: "Coxa",
      arm: "Braço",
    }),
    []
  );

  // ✅ MELHORIA 12: renderWeightItem otimizado
  const renderWeightItem = useCallback(
    (record: WeightRecord) => {
      try {
        return (
          <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={styles.recordIcon}>
                <Ionicons
                  name="scale-outline"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordTitle}>Peso Registrado</Text>
                <Text style={styles.recordDate}>
                  {CalculationUtils.formatDate(record.date)}
                </Text>
              </View>
              <Text style={styles.recordValue}>{record.weight}kg</Text>
            </View>
            {record.notes && (
              <Text style={styles.recordNotes}>{record.notes}</Text>
            )}
          </View>
        );
      } catch (error) {
        errorHandler.captureError(error as Error, "Weight Item Render");
        return (
          <View style={styles.errorItem}>
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <Text style={styles.errorItemText}>Erro ao exibir registro</Text>
          </View>
        );
      }
    },
    [errorHandler]
  );

  // ✅ MELHORIA 13: renderMeasurementItem otimizado
  const renderMeasurementItem = useCallback(
    (record: MeasurementRecord) => {
      try {
        const measurements = Object.entries(record.measurements)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => {
            const label =
              measurementLabels[key as keyof typeof measurementLabels] || key;
            return `${label}: ${value}cm`;
          });

        return (
          <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={styles.recordIcon}>
                <Ionicons
                  name="body-outline"
                  size={24}
                  color={colors.secondary}
                />
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordTitle}>Medidas Registradas</Text>
                <Text style={styles.recordDate}>
                  {CalculationUtils.formatDate(record.date)}
                </Text>
              </View>
              <Text style={styles.measurementCount}>
                {measurements.length} medida
                {measurements.length !== 1 ? "s" : ""}
              </Text>
            </View>

            <View style={styles.measurementsList}>
              {measurements.map((measurement, index) => (
                <Text key={index} style={styles.measurementItem}>
                  • {measurement}
                </Text>
              ))}
            </View>
            {record.notes && (
              <Text style={styles.recordNotes}>{record.notes}</Text>
            )}
          </View>
        );
      } catch (error) {
        errorHandler.captureError(error as Error, "Measurement Item Render");
        return (
          <View style={styles.errorItem}>
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <Text style={styles.errorItemText}>Erro ao exibir medidas</Text>
          </View>
        );
      }
    },
    [measurementLabels, errorHandler]
  );

  // ✅ MELHORIA 14: renderHistoryItem otimizado
  const renderHistoryItem = useCallback(
    ({ item }: { item: HistoryItem }) => {
      try {
        if (item.type === "weight") {
          return renderWeightItem(item.data as WeightRecord);
        } else {
          return renderMeasurementItem(item.data as MeasurementRecord);
        }
      } catch (error) {
        errorHandler.captureError(error as Error, "History Item Render");
        return (
          <View style={styles.errorItem}>
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <Text style={styles.errorItemText}>Erro ao exibir item</Text>
          </View>
        );
      }
    },
    [renderWeightItem, renderMeasurementItem, errorHandler]
  );

  // ✅ MELHORIA 15: keyExtractor otimizado
  const keyExtractor = useCallback(
    (item: HistoryItem) => {
      try {
        return item.id;
      } catch (error) {
        errorHandler.captureError(error as Error, "Key Extractor");
        return `error-${Math.random().toString(36).substr(2, 9)}`;
      }
    },
    [errorHandler]
  );

  // ✅ MELHORIA 16: Dados de exportação memoizados
  const exportData = useMemo(
    () => ({
      totalRecords: derivedStates.totalRecords,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }),
    [derivedStates.totalRecords]
  );

  // ✅ MELHORIA 17: handleExportHistory otimizado
  const handleExportHistory = useCallback(async () => {
    try {
      await errorHandler.withErrorHandling(async () => {
        console.log("📤 Exporting history...");

        const fullExportData = {
          weightRecords,
          measurementRecords,
          ...exportData,
        };

        Alert.alert(
          "Exportar Histórico",
          `${derivedStates.totalRecords} registros prontos para exportação.\n\nEm breve você poderá compartilhar ou salvar seus dados!`,
          [
            { text: "OK" },
            {
              text: "Copiar JSON",
              onPress: () => {
                console.log(
                  "📋 History Export Data:",
                  JSON.stringify(fullExportData, null, 2)
                );
                Alert.alert(
                  "Dados copiados",
                  "Verifique o console para os dados JSON"
                );
              },
            },
          ]
        );
      }, "Export History");
    } catch (error) {
      console.error("Export failed:", error);
    }
  }, [
    weightRecords,
    measurementRecords,
    exportData,
    derivedStates.totalRecords,
    errorHandler,
  ]);

  // ✅ MELHORIA 18: Update indicators memoizados
  const updateIndicators = useMemo(() => {
    const indicators = [];
    if (weightLastUpdate > 0) {
      indicators.push({
        icon: "⚖️",
        time: new Date(weightLastUpdate).toLocaleTimeString("pt-BR"),
      });
    }
    if (measurementLastUpdate > 0) {
      indicators.push({
        icon: "📏",
        time: new Date(measurementLastUpdate).toLocaleTimeString("pt-BR"),
      });
    }
    return indicators;
  }, [weightLastUpdate, measurementLastUpdate]);

  // ✅ MELHORIA 19: Props para componentes memoizadas
  const refreshControlProps = useMemo(
    () => ({
      refreshing: isRefreshing,
      onRefresh: handleRefresh,
      colors: [colors.primary],
      tintColor: colors.primary,
      title: "Atualizando...",
      titleColor: colors.gray,
    }),
    [isRefreshing, handleRefresh]
  );

  const flatListProps = useMemo(
    () => ({
      removeClippedSubviews: true,
      maxToRenderPerBatch: 10,
      updateCellsBatchingPeriod: 50,
      initialNumToRender: 10,
      windowSize: 10,
      onScrollToIndexFailed: (info: any) => {
        errorHandler.captureError(
          new Error(`Scroll to index failed: ${info.index}`),
          "FlatList Scroll"
        );
      },
    }),
    [errorHandler]
  );

  const exportButtonProps = useMemo(
    () => ({
      style: styles.exportButton,
      onPress: handleExportHistory,
      disabled: errorHandler.isRecovering,
    }),
    [handleExportHistory, errorHandler.isRecovering]
  );

  const refreshButtonProps = useMemo(
    () => ({
      style: styles.refreshButton,
      onPress: handleRefresh,
      disabled: errorHandler.isRecovering,
    }),
    [handleRefresh, errorHandler.isRecovering]
  );

  // ✅ MELHORIA 20: Debug info memoizado
  const debugInfo = useMemo(
    () => ({
      loading: loadingStates,
      computed: computedStates,
      derived: derivedStates,
      preloaded,
      refreshing: isRefreshing,
      updateIndicators: updateIndicators.length,
      error: {
        hasError: errorHandler.hasError,
        message: errorHandler.error?.message || null,
      },
    }),
    [
      loadingStates,
      computedStates,
      derivedStates,
      preloaded,
      isRefreshing,
      updateIndicators.length,
      errorHandler.hasError,
      errorHandler.error?.message,
    ]
  );

  // ✅ Debug log otimizado
  console.log("🔍 HistoryScreen Debug:", debugInfo);

  // Loading inicial
  if (computedStates.isLoading && !isRefreshing && !preloaded) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen message="Carregando histórico..." />
      </SafeAreaView>
    );
  }

  // Estado de erro crítico
  if (derivedStates.hasCriticalError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          fullScreen
          message={getErrorMessage()}
          onRetry={handleRetryAll}
          title="Erro ao Carregar Histórico"
          icon="document-text-outline"
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
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Histórico</Text>

            {/* Botão de exportar com props memoizadas */}
            {derivedStates.hasData && (
              <TouchableOpacity {...exportButtonProps}>
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Estatísticas do histórico */}
          {derivedStates.hasData && (
            <Text style={styles.statsText}>
              📊 {derivedStates.totalRecords} registro
              {derivedStates.totalRecords !== 1 ? "s" : ""} total
            </Text>
          )}

          {/* Indicadores de última atualização memoizados */}
          <View style={styles.updateIndicators}>
            {updateIndicators.map((indicator, index) => (
              <Text key={index} style={styles.updateText}>
                {indicator.icon} {indicator.time}
              </Text>
            ))}
          </View>
        </View>

        {derivedStates.hasData ? (
          <FlatList
            data={allRecords}
            renderItem={renderHistoryItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl {...refreshControlProps} />}
            {...flatListProps}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={colors.gray}
            />
            <Text style={styles.emptyTitle}>Nenhum registro encontrado</Text>
            <Text style={styles.emptyText}>
              Seus registros de peso e medidas aparecerão aqui! 📊
            </Text>

            <TouchableOpacity {...refreshButtonProps}>
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.refreshButtonText}>Atualizar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error handling display */}
        {computedStates.hasAnyError && derivedStates.hasData && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={24} color={colors.warning} />
            <View style={styles.errorText}>
              <Text style={styles.errorTitle}>Erro Parcial</Text>
              <Text style={styles.errorMessage}>{getErrorMessage()}</Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryAll}
            >
              <Ionicons name="refresh" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Debug info em desenvolvimento */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>🔧 Debug Info:</Text>
            <Text style={styles.debugText}>
              Records: {debugInfo.derived.totalRecords} total
            </Text>
            <Text style={styles.debugText}>
              Loading: Weight={debugInfo.loading.isWeightLoading ? "✓" : "✗"} |
              Measurement={debugInfo.loading.isMeasurementLoading ? "✓" : "✗"}
            </Text>
            <Text style={styles.debugText}>
              States: Preloaded={debugInfo.preloaded ? "✓" : "✗"} | Refreshing=
              {debugInfo.refreshing ? "✓" : "✗"}
            </Text>
            <Text style={styles.debugText}>
              Updates: {debugInfo.updateIndicators} indicators
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
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: colors.dark,
    flex: 1,
  },
  exportButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primary + "20",
  },
  statsText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  updateIndicators: {
    flexDirection: "row",
    gap: 12,
  },
  updateText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    fontStyle: "italic",
  },
  listContainer: {
    paddingBottom: 20,
  },
  recordCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.dark,
  },
  recordDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  recordValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: colors.primary,
  },
  measurementCount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: colors.secondary,
  },
  measurementsList: {
    marginTop: 12,
    paddingLeft: 12,
  },
  measurementItem: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.dark,
    marginVertical: 2,
  },
  recordNotes: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    marginTop: 8,
    fontStyle: "italic",
  },
  errorItem: {
    backgroundColor: colors.warning + "20",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  errorItemText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.warning,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: colors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.primary,
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
    marginTop: 16,
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
const HistoryScreen: React.FC = () => {
  return (
    <ScreenErrorBoundary screenName="Historico">
      <HistoryScreenContent />
    </ScreenErrorBoundary>
  );
};

export default HistoryScreen;
