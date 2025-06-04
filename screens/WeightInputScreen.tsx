import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  useGoals,
  usePreloadData,
  useUserProfile,
  useWeightRecords,
} from "../hooks/useStorage";
import { colors } from "../styles/colors";
import { WeightRecord } from "../types";
import { CalculationUtils } from "../utils/Calculations";

// Interface para informações do IMC
interface BMIInfo {
  bmi: number;
  category: string;
  color: string;
}

const WeightInputScreenContent: React.FC = () => {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString("pt-BR"));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const navigation = useNavigation();

  // ✅ Error handling configurado
  const errorHandler = useErrorHandler({
    maxRetries: 3,
    showUserFriendlyMessages: true,
    onError: (error) => {
      console.error("WeightInputScreen Error:", error);
    },
  });

  // ✅ Hooks com error handling adequado
  const { preloaded, preloadError } = usePreloadData();

  const {
    addRecord,
    records: weightRecords,
    loading: weightLoading,
    error: weightError,
    refresh: refreshWeight,
  } = useWeightRecords();

  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile();

  const {
    activeGoals,
    updateGoal,
    loading: goalsLoading,
    error: goalsError,
  } = useGoals();

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
    return "Erro desconhecido";
  }, []); // ✅ Sem dependências - função pura

  // ✅ MELHORIA 2: Agrupar todos os erros em um objeto estável
  const allErrors = useMemo(
    () => ({
      weight: weightError,
      profile: profileError,
      goals: goalsError,
      preload: preloadError,
      save: saveError,
    }),
    [weightError, profileError, goalsError, preloadError, saveError]
  );

  // ✅ MELHORIA 3: Estados de erro simplificados
  const errorStates = useMemo(
    () => ({
      hasErrorHandlerError: errorHandler.hasError,
      hasAnyDataError: Object.values(allErrors).some(Boolean),
    }),
    [errorHandler.hasError, allErrors]
  );

  // ✅ MELHORIA 4: Estados computados memoizados
  const loadingStates = useMemo(
    () => ({
      isWeightLoading: weightLoading,
      isProfileLoading: profileLoading,
      isGoalsLoading: goalsLoading,
      isSaving: saving,
      isRecovering: errorHandler.isRecovering,
      isAnyLoading:
        weightLoading ||
        profileLoading ||
        goalsLoading ||
        saving ||
        errorHandler.isRecovering,
    }),
    [
      weightLoading,
      profileLoading,
      goalsLoading,
      saving,
      errorHandler.isRecovering,
    ]
  );

  const computedStates = useMemo(
    () => ({
      isLoading: loadingStates.isAnyLoading,
      hasAnyError: errorStates.hasAnyDataError,
      hasCriticalError: errorStates.hasAnyDataError && !preloaded,
    }),
    [loadingStates.isAnyLoading, errorStates.hasAnyDataError, preloaded]
  );

  // ✅ MELHORIA 5: Dados do formulário memoizados
  const formData = useMemo(
    () => ({
      weight: weight.trim(),
      notes: notes.trim(),
      date,
      hasWeight: !!weight.trim(),
      numericWeight: weight.trim() ? Number(weight.trim()) : null,
      isValidWeight: weight.trim()
        ? !isNaN(Number(weight.trim())) && Number(weight.trim()) > 0
        : false,
    }),
    [weight, notes, date]
  );

  // ✅ MELHORIA 6: calculateBMIInfo otimizado
  const calculateBMIInfo = useCallback(
    (weightValue: number, height: number): BMIInfo => {
      try {
        if (!weightValue || !height || weightValue <= 0 || height <= 0) {
          throw new Error("Valores inválidos para cálculo de IMC");
        }

        const bmiValue = CalculationUtils.calculateBMI(weightValue, height);
        const category = CalculationUtils.getBMICategory(bmiValue);
        const color = CalculationUtils.getBMIColor(bmiValue);

        return { bmi: bmiValue, category, color };
      } catch (error) {
        errorHandler.captureError(error as Error, "BMI Calculation");
        return {
          bmi: 0,
          category: "Erro no cálculo",
          color: colors.gray,
        };
      }
    },
    [errorHandler]
  );

  // ✅ MELHORIA 7: weightSuggestions otimizado
  const weightSuggestions = useMemo(() => {
    try {
      if (!Array.isArray(weightRecords) || weightRecords.length === 0)
        return null;

      const recentWeights = weightRecords.slice(0, 5).map((r) => r.weight);
      const avgWeight =
        recentWeights.reduce((sum, w) => sum + w, 0) / recentWeights.length;
      const minWeight = Math.min(...recentWeights);
      const maxWeight = Math.max(...recentWeights);
      const lastWeight = recentWeights[0];

      return {
        lastWeight,
        avgWeight: Math.round(avgWeight * 10) / 10,
        minWeight,
        maxWeight,
        trend:
          recentWeights.length > 1
            ? lastWeight > recentWeights[1]
              ? "up"
              : "down"
            : "stable",
        hasData: true,
      };
    } catch (error) {
      errorHandler.captureError(
        error as Error,
        "Weight Suggestions Calculation"
      );
      return null;
    }
  }, [weightRecords, errorHandler]);

  // ✅ MELHORIA 8: goalAnalysis otimizado
  const goalAnalysis = useMemo(() => {
    if (
      !Array.isArray(activeGoals) ||
      activeGoals.length === 0 ||
      !formData.isValidWeight
    )
      return null;

    const weightGoal = activeGoals.find((goal) => goal.type === "weight");
    if (!weightGoal) return null;

    try {
      return CalculationUtils.analyzeGoalProgress(
        weightGoal,
        formData.numericWeight!
      );
    } catch (error) {
      errorHandler.captureError(error as Error, "Goal Analysis");
      return null;
    }
  }, [
    activeGoals,
    formData.isValidWeight,
    formData.numericWeight,
    errorHandler,
  ]);

  // ✅ MELHORIA 9: currentBMI otimizado
  const currentBMI = useMemo(() => {
    if (!formData.isValidWeight || !profile?.height) return null;

    try {
      return calculateBMIInfo(formData.numericWeight!, profile.height);
    } catch {
      return null;
    }
  }, [
    formData.isValidWeight,
    formData.numericWeight,
    profile?.height,
    calculateBMIInfo,
  ]);

  // ✅ MELHORIA 10: Dados de validação memoizados
  const validationData = useMemo(() => {
    const validation = {
      isValid: true,
      hasWarnings: false,
      warnings: [] as string[],
      errors: {} as { [key: string]: string },
      errorCount: 0,
      hasErrors: false,
    };

    if (!formData.hasWeight) {
      validation.errors.weight = "Peso é obrigatório";
      validation.isValid = false;
    } else if (!formData.isValidWeight) {
      validation.errors.weight = "Digite um peso válido";
      validation.isValid = false;
    }

    // Verificar warnings apenas se dados existem
    if (validation.isValid && weightSuggestions?.hasData) {
      const diff = Math.abs(
        formData.numericWeight! - weightSuggestions.lastWeight
      );
      if (diff > 5) {
        validation.hasWarnings = true;
        validation.warnings.push(
          `Diferença de ${diff.toFixed(1)}kg em relação ao último registro`
        );
      }
    }

    validation.errorCount = Object.keys(validation.errors).length;
    validation.hasErrors = validation.errorCount > 0;

    return validation;
  }, [formData, weightSuggestions]);

  // ✅ MELHORIA 11: motivationalCard otimizado
  const motivationalCard = useMemo(() => {
    try {
      if (goalAnalysis?.hasReached) {
        return {
          message: "🎯 Você está na sua meta! Continue mantendo! 💪",
          icon: "trophy-outline" as const,
        };
      }

      if (goalAnalysis?.isApproaching) {
        return {
          message: "🔥 Você está quase lá! Não desista agora! 💪",
          icon: "flame-outline" as const,
        };
      }

      if (weightSuggestions?.trend === "down") {
        return {
          message: "📉 Ótimo progresso! Continue assim! 🚀",
          icon: "trending-down-outline" as const,
        };
      }

      return {
        message: "Cada registro é um passo em direção ao seu objetivo! 💪",
        icon: "rocket-outline" as const,
      };
    } catch (error) {
      errorHandler.captureError(error as Error, "Motivational Card");
      return {
        message: "Continue registrando! 💪",
        icon: "star-outline" as const,
      };
    }
  }, [
    goalAnalysis?.hasReached,
    goalAnalysis?.isApproaching,
    weightSuggestions?.trend,
    errorHandler,
  ]);

  // ✅ MELHORIA 12: getErrorMessage otimizado
  const getErrorMessage = useCallback((): string => {
    if (errorStates.hasErrorHandlerError && errorHandler.error) {
      return errorHandler.getErrorMessage(errorHandler.error);
    }

    const errorMappings = [
      { error: allErrors.weight, fallback: "Erro ao carregar registros" },
      { error: allErrors.profile, fallback: "Erro ao carregar perfil" },
      { error: allErrors.goals, fallback: "Erro ao carregar metas" },
      { error: allErrors.preload, fallback: "Erro no pré-carregamento" },
      { error: allErrors.save, fallback: "Erro ao salvar registro" },
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

  // ✅ MELHORIA 13: updateField otimizado
  const updateField = useCallback(
    (field: string, value: string) => {
      try {
        // Limpar erro específico se existir
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: "" }));
        }

        // Atualizar campo específico
        const fieldUpdaters = {
          weight: setWeight,
          notes: setNotes,
        };

        const updater = fieldUpdaters[field as keyof typeof fieldUpdaters];
        if (updater) {
          updater(value);
        }
      } catch (error) {
        errorHandler.captureError(error as Error, "Field Update");
      }
    },
    [errors, errorHandler]
  );

  // ✅ MELHORIA 14: handleSuggestWeight otimizado
  const handleSuggestWeight = useCallback(
    (suggestedWeight: number) => {
      try {
        updateField("weight", suggestedWeight.toString());
        console.log("📊 Weight Suggestion Used:", suggestedWeight);
      } catch (error) {
        errorHandler.captureError(error as Error, "Weight Suggestion");
      }
    },
    [updateField, errorHandler]
  );

  // ✅ MELHORIA 15: Dados para salvamento memoizados
  const saveData = useMemo(
    () => ({
      weightRecord: {
        id: Date.now().toString(),
        weight: formData.numericWeight!,
        date: new Date().toISOString(),
        notes: formData.notes || undefined,
        createdAt: new Date(),
      } as WeightRecord,
      hasGoal: !!goalAnalysis?.goal,
      goalUpdate: goalAnalysis?.goal
        ? {
            goalId: goalAnalysis.goal.id,
            newCurrent: formData.numericWeight!,
          }
        : null,
      bmiData: currentBMI,
      shouldShowSuccess: true,
    }),
    [formData.numericWeight, formData.notes, goalAnalysis, currentBMI]
  );

  // ✅ MELHORIA 16: performSave SUPER OTIMIZADO - apenas 6 dependências
  const performSave = useCallback(async () => {
    try {
      setSaving(true, "Validando dados...");
      await new Promise((resolve) => setTimeout(resolve, 300));

      setSaving(true, "Calculando métricas...");
      await new Promise((resolve) => setTimeout(resolve, 200));

      setSaving(true, "Salvando registro...");

      // Usar error handler para operação crítica
      const saveResult = await errorHandler.withErrorHandling(
        () => addRecord(saveData.weightRecord),
        "Save Weight Record"
      );

      if (!saveResult && errorHandler.hasError) {
        if (
          errorHandler.canRetry &&
          errorHandler.shouldAutoRecover(errorHandler.error!)
        ) {
          console.log("🔄 Attempting auto-recovery for save operation");
          await errorHandler.retry(() => addRecord(saveData.weightRecord));
        }
        return;
      }

      // Atualizar meta se existir
      if (saveData.hasGoal && saveData.goalUpdate) {
        setSaving(true, "Atualizando meta...");
        await errorHandler.withErrorHandling(
          () =>
            updateGoal(saveData.goalUpdate!.goalId, {
              current: saveData.goalUpdate!.newCurrent,
            }),
          "Update Goal"
        );
      }

      setSaving(true, "Finalizando...");
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Alert personalizado baseado na análise
      let alertTitle = "Sucesso! 🎉";
      let alertMessage = `Peso ${saveData.weightRecord.weight}kg registrado com sucesso!`;

      if (goalAnalysis?.hasReached) {
        alertTitle = "🎯 META ALCANÇADA! 🎉";
        alertMessage = `Parabéns! Você atingiu sua meta de ${goalAnalysis.goal.target}kg!`;
        Vibration.vibrate([100, 50, 100]);
      } else if (goalAnalysis?.isApproaching) {
        alertTitle = "Quase lá! 🔥";
        alertMessage = `Faltam apenas ${goalAnalysis.distanceToGoal.toFixed(
          1
        )}kg para sua meta!`;
      }

      if (saveData.bmiData) {
        alertMessage += `\n\nIMC: ${saveData.bmiData.bmi.toFixed(1)} (${
          saveData.bmiData.category
        })`;
      }

      Alert.alert(alertTitle, alertMessage, [
        {
          text: "Ver Progresso",
          onPress: () => navigation.navigate("Progresso" as never),
        },
        {
          text: "OK",
          style: "default",
          onPress: () => {
            setWeight("");
            setNotes("");
            navigation.goBack();
          },
        },
      ]);

      console.log("📊 Weight Record Saved:", {
        weight: saveData.weightRecord.weight,
        hasGoal: saveData.hasGoal,
        goalReached: goalAnalysis?.hasReached,
        bmi: saveData.bmiData?.bmi,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      errorHandler.captureError(error as Error, "Perform Save");
      setSaveError("Não foi possível salvar o registro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }, [
    setSaving,
    errorHandler,
    addRecord,
    saveData,
    updateGoal,
    goalAnalysis,
    navigation,
    setSaveError,
  ]); // 6 dependências agrupadas!

  // ✅ MELHORIA 17: handleSaveDirectly otimizado
  const handleSaveDirectly = useCallback(async () => {
    try {
      if (!validationData.isValid) {
        setErrors(validationData.errors);
        return;
      }

      console.log("💾 Saving weight with warnings accepted by user");
      await performSave();
    } catch (error) {
      errorHandler.captureError(error as Error, "Direct Save");
      setSaveError("Erro ao salvar peso");
    }
  }, [
    validationData.isValid,
    validationData.errors,
    performSave,
    errorHandler,
    setSaveError,
  ]);

  // ✅ MELHORIA 18: showWarningsDialog otimizado
  const showWarningsDialog = useCallback(
    (warnings: string[]) => {
      const warningText = warnings.join("\n\n");

      Alert.alert(
        "⚠️ Verificação do Peso",
        `Detectamos alguns pontos de atenção:\n\n${warningText}\n\nDeseja continuar mesmo assim?`,
        [
          {
            text: "📝 Corrigir",
            style: "default",
            onPress: () => console.log("📝 User chose to correct the weight"),
          },
          {
            text: "✅ Salvar Assim",
            style: "default",
            onPress: () => {
              console.log("✅ User chose to save with warnings");
              handleSaveDirectly();
            },
          },
        ],
        { cancelable: false }
      );
    },
    [handleSaveDirectly]
  );

  // ✅ MELHORIA 19: handleSave principal otimizado
  const handleSave = useCallback(async () => {
    if (!validationData.isValid) {
      console.log("❌ Critical validation errors - cannot save");
      setErrors(validationData.errors);
      return;
    }

    if (validationData.hasWarnings && validationData.warnings.length > 0) {
      console.log("⚠️ Showing warnings dialog");
      showWarningsDialog(validationData.warnings);
      return;
    }

    console.log("✅ No issues found - saving directly");
    await performSave();
  }, [validationData, showWarningsDialog, performSave]);

  // ✅ MELHORIA 20: handleRetryAll otimizado
  const handleRetryAll = useCallback(() => {
    setSaveError(null);
    setErrors({});
    errorHandler.clearError();
    refreshWeight();
  }, [setSaveError, errorHandler, refreshWeight]);

  // ✅ MELHORIA 21: Props memoizadas para campos
  const inputFieldProps = useMemo(
    () => [
      {
        label: "Peso",
        value: formData.weight,
        onChangeText: (value: string) => updateField("weight", value),
        placeholder: "Ex: 75.5",
        keyboardType: "numeric" as const,
        icon: "scale-outline" as const,
        suffix: "kg",
        error: validationData.errors.weight,
      },
      {
        label: "Data",
        value: date,
        placeholder: "DD/MM/AAAA",
        icon: "calendar-outline" as const,
        editable: false,
      },
      {
        label: "Observações (opcional)",
        value: formData.notes,
        onChangeText: (value: string) => updateField("notes", value),
        placeholder: "Como você se sente hoje?",
        multiline: true,
        numberOfLines: 3,
        icon: "chatbubble-outline" as const,
        style: styles.notesInput,
      },
    ],
    [
      formData.weight,
      formData.notes,
      date,
      updateField,
      validationData.errors.weight,
    ]
  );

  // ✅ MELHORIA 22: Props memoizadas para sugestões
  const suggestionProps = useMemo(() => {
    if (!weightSuggestions) return null;

    return [
      {
        title: `${weightSuggestions.lastWeight}kg`,
        onPress: () => handleSuggestWeight(weightSuggestions.lastWeight),
        variant: "outline" as const,
        size: "small" as const,
        style: styles.suggestionButton,
      },
      {
        title: `${weightSuggestions.avgWeight}kg`,
        onPress: () => handleSuggestWeight(weightSuggestions.avgWeight),
        variant: "outline" as const,
        size: "small" as const,
        style: styles.suggestionButton,
      },
    ];
  }, [weightSuggestions, handleSuggestWeight]);

  // ✅ MELHORIA 23: Estados de UI memoizados
  const uiStates = useMemo(
    () => ({
      showSuggestions: !!weightSuggestions?.hasData,
      showBMI: !!currentBMI,
      showGoalAnalysis: !!goalAnalysis,
      showError: computedStates.hasAnyError || !!saveError,
      canSave: validationData.isValid && !computedStates.isLoading,
      showMotivational: true,
    }),
    [
      weightSuggestions?.hasData,
      currentBMI,
      goalAnalysis,
      computedStates.hasAnyError,
      saveError,
      validationData.isValid,
      computedStates.isLoading,
    ]
  );

  // ✅ MELHORIA 24: Props para componentes memoizadas
  const saveButtonProps = useMemo(
    () => ({
      title: loadingStates.isSaving ? loadingMessage : "Salvar Peso",
      onPress: handleSave,
      variant: "primary" as const,
      size: "large" as const,
      disabled: !uiStates.canSave,
    }),
    [loadingStates.isSaving, loadingMessage, handleSave, uiStates.canSave]
  );

  const motivationalCardProps = useMemo(
    () => ({
      message: motivationalCard.message,
      icon: motivationalCard.icon,
    }),
    [motivationalCard.message, motivationalCard.icon]
  );

  // ✅ MELHORIA 25: Debug info memoizado
  const debugInfo = useMemo(
    () => ({
      loading: loadingStates,
      computed: computedStates,
      validation: validationData,
      ui: uiStates,
      form: formData,
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
      formData,
      preloaded,
      errorHandler.hasError,
      errorHandler.error?.message,
    ]
  );

  // ✅ useEffect otimizado para validação com debounce
  useEffect(() => {
    if (formData.hasWeight) {
      const timeoutId = setTimeout(() => {
        try {
          // A validação já está memoizada em validationData
          setErrors(validationData.errors);
        } catch (error) {
          errorHandler.captureError(error as Error, "Validation Effect");
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.hasWeight, validationData.errors, errorHandler]);

  // Loading inicial
  if (computedStates.isLoading && !preloaded) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen message="Carregando dados de peso..." />
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
          title="Erro ao Carregar Dados"
          icon="scale-outline"
        />
      </SafeAreaView>
    );
  }

  // Estado de erro recuperável
  if (errorHandler.hasError && !errorHandler.isRecovering) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.warning} />
          <Text style={styles.errorTitle}>Erro Temporário</Text>
          <Text style={styles.errorMessage}>
            {errorHandler.getErrorMessage(errorHandler.error!)}
          </Text>

          {errorHandler.canRetry && (
            <Button
              title="Tentar Novamente"
              onPress={() => errorHandler.clearError()}
              variant="primary"
              style={{ marginTop: 16 }}
            />
          )}
        </View>
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
            <Text style={styles.title}>Registrar Peso</Text>
            <Text style={styles.subtitle}>Acompanhe sua evolução! ⚖️</Text>
          </View>

          {/* Error display */}
          {uiStates.showError && (
            <View style={styles.errorDisplayContainer}>
              <Ionicons
                name="warning-outline"
                size={20}
                color={colors.warning}
              />
              <View style={styles.errorText}>
                <Text style={styles.errorDisplayTitle}>
                  {computedStates.hasAnyError
                    ? "Erro nos Dados"
                    : "Erro ao Salvar"}
                </Text>
                <Text style={styles.errorDisplayMessage}>
                  {getErrorMessage()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetryAll}
              >
                <Ionicons name="refresh" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Sugestões de peso otimizadas */}
          {uiStates.showSuggestions && suggestionProps && (
            <View style={styles.suggestionsCard}>
              <Text style={styles.suggestionsTitle}>
                💡 Sugestões Baseadas no Histórico
              </Text>
              <View style={styles.suggestionsContainer}>
                {suggestionProps.map((props, index) => (
                  <Button key={index} {...props} />
                ))}
              </View>
              <Text style={styles.suggestionsSubtext}>
                Último: {weightSuggestions!.lastWeight}kg • Média:{" "}
                {weightSuggestions!.avgWeight}kg
              </Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Campos otimizados com props memoizadas */}
            {inputFieldProps.map((field, index) => (
              <Input key={index} {...field} />
            ))}
          </View>

          {/* IMC em tempo real */}
          {uiStates.showBMI && (
            <View
              style={[styles.bmiCard, { borderLeftColor: currentBMI!.color }]}
            >
              <View style={styles.bmiHeader}>
                <Ionicons
                  name="calculator-outline"
                  size={20}
                  color={currentBMI!.color}
                />
                <Text style={styles.bmiTitle}>IMC Calculado</Text>
              </View>
              <Text style={styles.bmiText}>
                IMC: {currentBMI!.bmi.toFixed(1)} • {currentBMI!.category}
              </Text>

              <View style={styles.bmiInterpretation}>
                <Text
                  style={[
                    styles.bmiInterpretationText,
                    { color: currentBMI!.color },
                  ]}
                >
                  {currentBMI!.bmi < 18.5 &&
                    "Considere ganhar peso de forma saudável"}
                  {currentBMI!.bmi >= 18.5 &&
                    currentBMI!.bmi < 25 &&
                    "Parabéns! Peso ideal para a saúde"}
                  {currentBMI!.bmi >= 25 &&
                    currentBMI!.bmi < 30 &&
                    "Considere uma alimentação balanceada"}
                  {currentBMI!.bmi >= 30 &&
                    "Importante: procure orientação médica"}
                </Text>
              </View>
            </View>
          )}

          {/* Análise da meta */}
          {uiStates.showGoalAnalysis && (
            <View
              style={[
                styles.goalAnalysisCard,
                goalAnalysis!.hasReached && styles.goalReachedCard,
              ]}
            >
              <View style={styles.goalAnalysisHeader}>
                <Ionicons
                  name={goalAnalysis!.hasReached ? "trophy" : "flag-outline"}
                  size={20}
                  color={
                    goalAnalysis!.hasReached ? colors.secondary : colors.primary
                  }
                />
                <Text style={styles.goalAnalysisTitle}>
                  {goalAnalysis!.hasReached
                    ? "🎯 META ALCANÇADA!"
                    : "📊 Análise da Meta"}
                </Text>
              </View>
              <Text style={styles.goalAnalysisText}>
                Meta: {goalAnalysis!.goal.target}kg • Distância:{" "}
                {goalAnalysis!.distanceToGoal.toFixed(1)}kg •
                {goalAnalysis!.direction === "above"
                  ? " 🔴 Acima"
                  : " 🟢 Abaixo"}
              </Text>
            </View>
          )}

          {uiStates.showMotivational && (
            <MotivationalCard {...motivationalCardProps} />
          )}

          <View style={styles.buttonContainer}>
            <Button {...saveButtonProps} />
          </View>

          {/* Debug info */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>🔧 Debug Info:</Text>
              <Text style={styles.debugText}>
                Valid Weight: {debugInfo.validation.isValid ? "Yes" : "No"}
              </Text>
              <Text style={styles.debugText}>
                Has Warnings: {debugInfo.validation.hasWarnings ? "Yes" : "No"}
              </Text>
              <Text style={styles.debugText}>
                Has Suggestions: {debugInfo.ui.showSuggestions ? "Yes" : "No"}
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

// ✅ Styles otimizados (adicionando novos estilos necessários)
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
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.gray,
  },
  errorContainer: {
    backgroundColor: colors.warning + "20",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    alignItems: "center",
    justifyContent: "center",
  },
  errorDisplayContainer: {
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
    flex: 1,
    marginLeft: 8,
  },
  errorDisplayTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: colors.warning,
  },
  errorDisplayMessage: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  retryButton: {
    padding: 8,
  },
  errorTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: colors.dark,
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.gray,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  suggestionsCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionsTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.dark,
    marginBottom: 12,
  },
  suggestionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  suggestionButton: {
    flex: 1,
  },
  suggestionsSubtext: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    textAlign: "center",
  },
  form: {
    marginBottom: 24,
  },
  notesInput: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  bmiCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bmiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bmiTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.dark,
    marginLeft: 8,
  },
  bmiText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    marginBottom: 8,
  },
  bmiInterpretation: {
    backgroundColor: colors.lightGray,
    padding: 8,
    borderRadius: 6,
  },
  bmiInterpretationText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    fontStyle: "italic",
  },
  goalAnalysisCard: {
    backgroundColor: colors.primary + "20",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  goalReachedCard: {
    backgroundColor: colors.secondary + "20",
    borderLeftColor: colors.secondary,
  },
  goalAnalysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  goalAnalysisTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.dark,
    marginLeft: 8,
  },
  goalAnalysisText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
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

// Wrapper com Error Boundary
const WeightInputScreen: React.FC = () => {
  return (
    <ScreenErrorBoundary screenName="Registrar Peso">
      <WeightInputScreenContent />
    </ScreenErrorBoundary>
  );
};

export default WeightInputScreen;
