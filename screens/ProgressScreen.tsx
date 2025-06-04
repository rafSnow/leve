import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chart } from "../components/Chart";
import { ErrorState } from "../components/ErrorState";
import { GoalCard } from "../components/GoalCard";
import { HealthMetricsCard } from "../components/HealthMetricsCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { MotivationalCard } from "../components/MotivationalCard";
import { ScreenErrorBoundary } from "../components/ScreenErrorBoundary";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { useLoadingState } from "../hooks/useLoadingState";
import {
  useGoals,
  useMeasurementRecords,
  usePreloadData,
  useUserProfile,
  useWeightRecords,
} from "../hooks/useStorage";
import { colors } from "../styles/colors";
import { HealthMetric } from "../types";
import { CalculationUtils } from "../utils/Calculations";

type IoniconsName = keyof typeof Ionicons.glyphMap;

// ✅ Utilitário de debounce otimizado
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

// Interface para estatísticas
interface ProgressStats {
  currentWeight: number;
  weightLoss: number;
  progress: number;
  hasValidData: boolean;
  startWeight: number;
  totalToLose: number;
}

const ProgressScreenContent: React.FC = () => {
  const navigation = useNavigation();

  // ✅ 1. Estados locais
  const [refreshing, setRefreshing] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);

  // ✅ 2. Error handler (sempre chamado)
  const errorHandler = useErrorHandler({
    maxRetries: 3,
    showUserFriendlyMessages: true,
    onError: (error: Error) => {
      console.error("ProgressScreen Error:", error);
    },
  });

  // ✅ 3. Pré-carregamento (sempre chamado)
  const { preloaded, preloadError } = usePreloadData();

  // ✅ 4. Hooks de dados (sempre chamados)
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

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useUserProfile();

  const {
    goals,
    activeGoals,
    loading: goalsLoading,
    error: goalsError,
    refresh: refreshGoals,
  } = useGoals();

  // ✅ 5. Estado de loading para cálculos (sempre chamado)
  const {
    isLoading: isCalculating,
    setLoading: setCalculating,
    error: calculationError,
    setError: setCalculationError,
  } = useLoadingState();

  // ✅ MELHORIA 1: Função helper estável para extrair mensagem de erro
  const extractErrorMessage = useCallback((error: any): string => {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    if (error.message && typeof error.message === "string")
      return error.message;
    return "Erro desconhecido";
  }, []); // ✅ Sem dependências - função pura

  // ✅ MELHORIA 2: Agrupar todos os erros em um objeto estável
  const allErrors = useMemo(
    () => ({
      calculation: calculationError,
      errorHandler: errorHandler.error,
      weight: weightError,
      measurement: measurementError,
      profile: profileError,
      goals: goalsError,
      preload: preloadError,
    }),
    [
      calculationError,
      errorHandler.error,
      weightError,
      measurementError,
      profileError,
      goalsError,
      preloadError,
    ]
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
    if (errorStates.hasErrorHandlerError && allErrors.errorHandler) {
      return errorHandler.getErrorMessage(allErrors.errorHandler);
    }

    const errorMappings = [
      { error: allErrors.calculation, fallback: "Erro nos cálculos" },
      {
        error: allErrors.weight,
        fallback: "Erro ao carregar registros de peso",
      },
      { error: allErrors.measurement, fallback: "Erro ao carregar medidas" },
      { error: allErrors.profile, fallback: "Erro ao carregar perfil" },
      { error: allErrors.goals, fallback: "Erro ao carregar metas" },
      { error: allErrors.preload, fallback: "Erro no pré-carregamento" },
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
    allErrors,
    errorHandler,
    extractErrorMessage,
  ]);

  // ✅ MELHORIA 5: Estados computados memoizados
  const loadingStates = useMemo(
    () => ({
      isWeightLoading: weightLoading,
      isMeasurementLoading: measurementLoading,
      isProfileLoading: profileLoading,
      isGoalsLoading: goalsLoading,
      isCalculating: isCalculating,
      isRecovering: errorHandler.isRecovering,
      isAnyLoading:
        weightLoading ||
        measurementLoading ||
        profileLoading ||
        goalsLoading ||
        isCalculating ||
        errorHandler.isRecovering,
    }),
    [
      weightLoading,
      measurementLoading,
      profileLoading,
      goalsLoading,
      isCalculating,
      errorHandler.isRecovering,
    ]
  );

  const computedStates = useMemo(
    () => ({
      isLoading: loadingStates.isAnyLoading,
      hasAnyError: errorStates.hasAnyDataError,
      hasCriticalError:
        (errorStates.hasAnyDataError || preloadError) && !preloaded,
      hasProfile: !!profile?.name?.trim(),
    }),
    [
      loadingStates.isAnyLoading,
      errorStates.hasAnyDataError,
      preloadError,
      preloaded,
      profile?.name,
    ]
  );

  // ✅ MELHORIA 6: Callbacks de refresh agrupados
  const refreshCallbacks = useMemo(
    () => ({
      refreshWeight,
      refreshMeasurements,
      refreshProfile,
      refreshGoals,
    }),
    [refreshWeight, refreshMeasurements, refreshProfile, refreshGoals]
  );

  // ✅ MELHORIA 7: handleRefresh OTIMIZADO - apenas 2 dependências
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await errorHandler.withErrorHandling(async () => {
        await Promise.all([
          refreshCallbacks.refreshWeight(),
          refreshCallbacks.refreshMeasurements(),
          refreshCallbacks.refreshProfile(),
          refreshCallbacks.refreshGoals(),
        ]);
      }, "Refresh All Data");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [errorHandler, refreshCallbacks]);

  // ✅ MELHORIA 8: chartData otimizado (mantido igual, já estava bom)
  const chartData = useMemo(() => {
    if (!weightRecords || weightRecords.length === 0) {
      return { labels: [], data: [] };
    }

    try {
      return CalculationUtils.prepareWeightChartData(weightRecords, 6);
    } catch (error) {
      console.error("Chart data calculation error:", error);
      return { labels: [], data: [] };
    }
  }, [weightRecords]);

  // ✅ MELHORIA 9: stats OTIMIZADO com mais dados
  const stats = useMemo((): ProgressStats => {
    if (!weightRecords || weightRecords.length === 0) {
      return {
        currentWeight: 0,
        weightLoss: 0,
        progress: 0,
        hasValidData: false,
        startWeight: 0,
        totalToLose: 0,
      };
    }

    const currentWeight = weightRecords[0]?.weight || 0;
    const startWeight =
      weightRecords[weightRecords.length - 1]?.weight || currentWeight;
    const weightLoss = startWeight - currentWeight;

    // Calcular progresso baseado na meta
    let progress = 0;
    let totalToLose = 0;

    if (activeGoals && activeGoals.length > 0) {
      const weightGoal = activeGoals.find((goal) => goal.type === "weight");
      if (weightGoal) {
        const targetValue = weightGoal.targetValue || weightGoal.target;
        if (targetValue) {
          totalToLose = startWeight - targetValue;
          progress =
            totalToLose > 0
              ? Math.min((weightLoss / totalToLose) * 100, 100)
              : 0;
        }
      }
    }

    return {
      currentWeight,
      weightLoss,
      progress,
      hasValidData: true,
      startWeight,
      totalToLose,
    };
  }, [weightRecords, activeGoals]);

  // ✅ MELHORIA 10: weightGoal otimizado
  const weightGoal = useMemo(() => {
    if (!activeGoals || activeGoals.length === 0) return null;
    return activeGoals.find((goal) => goal.type === "weight") || null;
  }, [activeGoals]);

  // ✅ MELHORIA 11: convertToHealthMetrics otimizado (mantido igual)
  const convertToHealthMetrics = useCallback(
    (
      rawMetrics: {
        id: string;
        name: string;
        value: string;
        category: string;
        color: string;
        description: string;
        recommendation: string;
        title?: string;
        icon?: string;
      }[]
    ): HealthMetric[] => {
      return rawMetrics.map((metric) => ({
        id: metric.id,
        name: metric.name,
        title: metric.title || metric.description,
        value: metric.value,
        category: metric.category,
        color: metric.color,
        description: metric.description,
        recommendation: metric.recommendation,
        icon: ((metric.icon as IoniconsName) ||
          (metric.id === "bmi"
            ? "body-outline"
            : metric.id === "whr"
            ? "resize-outline"
            : "analytics-outline")) as IoniconsName,
      }));
    },
    []
  ); // ✅ Função pura

  // ✅ MELHORIA 12: calculateHealthMetrics otimizado
  const calculateHealthMetrics = useCallback(
    async (
      weight: number,
      height: number,
      gender: "male" | "female" | "other"
    ) => {
      if (!weight || !height || weight <= 0 || height <= 0) {
        setHealthMetrics([]);
        return;
      }

      try {
        setCalculating(true, "Calculando métricas de saúde...");

        const latestMeasurement = measurementRecords?.[0];
        const waist = latestMeasurement?.measurements?.waist
          ? Number(latestMeasurement.measurements.waist)
          : undefined;
        const hip = latestMeasurement?.measurements?.hip
          ? Number(latestMeasurement.measurements.hip)
          : undefined;

        const rawMetrics = await CalculationUtils.calculateHealthMetrics({
          weight,
          height,
          gender,
          waist,
          hip,
        });

        const convertedMetrics = convertToHealthMetrics(rawMetrics);
        setHealthMetrics(convertedMetrics);
      } catch (error) {
        setCalculationError("Erro ao calcular métricas de saúde");
        console.error("Health metrics calculation error:", error);
      } finally {
        setCalculating(false);
      }
    },
    [
      measurementRecords,
      setCalculating,
      setCalculationError,
      convertToHealthMetrics,
    ]
  );

  // ✅ MELHORIA 13: debouncedCalculateHealthMetrics otimizado
  const debouncedCalculateHealthMetrics = useMemo(
    () => debounce(calculateHealthMetrics, 500),
    [calculateHealthMetrics]
  );

  // ✅ MELHORIA 14: handleRetryAll otimizado
  const handleRetryAll = useCallback(() => {
    setCalculationError(null);
    setHealthMetrics([]);
    errorHandler.clearError();
    handleRefresh();
  }, [handleRefresh, setCalculationError, errorHandler]);

  // ✅ MELHORIA 15: Dados de última atualização memoizados
  const updateData = useMemo(
    () => ({
      weightLastUpdate,
      measurementLastUpdate,
      hasWeightUpdate: weightLastUpdate > 0,
      hasMeasurementUpdate: measurementLastUpdate > 0,
      weightTime:
        weightLastUpdate > 0
          ? new Date(weightLastUpdate).toLocaleTimeString("pt-BR")
          : "",
      measurementTime:
        measurementLastUpdate > 0
          ? new Date(measurementLastUpdate).toLocaleTimeString("pt-BR")
          : "",
    }),
    [weightLastUpdate, measurementLastUpdate]
  );

  // ✅ MELHORIA 16: Props memoizadas para GoalCard
  const goalCardProps = useMemo(() => {
    if (!weightGoal) return null;

    const targetValue = weightGoal.targetValue || weightGoal.target;
    const deadlineString =
      weightGoal.deadline instanceof Date
        ? weightGoal.deadline.toISOString()
        : weightGoal.deadline;

    return {
      title: "Meta de Peso",
      current: stats.currentWeight,
      target: targetValue,
      unit: "kg",
      progress: stats.progress,
      deadline: deadlineString,
      icon: "flag-outline" as const, // ✅ CORREÇÃO: Tipo correto para Ionicons
    };
  }, [weightGoal, stats.currentWeight, stats.progress]);

  // ✅ MELHORIA 17: Props memoizadas para Chart
  const chartProps = useMemo(
    () => ({
      data: chartData.data,
      labels: chartData.labels,
      title: "Evolução do Peso",
      suffix: "kg",
      color: colors.primary,
    }),
    [chartData.data, chartData.labels]
  );

  // ✅ MELHORIA 18: healthMetrics memoizados
  const healthMetricsProps = useMemo(
    () => ({
      metrics: healthMetrics,
    }),
    [healthMetrics]
  );

  // ✅ MELHORIA 19: Estados de UI memoizados
  const uiStates = useMemo(
    () => ({
      showGoalCard: !!goalCardProps,
      showHealthMetrics: healthMetrics.length > 0,
      showChart: chartData.data.length > 1,
      showEmptyState: !stats.hasValidData,
      showSetupProfile: !computedStates.hasProfile,
      showError:
        (errorStates.hasAnyDataError || errorHandler.hasError) &&
        stats.hasValidData,
      showProgressGreeting: stats.progress > 50,
    }),
    [
      goalCardProps,
      healthMetrics.length,
      chartData.data.length,
      stats.hasValidData,
      stats.progress,
      computedStates.hasProfile,
      errorStates.hasAnyDataError,
      errorHandler.hasError,
    ]
  );

  // ✅ MELHORIA 20: Props memoizadas para MotivationalCards
  const motivationalCards = useMemo(
    () => [
      {
        message: "Cada passo conta na sua jornada! 👣",
        icon: "footsteps-outline" as const,
      },
      ...(uiStates.showProgressGreeting
        ? [
            {
              message:
                "Você está indo muito bem! Mais da metade do caminho! 🔥",
              icon: "trophy-outline" as const,
            },
          ]
        : []),
      {
        message: "Consistência vale mais que velocidade. ⏰",
        icon: "time-outline" as const,
      },
    ],
    [uiStates.showProgressGreeting]
  );

  // ✅ MELHORIA 21: Navegação memoizada
  const navigationActions = useMemo(
    () => ({
      navigateToProfile: () => navigation.navigate("Profile" as never),
      navigateToAdd: () => navigation.navigate("Adicionar" as never),
    }),
    [navigation]
  );

  // ✅ MELHORIA 22: RefreshControl props memoizadas
  const refreshControlProps = useMemo(
    () => ({
      refreshing,
      onRefresh: handleRefresh,
      colors: [colors.primary],
      tintColor: colors.primary,
      title: "Atualizando progresso...",
      titleColor: colors.gray,
    }),
    [refreshing, handleRefresh]
  );

  // ✅ MELHORIA 23: Debug info memoizado
  const debugInfo = useMemo(
    () => ({
      loading: loadingStates,
      computed: computedStates,
      ui: uiStates,
      stats,
      preloaded,
      updateData,
      error: {
        hasError: errorHandler.hasError,
        message: errorHandler.error?.message || null,
      },
    }),
    [
      loadingStates,
      computedStates,
      uiStates,
      stats,
      preloaded,
      updateData,
      errorHandler.hasError,
      errorHandler.error?.message,
    ]
  );

  // ✅ MELHORIA 24: Effect para calcular métricas otimizado
  useEffect(() => {
    if (!stats.hasValidData || !profile?.height || stats.currentWeight <= 0) {
      setHealthMetrics([]);
      return;
    }

    if (
      typeof stats.currentWeight !== "number" ||
      typeof profile.height !== "number"
    ) {
      setHealthMetrics([]);
      return;
    }

    debouncedCalculateHealthMetrics(
      stats.currentWeight,
      profile.height,
      profile.gender || "other"
    );

    return () => {
      debouncedCalculateHealthMetrics.cancel?.();
    };
  }, [
    stats.hasValidData,
    stats.currentWeight,
    profile?.height,
    profile?.gender,
    debouncedCalculateHealthMetrics,
  ]);

  // ✅ MELHORIA 25: useFocusEffect otimizado
  useFocusEffect(
    useCallback(() => {
      const refreshOnFocus = async () => {
        try {
          console.log("🔄 Refreshing progress data on focus...");
          await Promise.all([
            refreshCallbacks.refreshWeight(),
            refreshCallbacks.refreshMeasurements(),
            refreshCallbacks.refreshProfile(),
            refreshCallbacks.refreshGoals(),
          ]);
          console.log("✅ Progress data refreshed on focus");
        } catch (error) {
          console.error("Error refreshing progress data:", error);
        }
      };

      refreshOnFocus();
    }, [refreshCallbacks])
  );

  // ✅ RENDERS CONDICIONAIS APENAS APÓS TODOS OS HOOKS

  // Loading inicial
  if (computedStates.isLoading && !preloaded) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen message="Carregando seu progresso..." />
      </SafeAreaView>
    );
  }

  // Estado de erro crítico
  if (computedStates.hasCriticalError && !stats.hasValidData) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          fullScreen
          message={getErrorMessage()}
          onRetry={handleRetryAll}
          title="Erro ao Carregar Progresso"
          icon="trending-up-outline"
        />
      </SafeAreaView>
    );
  }

  // Render principal
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl {...refreshControlProps} />}
      >
        {/* Loading overlay para cálculos */}
        {(loadingStates.isCalculating || loadingStates.isRecovering) && (
          <LoadingSpinner
            overlay
            message={
              loadingStates.isRecovering
                ? "Recuperando dados..."
                : "Calculando métricas..."
            }
            size="large"
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {computedStates.hasProfile
                ? `Olá, ${profile!.name}! 👋`
                : "Seu Progresso"}
            </Text>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={navigationActions.navigateToProfile}
            >
              <Ionicons
                name="person-circle-outline"
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            {stats.hasValidData
              ? "Continue assim! 🚀"
              : "Comece registrando seu primeiro peso! ⚖️"}
          </Text>

          {/* Indicadores de última atualização otimizados */}
          <View style={styles.updateIndicators}>
            {updateData.hasWeightUpdate && (
              <Text style={styles.updateText}>⚖️ {updateData.weightTime}</Text>
            )}
            {updateData.hasMeasurementUpdate && (
              <Text style={styles.updateText}>
                📏 {updateData.measurementTime}
              </Text>
            )}
          </View>
        </View>

        {/* Setup Profile Card */}
        {uiStates.showSetupProfile && (
          <TouchableOpacity
            style={styles.setupProfileCard}
            onPress={navigationActions.navigateToProfile}
          >
            <Ionicons
              name="person-add-outline"
              size={24}
              color={colors.primary}
            />
            <View style={styles.setupProfileText}>
              <Text style={styles.setupProfileTitle}>Configure seu perfil</Text>
              <Text style={styles.setupProfileSubtitle}>
                Para cálculos precisos de IMC, RCQ e RCEst
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}

        {/* Conteúdo principal */}
        {stats.hasValidData ? (
          <>
            {/* Estatísticas principais otimizadas */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons
                  name="scale-outline"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.statNumber}>
                  {stats.currentWeight.toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>kg atual</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons
                  name="fitness-outline"
                  size={32}
                  color={
                    stats.weightLoss >= 0 ? colors.secondary : colors.warning
                  }
                />
                <Text style={styles.statNumber}>
                  {`${stats.weightLoss >= 0 ? "-" : "+"}${Math.abs(
                    stats.weightLoss
                  ).toFixed(1)}`}
                </Text>
                <Text style={styles.statLabel}>
                  kg {stats.weightLoss >= 0 ? "perdidos" : "ganhos"}
                </Text>
              </View>
            </View>

            {/* Meta de Peso otimizada */}
            {uiStates.showGoalCard && <GoalCard {...goalCardProps!} />}

            {/* Métricas de Saúde otimizadas */}
            {uiStates.showHealthMetrics && (
              <HealthMetricsCard {...healthMetricsProps} />
            )}

            {/* Gráfico de evolução otimizado */}
            {uiStates.showChart && <Chart {...chartProps} />}

            {/* Cards motivacionais otimizados */}
            {motivationalCards.map((card, index) => (
              <MotivationalCard key={index} {...card} />
            ))}
          </>
        ) : (
          /* Estado vazio */
          <View style={styles.emptyState}>
            <Ionicons name="scale-outline" size={64} color={colors.gray} />
            <Text style={styles.emptyTitle}>Nenhum registro encontrado</Text>
            <Text style={styles.emptySubtitle}>
              Registre seu primeiro peso na aba "Adicionar" para começar a
              acompanhar seu progresso!
            </Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={navigationActions.navigateToAdd}
            >
              <Ionicons name="add-circle" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Adicionar Peso</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Erro de cálculo otimizado */}
        {uiStates.showError && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={24} color={colors.warning} />
            <View style={styles.errorText}>
              <Text style={styles.errorTitle}>Erro nos Cálculos</Text>
              <Text style={styles.errorMessage}>{getErrorMessage()}</Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryAll}
              disabled={loadingStates.isRecovering}
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
              Has Data: {debugInfo.stats.hasValidData ? "Yes" : "No"}
            </Text>
            <Text style={styles.debugText}>
              Loading: {debugInfo.loading.isAnyLoading ? "Yes" : "No"}
            </Text>
            <Text style={styles.debugText}>
              Health Metrics: {debugInfo.ui.showHealthMetrics ? "Yes" : "No"}
            </Text>
            <Text style={styles.debugText}>
              Chart Data: {debugInfo.ui.showChart ? "Yes" : "No"}
            </Text>
            {debugInfo.error.hasError && (
              <Text style={[styles.debugText, { color: colors.error }]}>
                Error: {debugInfo.error.message || "Unknown"}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ✅ Styles otimizados (adicionando debug styles)
const styles = StyleSheet.create({
  // ... todos os styles existentes permanecem iguais ...
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: colors.dark,
    flex: 1,
  },
  profileButton: {
    padding: 4,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.gray,
    marginBottom: 8,
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
  setupProfileCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  setupProfileText: {
    flex: 1,
    marginLeft: 12,
  },
  setupProfileTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.dark,
  },
  setupProfileSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flex: 0.48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: colors.dark,
    marginTop: 8,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: colors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: colors.white,
  },
  errorCard: {
    backgroundColor: colors.warning + "20",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
  },
  errorTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.warning,
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
  // ✅ Adicionando debug styles
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

const ProgressScreen: React.FC = () => {
  return (
    <ScreenErrorBoundary screenName="Progresso">
      <ProgressScreenContent />
    </ScreenErrorBoundary>
  );
};

export default ProgressScreen;
