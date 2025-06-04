import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { ErrorState } from "../components/ErrorState";
import { Input } from "../components/Input";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { MotivationalCard } from "../components/MotivationalCard";
import { ScreenErrorBoundary } from "../components/ScreenErrorBoundary";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { useLoadingState } from "../hooks/useLoadingState";
import { useMeasurementRecords, usePreloadData } from "../hooks/useStorage";
import { colors } from "../styles/colors";
import { MeasurementRecord } from "../types";

const MeasurementsScreenContent: React.FC = () => {
  const [date, setDate] = useState(new Date().toLocaleDateString("pt-BR"));
  const [notes, setNotes] = useState("");

  const navigation = useNavigation();

  // ✅ Error handling configurado
  const errorHandler = useErrorHandler({
    maxRetries: 3,
    showUserFriendlyMessages: true,
    onError: (error) => {
      console.error("MeasurementsScreen Error:", error);
    },
  });

  // ✅ Hooks com error handling adequado
  const { preloaded, preloadError } = usePreloadData();

  const {
    addRecord,
    records: measurementRecords,
    loading: measurementLoading,
    error: measurementError,
    refresh: refreshMeasurements,
    lastUpdate,
  } = useMeasurementRecords();

  const {
    isLoading: saving,
    setLoading: setSaving,
    loadingMessage,
    error: saveError,
    setError: setSaveError,
  } = useLoadingState();

  // ✅ MELHORIA 1: Função helper estável
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

  // ✅ MELHORIA 2: Reducer otimizado e estável
  const measurementReducer = useCallback((state: any, action: any) => {
    switch (action.type) {
      case "UPDATE_MEASUREMENT":
        return {
          ...state,
          measurements: { ...state.measurements, [action.field]: action.value },
          errors: { ...state.errors, [action.field]: null },
        };
      case "SET_ERRORS":
        return { ...state, errors: action.errors };
      case "CLEAR_ERRORS":
        return { ...state, errors: {} };
      case "RESET":
        return {
          measurements: { chest: "", waist: "", hip: "", thigh: "", arm: "" },
          errors: {},
          notes: "",
        };
      default:
        return state;
    }
  }, []);

  const [measurementState, dispatchMeasurement] = useReducer(
    measurementReducer,
    {
      measurements: { chest: "", waist: "", hip: "", thigh: "", arm: "" },
      errors: {},
      notes: "",
    }
  );

  // ✅ MELHORIA 3: Agrupar todos os erros em um objeto estável
  const allErrors = useMemo(
    () => ({
      measurement: measurementError,
      preload: preloadError,
      save: saveError,
    }),
    [measurementError, preloadError, saveError]
  );

  // ✅ MELHORIA 4: Estados de erro simplificados
  const errorStates = useMemo(
    () => ({
      hasErrorHandlerError: errorHandler.hasError,
      hasAnyDataError: Object.values(allErrors).some(Boolean),
    }),
    [errorHandler.hasError, allErrors]
  );

  // ✅ MELHORIA 5: getErrorMessage OTIMIZADO - apenas 3 dependências
  const getErrorMessage = useCallback((): string => {
    // Prioridade 1: Error handler
    if (errorStates.hasErrorHandlerError && errorHandler.error) {
      return errorHandler.getErrorMessage(errorHandler.error);
    }

    // Prioridade 2: Erros de dados
    const errorMappings = [
      { error: allErrors.measurement, fallback: "Erro ao carregar medidas" },
      { error: allErrors.preload, fallback: "Erro no pré-carregamento" },
      { error: allErrors.save, fallback: "Erro ao salvar medidas" },
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

  // ✅ MELHORIA 6: Estados computados memoizados
  const loadingStates = useMemo(
    () => ({
      isMeasurementLoading: measurementLoading,
      isSaving: saving,
      isRecovering: errorHandler.isRecovering,
      isAnyLoading: measurementLoading || saving || errorHandler.isRecovering,
    }),
    [measurementLoading, saving, errorHandler.isRecovering]
  );

  const computedStates = useMemo(
    () => ({
      isLoading: loadingStates.isAnyLoading,
      hasAnyError: errorStates.hasAnyDataError,
      hasCriticalError: errorStates.hasAnyDataError && !preloaded,
    }),
    [loadingStates.isAnyLoading, errorStates.hasAnyDataError, preloaded]
  );

  // ✅ MELHORIA 7: measurementStats otimizado
  const measurementStats = useMemo(() => {
    if (!Array.isArray(measurementRecords) || measurementRecords.length === 0) {
      return {
        totalRecords: 0,
        lastMeasurement: null,
        daysSinceLastMeasurement: null,
        hasValidData: false,
      };
    }

    const lastRecord = measurementRecords[0];
    const daysSince = lastRecord?.date
      ? Math.floor(
          (Date.now() - new Date(lastRecord.date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      totalRecords: measurementRecords.length,
      lastMeasurement: lastRecord,
      daysSinceLastMeasurement: daysSince,
      hasValidData: true,
    };
  }, [measurementRecords]);

  // ✅ MELHORIA 8: validMeasurements otimizado
  const validMeasurements = useMemo(() => {
    return Object.entries(measurementState.measurements)
      .filter(([_, value]) => (value as string).trim() !== "")
      .filter(([_, value]) => {
        const num = Number(value);
        return !isNaN(num) && num > 0 && num <= 300;
      });
  }, [measurementState.measurements]);

  // ✅ MELHORIA 9: updateMeasurement estável
  const updateMeasurement = useCallback((key: string, value: string) => {
    dispatchMeasurement({ type: "UPDATE_MEASUREMENT", field: key, value });
  }, []);

  // ✅ MELHORIA 10: measurementFields estático
  const measurementFields = useMemo(
    () => [
      {
        key: "chest",
        label: "Peito",
        icon: "body-outline" as const,
        placeholder: "Ex: 95",
        description: "Medida do peito/busto",
      },
      {
        key: "waist",
        label: "Cintura",
        icon: "body-outline" as const,
        placeholder: "Ex: 75",
        description: "Parte mais estreita do tronco",
      },
      {
        key: "hip",
        label: "Quadril",
        icon: "body-outline" as const,
        placeholder: "Ex: 95",
        description: "Parte mais larga do quadril",
      },
      {
        key: "thigh",
        label: "Coxa",
        icon: "body-outline" as const,
        placeholder: "Ex: 55",
        description: "Parte mais larga da coxa",
      },
      {
        key: "arm",
        label: "Braço",
        icon: "body-outline" as const,
        placeholder: "Ex: 35",
        description: "Bíceps contraído",
      },
    ],
    []
  );

  // ✅ MELHORIA 11: Dados de medidas memoizados
  const measurementData = useMemo(
    () => ({
      chest: measurementState.measurements.chest,
      waist: measurementState.measurements.waist,
      hip: measurementState.measurements.hip,
      thigh: measurementState.measurements.thigh,
      arm: measurementState.measurements.arm,
    }),
    [
      measurementState.measurements.chest,
      measurementState.measurements.waist,
      measurementState.measurements.hip,
      measurementState.measurements.thigh,
      measurementState.measurements.arm,
    ]
  );

  // ✅ MELHORIA 12: Dados para validação agrupados
  const validationData = useMemo(
    () => ({
      validMeasurements,
      hasValidData: validMeasurements.length > 0,
      measurementCount: validMeasurements.length,
      errors: measurementState.errors,
    }),
    [validMeasurements, measurementState.errors]
  );

  // ✅ MELHORIA 13: Labels para medidas memoizados
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

  // ✅ MELHORIA 14: validateForm otimizado
  const validateForm = useCallback(() => {
    try {
      const newErrors: { [key: string]: string } = {};
      const warnings: string[] = [];

      if (validationData.validMeasurements.length === 0) {
        setSaveError("Digite pelo menos uma medida");
        return false;
      }

      // Validação individual de cada campo
      for (const [key, value] of validationData.validMeasurements) {
        const numValue = Number(value);

        if (isNaN(numValue)) {
          newErrors[key] = "Digite apenas números";
          continue;
        }

        if (numValue <= 0) {
          newErrors[key] = "Valor deve ser maior que zero";
          continue;
        }

        if (numValue > 300) {
          newErrors[key] = "Valor muito alto (máx: 300cm)";
          continue;
        }
      }

      dispatchMeasurement({ type: "SET_ERRORS", errors: newErrors });
      setSaveError(null);

      return Object.keys(newErrors).length === 0;
    } catch (error) {
      errorHandler.captureError(error as Error, "Form Validation");
      setSaveError("Erro na validação do formulário");
      return false;
    }
  }, [validationData, setSaveError, errorHandler]);

  // ✅ MELHORIA 15: Dados para salvamento memoizados
  const saveData = useMemo(
    () => ({
      measurementData,
      notes: notes.trim(),
      validCount: validationData.measurementCount,
      hasNotes: !!notes.trim(),
    }),
    [measurementData, notes, validationData.measurementCount]
  );

  // ✅ MELHORIA 16: handleSave SUPER OTIMIZADO - apenas 6 dependências
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setSaving(true, "Validando medidas...");
      await new Promise((resolve) => setTimeout(resolve, 300));

      setSaving(true, "Preparando dados...");

      const measurementRecord: MeasurementRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        measurements: {
          chest: saveData.measurementData.chest
            ? Number(saveData.measurementData.chest)
            : undefined,
          waist: saveData.measurementData.waist
            ? Number(saveData.measurementData.waist)
            : undefined,
          hip: saveData.measurementData.hip
            ? Number(saveData.measurementData.hip)
            : undefined,
          thigh: saveData.measurementData.thigh
            ? Number(saveData.measurementData.thigh)
            : undefined,
          arm: saveData.measurementData.arm
            ? Number(saveData.measurementData.arm)
            : undefined,
        },
        notes: saveData.notes || undefined,
        createdAt: new Date(),
      };

      setSaving(true, "Salvando medidas...");

      const saveResult = await errorHandler.withErrorHandling(
        () => addRecord(measurementRecord),
        "Save Measurement Record"
      );

      if (!saveResult && errorHandler.hasError) {
        if (
          errorHandler.canRetry &&
          errorHandler.shouldAutoRecover(errorHandler.error!)
        ) {
          console.log("🔄 Attempting auto-recovery for save operation");
          await errorHandler.retry(() => addRecord(measurementRecord));
        }
        return;
      }

      setSaving(true, "Finalizando...");
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Alert personalizado baseado nas medidas
      let alertTitle = "Sucesso! 📏";
      let alertMessage = `${saveData.validCount} medida(s) registrada(s) com sucesso!`;

      const recordedMeasurements = validationData.validMeasurements
        .map(
          ([key, value]) =>
            `${
              measurementLabels[key as keyof typeof measurementLabels]
            }: ${value}cm`
        )
        .join(", ");

      alertMessage += `\n\n📊 Registrado: ${recordedMeasurements}`;

      // Comparação com medida anterior se disponível
      if (measurementStats.lastMeasurement) {
        const improvements = [];
        const lastMeasurements = measurementStats.lastMeasurement.measurements;

        for (const [key, value] of validationData.validMeasurements) {
          const currentValue = Number(value);
          const lastValue =
            lastMeasurements[key as keyof typeof lastMeasurements];

          if (lastValue && typeof lastValue === "number") {
            const difference = currentValue - lastValue;
            if (Math.abs(difference) >= 0.5) {
              const direction = difference > 0 ? "+" : "";
              improvements.push(
                `${
                  measurementLabels[key as keyof typeof measurementLabels]
                }: ${direction}${difference.toFixed(1)}cm`
              );
            }
          }
        }

        if (improvements.length > 0) {
          alertMessage += `\n\n📈 Mudanças: ${improvements.join(", ")}`;
        }
      }

      Vibration.vibrate([50, 25, 50]);

      Alert.alert(alertTitle, alertMessage, [
        {
          text: "Ver Histórico",
          onPress: () => navigation.navigate("Historico" as never),
        },
        {
          text: "OK",
          onPress: () => {
            dispatchMeasurement({ type: "RESET" });
            setNotes("");
            navigation.goBack();
          },
        },
      ]);

      console.log("📊 Measurements Record Saved:", {
        measurementCount: saveData.validCount,
        hasNotes: saveData.hasNotes,
        hasHistory: measurementStats.hasValidData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      errorHandler.captureError(error as Error, "Save Measurements Record");
      setSaveError("Não foi possível salvar as medidas. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }, [
    validateForm,
    setSaving,
    saveData,
    addRecord,
    errorHandler,
    validationData,
    measurementLabels,
    measurementStats,
    navigation,
    setSaveError,
  ]);

  // ✅ MELHORIA 17: handleRetryAll otimizado
  const handleRetryAll = useCallback(() => {
    setSaveError(null);
    dispatchMeasurement({ type: "CLEAR_ERRORS" });
    errorHandler.clearError();
    refreshMeasurements();
  }, [setSaveError, errorHandler, refreshMeasurements]);

  // ✅ MELHORIA 18: handleSuggestMeasurement otimizado
  const handleSuggestMeasurement = useCallback(
    (field: string) => {
      try {
        if (!measurementStats.lastMeasurement) return;

        const lastValue =
          measurementStats.lastMeasurement.measurements[
            field as keyof typeof measurementStats.lastMeasurement.measurements
          ];

        if (lastValue && typeof lastValue === "number") {
          updateMeasurement(field, lastValue.toString());
          Alert.alert(
            "Medida Sugerida",
            `Usamos sua última medida: ${lastValue}cm`
          );
        }
      } catch (error) {
        errorHandler.captureError(error as Error, "Suggest Measurement");
      }
    },
    [measurementStats.lastMeasurement, updateMeasurement, errorHandler]
  );

  // ✅ MELHORIA 19: Props memoizadas para campos
  const fieldProps = useMemo(() => {
    return measurementFields.map((field) => ({
      ...field,
      value: measurementData[field.key as keyof typeof measurementData],
      onChangeText: (value: string) => updateMeasurement(field.key, value),
      error: measurementState.errors[field.key],
      lastValue:
        measurementStats.lastMeasurement?.measurements[
          field.key as keyof typeof measurementStats.lastMeasurement.measurements
        ],
    }));
  }, [
    measurementFields,
    measurementData,
    updateMeasurement,
    measurementState.errors,
    measurementStats.lastMeasurement,
  ]);

  // ✅ MELHORIA 20: Estados de UI memoizados
  const uiStates = useMemo(
    () => ({
      showStats: measurementStats.hasValidData,
      showLastUpdate: lastUpdate > 0,
      showValidCounter: validationData.hasValidData,
      canSave: validationData.hasValidData && !computedStates.isLoading,
    }),
    [
      measurementStats.hasValidData,
      lastUpdate,
      validationData.hasValidData,
      computedStates.isLoading,
    ]
  );

  // ✅ MELHORIA 21: Props para componentes memoizadas
  const motivationalCardProps = useMemo(
    () => ({
      message: "As medidas mostram o progresso que a balança não vê! 💪",
      icon: "fitness-outline" as const,
    }),
    []
  );

  const saveButtonProps = useMemo(
    () => ({
      title: loadingStates.isSaving ? loadingMessage : "Salvar Medidas",
      onPress: handleSave,
      variant: "primary" as const,
      size: "large" as const,
      disabled: !uiStates.canSave,
    }),
    [loadingStates.isSaving, loadingMessage, handleSave, uiStates.canSave]
  );

  // ✅ MELHORIA 22: Debug info memoizado
  const debugInfo = useMemo(
    () => ({
      loading: loadingStates,
      computed: computedStates,
      validation: validationData,
      ui: uiStates,
      preloaded,
      error: {
        hasError: errorHandler.hasError,
        message: errorHandler.error?.message || null,
      },
    }),
    [
      loadingStates,
      computedStates,
      validationData,
      uiStates,
      preloaded,
      errorHandler.hasError,
      errorHandler.error?.message,
    ]
  );

  // ✅ useEffect otimizado para validação
  useEffect(() => {
    if (validationData.hasValidData) {
      const timeoutId = setTimeout(() => {
        try {
          validateForm();
        } catch (error) {
          errorHandler.captureError(error as Error, "Validation Effect");
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [validationData.hasValidData, validateForm, errorHandler]);

  // Loading inicial
  if (computedStates.isLoading && !preloaded) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen message="Carregando dados de medidas..." />
      </SafeAreaView>
    );
  }

  // Estado de erro crítico
  if (computedStates.hasCriticalError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          fullScreen
          message={getErrorMessage()}
          onRetry={handleRetryAll}
          title="Erro ao Carregar Dados de Medidas"
          icon="body-outline"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content}>
          {/* Loading overlay */}
          {computedStates.isLoading && (
            <LoadingSpinner
              overlay
              message={
                loadingStates.isRecovering ? "Recuperando..." : loadingMessage
              }
              size="large"
            />
          )}

          <View style={styles.header}>
            <Text style={styles.title}>Registrar Medidas</Text>
            <Text style={styles.subtitle}>
              Acompanhe suas medidas corporais! 📏
            </Text>

            {/* Estatísticas do histórico */}
            {uiStates.showStats && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  📊 {measurementStats.totalRecords} registro
                  {measurementStats.totalRecords !== 1 ? "s" : ""} total
                </Text>
                {measurementStats.daysSinceLastMeasurement !== null && (
                  <Text style={styles.daysSinceText}>
                    🗓️ Última medição há{" "}
                    {measurementStats.daysSinceLastMeasurement} dia
                    {measurementStats.daysSinceLastMeasurement !== 1 ? "s" : ""}
                  </Text>
                )}
              </View>
            )}

            {/* Indicador de última atualização */}
            {uiStates.showLastUpdate && (
              <Text style={styles.lastUpdate}>
                Última atualização:{" "}
                {new Date(lastUpdate).toLocaleTimeString("pt-BR")}
              </Text>
            )}
          </View>

          {/* Error display */}
          {computedStates.hasAnyError && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="warning-outline"
                size={20}
                color={colors.warning}
              />
              <Text style={styles.errorText}>{getErrorMessage()}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetryAll}
              >
                <Ionicons name="refresh" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.form}>
            <Input
              label="Data"
              value={date}
              placeholder="DD/MM/AAAA"
              icon="calendar-outline"
              editable={false}
            />

            {/* Campos otimizados com props memoizadas */}
            {fieldProps.map((field) => (
              <View key={field.key} style={styles.fieldContainer}>
                <Input
                  label={field.label}
                  value={field.value}
                  onChangeText={field.onChangeText}
                  placeholder={field.placeholder}
                  keyboardType="numeric"
                  icon={field.icon}
                  suffix="cm"
                  error={field.error}
                />

                <Text style={styles.fieldDescription}>{field.description}</Text>

                {/* Botão de sugestão */}
                {field.lastValue && (
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() => handleSuggestMeasurement(field.key)}
                  >
                    <Ionicons
                      name="bulb-outline"
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.suggestionText}>
                      Última: {field.lastValue}cm
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <Input
              label="Observações (opcional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Como você se sente hoje?"
              multiline
              numberOfLines={3}
              icon="chatbubble-outline"
              style={styles.notesInput}
            />
          </View>

          {/* Contador de medidas válidas */}
          {uiStates.showValidCounter && (
            <View style={styles.validMeasurementsCard}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.validMeasurementsText}>
                {validationData.measurementCount} medida(s) preenchida(s)
              </Text>
            </View>
          )}

          <MotivationalCard {...motivationalCardProps} />

          <View style={styles.buttonContainer}>
            <Button {...saveButtonProps} />
          </View>

          {/* Debug info */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>🔧 Debug Info:</Text>
              <Text style={styles.debugText}>
                Valid Measurements: {debugInfo.validation.measurementCount}
              </Text>
              <Text style={styles.debugText}>
                Errors: {Object.keys(debugInfo.validation.errors).length}
              </Text>
              <Text style={styles.debugText}>
                Has History: {measurementStats.hasValidData ? "Yes" : "No"}
              </Text>
              <Text style={styles.debugText}>
                Loading: {debugInfo.loading.isAnyLoading ? "Yes" : "No"}
              </Text>
              {debugInfo.error.hasError && (
                <Text style={[styles.debugText, { color: colors.error }]}>
                  Error: {debugInfo.error.message || "Unknown"}
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ✅ Styles otimizados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.gray,
    marginBottom: 12,
  },
  statsContainer: {
    backgroundColor: colors.primary + "20",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  statsText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.primary,
    marginBottom: 2,
  },
  daysSinceText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
  },
  lastUpdate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
    fontStyle: "italic",
  },
  errorContainer: {
    backgroundColor: colors.warning + "20",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.warning,
    flex: 1,
    marginLeft: 8,
  },
  retryButton: {
    padding: 4,
  },
  form: {
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
    marginLeft: 4,
    fontStyle: "italic",
  },
  suggestionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "10",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  suggestionText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },
  notesInput: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  validMeasurementsCard: {
    backgroundColor: colors.secondary + "20",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
  },
  validMeasurementsText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.secondary,
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
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
const MeasurementsScreen: React.FC = () => {
  return (
    <ScreenErrorBoundary screenName="Medidas">
      <MeasurementsScreenContent />
    </ScreenErrorBoundary>
  );
};

export default MeasurementsScreen;
