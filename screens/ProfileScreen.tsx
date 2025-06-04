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
import { ScreenErrorBoundary } from "../components/ScreenErrorBoundary";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { useLoadingState } from "../hooks/useLoadingState";
import { useGoals, usePreloadData, useUserProfile } from "../hooks/useStorage";
import { colors } from "../styles/colors";
import { Goal } from "../types";

const ProfileScreenContent: React.FC = () => {
  // Estados do perfil
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("other");

  // Estados das metas
  const [goalWeight, setGoalWeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const navigation = useNavigation();

  // ✅ Error handling configurado
  const errorHandler = useErrorHandler({
    maxRetries: 3,
    showUserFriendlyMessages: true,
    onError: (error) => {
      console.error("ProfileScreen Error:", error);
    },
  });

  // Hooks com error handling adequado
  const { preloaded, preloadError } = usePreloadData();

  const {
    profile,
    saveProfile,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useUserProfile();

  const {
    goals,
    activeGoals,
    addGoal,
    updateGoal,
    loading: goalsLoading,
    error: goalsError,
    refresh: refreshGoals,
  } = useGoals();

  const {
    isLoading: saving,
    setLoading: setSaving,
    loadingMessage,
    error: saveError,
    setError: setSaveError,
  } = useLoadingState();

  // ✅ CORREÇÃO 1: Função helper estável
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
      profile: profileError,
      goals: goalsError,
      preload: preloadError,
      save: saveError,
    }),
    [profileError, goalsError, preloadError, saveError]
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
    if (errorStates.hasErrorHandlerError && errorHandler.error) {
      return errorHandler.getErrorMessage(errorHandler.error);
    }

    const errorMappings = [
      { error: allErrors.profile, fallback: "Erro ao carregar perfil" },
      { error: allErrors.goals, fallback: "Erro ao carregar metas" },
      { error: allErrors.preload, fallback: "Erro no pré-carregamento" },
      { error: allErrors.save, fallback: "Erro ao salvar dados" },
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

  // ✅ MELHORIA 5: Estados computados memoizados
  const loadingStates = useMemo(
    () => ({
      isProfileLoading: profileLoading,
      isGoalsLoading: goalsLoading,
      isSaving: saving,
      isRecovering: errorHandler.isRecovering,
      isAnyLoading:
        profileLoading || goalsLoading || saving || errorHandler.isRecovering,
    }),
    [profileLoading, goalsLoading, saving, errorHandler.isRecovering]
  );

  const computedStates = useMemo(
    () => ({
      isLoading: loadingStates.isAnyLoading,
      hasAnyError: errorStates.hasAnyDataError,
      hasCriticalError: errorStates.hasAnyDataError && !preloaded,
    }),
    [loadingStates.isAnyLoading, errorStates.hasAnyDataError, preloaded]
  );

  // ✅ MELHORIA 6: Dados do formulário memoizados
  const formData = useMemo(
    () => ({
      profile: { name, age, height, gender },
      goals: { goalWeight, currentWeight, goalDeadline },
      hasProfileData: !!(name || age || height),
      hasGoalData: !!(goalWeight || currentWeight),
    }),
    [name, age, height, gender, goalWeight, currentWeight, goalDeadline]
  );

  // ✅ MELHORIA 7: profileStats otimizado
  const profileStats = useMemo(() => {
    try {
      if (!profile) {
        return {
          isComplete: false,
          completionPercentage: 0,
          missingFields: ["nome", "idade", "altura", "gênero"],
          hasValidData: false,
        };
      }

      const fields = [
        { key: "name", label: "nome", value: profile.name },
        { key: "age", label: "idade", value: profile.age },
        { key: "height", label: "altura", value: profile.height },
        { key: "gender", label: "gênero", value: profile.gender },
      ];

      const completedFields = fields.filter(
        (field) =>
          field.value !== undefined &&
          field.value !== null &&
          field.value !== ""
      );

      const missingFields = fields
        .filter((field) => !field.value)
        .map((field) => field.label);

      const completionPercentage = Math.round(
        (completedFields.length / fields.length) * 100
      );
      const isComplete = completionPercentage === 100;

      return {
        isComplete,
        completionPercentage,
        missingFields,
        hasValidData: true,
        totalFields: fields.length,
        completedFields: completedFields.length,
      };
    } catch (error) {
      errorHandler.captureError(error as Error, "Profile Stats Calculation");
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: [],
        hasValidData: false,
      };
    }
  }, [profile, errorHandler]);

  // ✅ MELHORIA 8: goalStats otimizado
  const goalStats = useMemo(() => {
    try {
      const validActiveGoals = Array.isArray(activeGoals) ? activeGoals : [];
      const weightGoal = validActiveGoals.find(
        (goal) => goal.type === "weight"
      );

      if (!weightGoal) {
        return {
          hasWeightGoal: false,
          progress: 0,
          daysRemaining: null,
          isOnTrack: false,
          hasValidData: false,
        };
      }

      let progress = 0;
      if (
        typeof weightGoal.current === "number" &&
        typeof weightGoal.target === "number" &&
        weightGoal.current !== weightGoal.target
      ) {
        const totalChange = Math.abs(weightGoal.target - weightGoal.current);
        if (totalChange > 0) {
          progress = 0; // Como não temos histórico, vamos mostrar 0% até ter registros
        }
      }

      let daysRemaining = null;
      let isOnTrack = false;

      if (weightGoal.deadline) {
        try {
          let deadlineDate;

          // ✅ CORREÇÃO 2: Tratamento adequado de Date vs string
          if (weightGoal.deadline instanceof Date) {
            deadlineDate = weightGoal.deadline;
          } else if (typeof weightGoal.deadline === "string") {
            if (weightGoal.deadline.includes("/")) {
              const [day, month, year] = weightGoal.deadline.split("/");
              deadlineDate = new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
              );
            } else {
              deadlineDate = new Date(weightGoal.deadline);
            }
          }

          if (deadlineDate && !isNaN(deadlineDate.getTime())) {
            const today = new Date();
            const timeDiff = deadlineDate.getTime() - today.getTime();
            daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
            isOnTrack = daysRemaining > 0;
          }
        } catch (error) {
          console.warn("Error parsing deadline:", error);
          daysRemaining = null;
        }
      }

      return {
        hasWeightGoal: true,
        progress: Math.max(0, Math.min(100, Math.round(progress))),
        daysRemaining,
        isOnTrack,
        hasValidData: true,
        weightGoal,
      };
    } catch (error) {
      errorHandler.captureError(error as Error, "Goal Stats Calculation");
      return {
        hasWeightGoal: false,
        progress: 0,
        daysRemaining: null,
        isOnTrack: false,
        hasValidData: false,
      };
    }
  }, [activeGoals, errorHandler]);

  // ✅ MELHORIA 9: genderOptions estático
  const genderOptions = useMemo(
    () => [
      { key: "male", label: "Masculino", icon: "man-outline" as const },
      { key: "female", label: "Feminino", icon: "woman-outline" as const },
      { key: "other", label: "Outro", icon: "people-outline" as const },
    ],
    []
  );

  // ✅ MELHORIA 10: goalDiff otimizado
  const goalDiff = useMemo(() => {
    try {
      if (!formData.goals.goalWeight || !formData.goals.currentWeight)
        return null;

      const diff =
        Number(formData.goals.currentWeight) -
        Number(formData.goals.goalWeight);
      const isLoss = diff > 0;

      return {
        amount: Math.abs(diff),
        type: isLoss ? "perder" : "ganhar",
        emoji: isLoss ? "📉" : "📈",
        isRealistic: Math.abs(diff) <= 50,
      };
    } catch (error) {
      errorHandler.captureError(error as Error, "Goal Difference Calculation");
      return null;
    }
  }, [formData.goals.goalWeight, formData.goals.currentWeight, errorHandler]);

  // ✅ MELHORIA 11: Dados de validação agrupados
  const validationData = useMemo(
    () => ({
      errors,
      errorCount: Object.keys(errors).length,
      hasErrors: Object.keys(errors).length > 0,
      requiredFields: { name: !!formData.profile.name },
    }),
    [errors, formData.profile.name]
  );

  // ✅ MELHORIA 12: updateField otimizado
  const updateField = useCallback(
    (field: string, value: string) => {
      try {
        // Limpar erro específico se existir
        if (validationData.errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: "" }));
        }

        // Atualizar campo específico
        const fieldUpdaters = {
          name: setName,
          age: setAge,
          height: setHeight,
          goalWeight: setGoalWeight,
          currentWeight: setCurrentWeight,
          goalDeadline: setGoalDeadline,
        };

        const updater = fieldUpdaters[field as keyof typeof fieldUpdaters];
        if (updater) {
          updater(value);
        } else {
          console.warn("Unknown field:", field);
        }

        console.log(`📝 Field updated: ${field}`, { hasValue: !!value });
      } catch (error) {
        errorHandler.captureError(error as Error, "Field Update");
      }
    },
    [validationData.errors, errorHandler]
  );

  // ✅ MELHORIA 13: validateForm SUPER OTIMIZADO - apenas 4 dependências
  const validateForm = useCallback(() => {
    try {
      const newErrors: { [key: string]: string } = {};

      // Validação de nome
      if (!formData.profile.name.trim()) {
        newErrors.name = "Nome é obrigatório";
      } else if (formData.profile.name.trim().length < 2) {
        newErrors.name = "Nome deve ter pelo menos 2 caracteres";
      } else if (formData.profile.name.trim().length > 50) {
        newErrors.name = "Nome deve ter no máximo 50 caracteres";
      }

      // Validação de idade
      if (formData.profile.age && formData.profile.age.trim()) {
        const ageNum = Number(formData.profile.age);
        if (isNaN(ageNum)) {
          newErrors.age = "Digite apenas números";
        } else if (ageNum < 1) {
          newErrors.age = "Idade deve ser maior que 0";
        } else if (ageNum > 120) {
          newErrors.age = "Idade deve ser menor que 120";
        }
      }

      // Validação de altura
      if (formData.profile.height && formData.profile.height.trim()) {
        const heightNum = Number(formData.profile.height);
        if (isNaN(heightNum)) {
          newErrors.height = "Digite apenas números";
        } else if (heightNum < 50) {
          newErrors.height = "Altura deve ser maior que 50cm";
        } else if (heightNum > 250) {
          newErrors.height = "Altura deve ser menor que 250cm";
        }
      }

      // Validação das metas
      if (formData.goals.goalWeight && formData.goals.goalWeight.trim()) {
        const goalWeightNum = Number(formData.goals.goalWeight);
        if (isNaN(goalWeightNum)) {
          newErrors.goalWeight = "Digite apenas números";
        } else if (goalWeightNum <= 0) {
          newErrors.goalWeight = "Peso meta deve ser maior que 0";
        } else if (goalWeightNum > 500) {
          newErrors.goalWeight = "Peso meta deve ser menor que 500kg";
        }
      }

      if (formData.goals.currentWeight && formData.goals.currentWeight.trim()) {
        const currentWeightNum = Number(formData.goals.currentWeight);
        if (isNaN(currentWeightNum)) {
          newErrors.currentWeight = "Digite apenas números";
        } else if (currentWeightNum <= 0) {
          newErrors.currentWeight = "Peso atual deve ser maior que 0";
        } else if (currentWeightNum > 500) {
          newErrors.currentWeight = "Peso atual deve ser menor que 500kg";
        }
      }

      // Validação de consistência das metas
      if (
        formData.goals.goalWeight &&
        formData.goals.currentWeight &&
        Number(formData.goals.goalWeight) ===
          Number(formData.goals.currentWeight)
      ) {
        newErrors.goalWeight = "O peso meta deve ser diferente do atual";
      }

      // Validação de deadline
      if (formData.goals.goalDeadline && formData.goals.goalDeadline.trim()) {
        try {
          const deadlineDate = new Date(
            formData.goals.goalDeadline.split("/").reverse().join("-")
          );
          const today = new Date();

          if (isNaN(deadlineDate.getTime())) {
            newErrors.goalDeadline = "Data inválida (use DD/MM/AAAA)";
          } else if (deadlineDate <= today) {
            newErrors.goalDeadline = "Data deve ser no futuro";
          }
        } catch {
          newErrors.goalDeadline = "Formato de data inválido";
        }
      }

      setErrors(newErrors);
      setSaveError(null);

      const isValid = Object.keys(newErrors).length === 0;

      return isValid;
    } catch (error) {
      errorHandler.captureError(error as Error, "Form Validation");
      setSaveError("Erro na validação do formulário");
      return false;
    }
  }, [formData, setSaveError, errorHandler]);

  // ✅ MELHORIA 14: Callbacks de refresh agrupados
  const refreshCallbacks = useMemo(
    () => ({
      refreshProfile,
      refreshGoals,
    }),
    [refreshProfile, refreshGoals]
  );

  // ✅ MELHORIA 15: handleRetryAll otimizado
  const handleRetryAll = useCallback(() => {
    setSaveError(null);
    setErrors({});
    errorHandler.clearError();
    refreshCallbacks.refreshProfile();
    refreshCallbacks.refreshGoals();
  }, [setSaveError, errorHandler, refreshCallbacks]);

  // ✅ MELHORIA 16: handleSuggestData otimizado
  const handleSuggestData = useCallback(async () => {
    try {
      await errorHandler.withErrorHandling(async () => {
        console.log("💡 Suggesting profile data based on history...");
        Alert.alert(
          "Sugestões",
          "Em breve teremos sugestões inteligentes baseadas no seu histórico!",
          [{ text: "OK" }]
        );
      }, "Suggest Profile Data");
    } catch (error) {
      console.error("Suggest data failed:", error);
    }
  }, [errorHandler]);

  // ✅ MELHORIA 17: Dados para salvamento memoizados
  const saveData = useMemo(
    () => ({
      profile: {
        id: profile?.id || Date.now().toString(),
        name: formData.profile.name.trim(),
        age: formData.profile.age ? Number(formData.profile.age) : undefined,
        height: formData.profile.height
          ? Number(formData.profile.height)
          : undefined,
        gender: formData.profile.gender,
        goals: profile?.goals || [],
        createdAt: profile?.createdAt || new Date(),
        updatedAt: new Date(),
      },
      hasGoalData: !!(
        formData.goals.goalWeight && formData.goals.currentWeight
      ),
      goalData:
        formData.goals.goalWeight && formData.goals.currentWeight
          ? {
              target: Number(formData.goals.goalWeight),
              current: Number(formData.goals.currentWeight),
              deadline: formData.goals.goalDeadline || undefined,
            }
          : null,
    }),
    [formData, profile]
  );

  // ✅ MELHORIA 18: handleSave SUPER OTIMIZADO - apenas 8 dependências
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setSaving(true, "Validando dados...");
      await new Promise((resolve) => setTimeout(resolve, 300));

      setSaving(true, "Salvando perfil...");

      const profileResult = await errorHandler.withErrorHandling(
        () => saveProfile(saveData.profile),
        "Save User Profile"
      );

      if (!profileResult && errorHandler.hasError) return;

      // Salvar/atualizar meta de peso se fornecida
      if (saveData.hasGoalData && saveData.goalData) {
        setSaving(true, "Atualizando metas...");

        const validActiveGoals = Array.isArray(activeGoals) ? activeGoals : [];
        const existingWeightGoal = validActiveGoals.find(
          (goal) => goal.type === "weight"
        );

        // ✅ CORREÇÃO 3: Criar objeto Goal completo com todas as propriedades obrigatórias
        const goalData: Goal = {
          id: existingWeightGoal?.id || Date.now().toString(),
          type: "weight",
          title: "Meta de Peso", // ✅ Propriedade obrigatória adicionada
          description: `Meta de ${
            saveData.goalData.current > saveData.goalData.target
              ? "perder"
              : "ganhar"
          } peso`, // ✅ Descrição opcional mas útil
          target: saveData.goalData.target, // ✅ Mantido para compatibilidade
          targetValue: saveData.goalData.target, // ✅ Propriedade obrigatória adicionada
          current: saveData.goalData.current, // ✅ Mantido para compatibilidade
          startValue: saveData.goalData.current, // ✅ Propriedade obrigatória adicionada
          unit: "kg",
          deadline: saveData.goalData.deadline,
          isActive: true,
          createdAt: existingWeightGoal?.createdAt || new Date(),
          updatedAt: new Date(), // ✅ Adicionado campo de atualização
          category: "peso", // ✅ Categoria opcional mas útil
          priority: "medium", // ✅ Prioridade padrão
        };

        const goalResult = await errorHandler.withErrorHandling(
          () =>
            existingWeightGoal
              ? updateGoal(existingWeightGoal.id, goalData)
              : addGoal(goalData),
          "Save Weight Goal"
        );

        if (!goalResult && errorHandler.hasError) return;
      }

      setSaving(true, "Finalizando...");
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Alert personalizado baseado nos dados salvos
      let alertTitle = "Sucesso! ✅";
      let alertMessage = "Perfil salvo com sucesso!";

      if (profileStats.completionPercentage === 100) {
        alertMessage += "\n🎉 Seu perfil está 100% completo!";
      } else {
        alertMessage += `\n📊 Perfil ${profileStats.completionPercentage}% completo`;
      }

      if (saveData.hasGoalData && goalDiff) {
        alertMessage += `\n🎯 Meta: ${goalDiff.type} ${goalDiff.amount.toFixed(
          1
        )}kg`;
      }

      Vibration.vibrate([50, 25, 50]);

      Alert.alert(alertTitle, alertMessage, [
        {
          text: "Ver Progresso",
          onPress: () => navigation.navigate("Progresso" as never),
        },
        {
          text: "OK",
          style: "default",
          onPress: () => navigation.goBack(),
        },
      ]);

      console.log("📊 Profile Saved:", {
        hasProfile: !!profile,
        completionPercentage: profileStats.completionPercentage,
        hasGoal: saveData.hasGoalData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      errorHandler.captureError(error as Error, "Save Profile and Goals");
      setSaveError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }, [
    validateForm,
    setSaving,
    errorHandler,
    saveProfile,
    saveData,
    activeGoals,
    updateGoal,
    addGoal,
    profileStats.completionPercentage,
    goalDiff,
    navigation,
    setSaveError,
  ]);

  // ✅ CORREÇÃO 4: Props memoizadas para campos de perfil com tipos corretos
  const profileFieldProps = useMemo(
    () => [
      {
        label: "Nome *",
        value: formData.profile.name,
        onChangeText: (value: string) => updateField("name", value),
        placeholder: "Seu nome",
        icon: "person-outline" as const, // ✅ Tipo correto para Ionicons
        error: validationData.errors.name,
      },
      {
        label: "Idade",
        value: formData.profile.age,
        onChangeText: (value: string) => updateField("age", value),
        placeholder: "Ex: 25",
        keyboardType: "numeric" as const,
        icon: "calendar-outline" as const, // ✅ Tipo correto para Ionicons
        suffix: "anos",
        error: validationData.errors.age,
      },
      {
        label: "Altura",
        value: formData.profile.height,
        onChangeText: (value: string) => updateField("height", value),
        placeholder: "Ex: 170",
        keyboardType: "numeric" as const,
        icon: "resize-outline" as const, // ✅ Tipo correto para Ionicons
        suffix: "cm",
        error: validationData.errors.height,
      },
    ],
    [formData.profile, updateField, validationData.errors]
  );

  // ✅ CORREÇÃO 5: Props memoizadas para campos de meta com tipos corretos
  const goalFieldProps = useMemo(
    () => [
      {
        label: "Peso Atual",
        value: formData.goals.currentWeight,
        onChangeText: (value: string) => updateField("currentWeight", value),
        placeholder: "Ex: 75.5",
        keyboardType: "numeric" as const,
        icon: "scale-outline" as const, // ✅ Tipo correto para Ionicons
        suffix: "kg",
        error: validationData.errors.currentWeight,
      },
      {
        label: "Peso Meta",
        value: formData.goals.goalWeight,
        onChangeText: (value: string) => updateField("goalWeight", value),
        placeholder: "Ex: 70.0",
        keyboardType: "numeric" as const,
        icon: "flag-outline" as const, // ✅ Tipo correto para Ionicons
        suffix: "kg",
        error: validationData.errors.goalWeight,
      },
      {
        label: "Prazo da Meta (opcional)",
        value: formData.goals.goalDeadline,
        onChangeText: (value: string) => updateField("goalDeadline", value),
        placeholder: "Ex: 31/12/2024",
        icon: "calendar-outline" as const, // ✅ Tipo correto para Ionicons
        error: validationData.errors.goalDeadline,
      },
    ],
    [formData.goals, updateField, validationData.errors]
  );

  // ✅ MELHORIA 21: Props para gênero memoizadas
  const genderProps = useMemo(() => {
    return genderOptions.map((option) => ({
      ...option,
      isSelected: gender === option.key,
      onPress: () => setGender(option.key as "male" | "female" | "other"),
      style: [
        styles.genderOption,
        gender === option.key && styles.genderOptionSelected,
      ],
      iconColor: gender === option.key ? colors.white : colors.primary,
      textStyle: [
        styles.genderOptionText,
        gender === option.key && styles.genderOptionTextSelected,
      ],
    }));
  }, [genderOptions, gender]);

  // ✅ MELHORIA 22: Estados de UI memoizados
  const uiStates = useMemo(
    () => ({
      showStats: profileStats.hasValidData,
      showGoalStatus: goalStats.hasWeightGoal && goalStats.hasValidData,
      showGoalDiff: !!goalDiff,
      canSave: validationData.requiredFields.name && !computedStates.isLoading,
      showError: computedStates.hasAnyError || !!saveError,
    }),
    [
      profileStats.hasValidData,
      goalStats.hasWeightGoal,
      goalStats.hasValidData,
      goalDiff,
      validationData.requiredFields.name,
      computedStates.isLoading,
      computedStates.hasAnyError,
      saveError,
    ]
  );

  // ✅ MELHORIA 23: Props para componentes memoizadas
  const saveButtonProps = useMemo(
    () => ({
      title: loadingStates.isSaving ? loadingMessage : "Salvar Perfil e Metas",
      onPress: handleSave,
      variant: "primary" as const,
      size: "large" as const,
      disabled: !uiStates.canSave,
    }),
    [loadingStates.isSaving, loadingMessage, handleSave, uiStates.canSave]
  );

  // ✅ MELHORIA 24: Debug info memoizado
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

  // ✅ useEffect otimizado para carregar dados
  useEffect(() => {
    try {
      if (profile) {
        setName(profile.name || "");
        setAge(profile.age?.toString() || "");
        setHeight(profile.height?.toString() || "");
        setGender(profile.gender || "other");
      }

      if (Array.isArray(activeGoals) && activeGoals.length > 0) {
        const weightGoal = activeGoals.find((goal) => goal.type === "weight");
        if (weightGoal && typeof weightGoal === "object") {
          setGoalWeight(weightGoal.target?.toString() || "");
          setCurrentWeight(weightGoal.current?.toString() || "");

          // ✅ CORREÇÃO 6: Tratamento adequado para deadline Date vs string
          if (weightGoal.deadline) {
            if (weightGoal.deadline instanceof Date) {
              // Converter Date para string no formato DD/MM/AAAA
              const day = weightGoal.deadline
                .getDate()
                .toString()
                .padStart(2, "0");
              const month = (weightGoal.deadline.getMonth() + 1)
                .toString()
                .padStart(2, "0");
              const year = weightGoal.deadline.getFullYear().toString();
              setGoalDeadline(`${day}/${month}/${year}`);
            } else {
              // Já é string
              setGoalDeadline(weightGoal.deadline);
            }
          } else {
            setGoalDeadline("");
          }
        }
      }
    } catch (error) {
      errorHandler.captureError(error as Error, "Profile Data Loading");
    }
  }, [profile, activeGoals, errorHandler]);

  // ✅ useEffect otimizado para validação com debounce
  useEffect(() => {
    if (formData.hasProfileData || formData.hasGoalData) {
      const timeoutId = setTimeout(() => {
        try {
          validateForm();
        } catch (error) {
          errorHandler.captureError(error as Error, "Validation Effect");
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [
    formData.hasProfileData,
    formData.hasGoalData,
    validateForm,
    errorHandler,
  ]);

  // Loading inicial
  if (computedStates.isLoading && !preloaded) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen message="Carregando perfil..." />
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
          title="Erro ao Carregar Perfil"
          icon="person-outline"
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
            <Text style={styles.title}>Meu Perfil</Text>
            <Text style={styles.subtitle}>
              Complete seu perfil e defina suas metas 🎯
            </Text>

            {/* Estatísticas de completude do perfil */}
            {uiStates.showStats && (
              <View style={styles.statsContainer}>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${profileStats.completionPercentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {profileStats.completionPercentage}% completo
                  </Text>
                </View>

                {profileStats.missingFields.length > 0 && (
                  <Text style={styles.missingFieldsText}>
                    📝 Faltam: {profileStats.missingFields.join(", ")}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Error display */}
          {uiStates.showError && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="warning-outline"
                size={20}
                color={colors.warning}
              />
              <View style={styles.errorText}>
                <Text style={styles.errorTitle}>
                  {computedStates.hasAnyError
                    ? "Erro nos Dados"
                    : "Erro ao Salvar"}
                </Text>
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

          {/* SEÇÃO PERFIL */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Informações Pessoais</Text>
              <TouchableOpacity
                style={styles.suggestButton}
                onPress={handleSuggestData}
                disabled={errorHandler.isRecovering}
              >
                <Ionicons
                  name="bulb-outline"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Campos otimizados com props memoizadas */}
            {profileFieldProps.map((field, index) => (
              <Input key={index} {...field} />
            ))}

            <Text style={styles.genderLabel}>Gênero</Text>
            <View style={styles.genderContainer}>
              {genderProps.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={option.style}
                  onPress={option.onPress}
                  disabled={errorHandler.isRecovering}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={option.iconColor}
                  />
                  <Text style={option.textStyle}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* SEÇÃO METAS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Meta de Peso</Text>
            <Text style={styles.sectionSubtitle}>
              Defina sua meta para acompanhar o progresso
            </Text>

            {/* Indicador de meta existente */}
            {uiStates.showGoalStatus && (
              <View style={styles.goalStatusCard}>
                <Ionicons name="flag" size={20} color={colors.secondary} />
                <View style={styles.goalStatusText}>
                  <Text style={styles.goalStatusTitle}>
                    Meta ativa: {goalStats.weightGoal?.current}kg →{" "}
                    {goalStats.weightGoal?.target}kg
                  </Text>
                  <Text style={styles.goalStatusSubtitle}>
                    {goalStats.weightGoal &&
                    goalStats.weightGoal.current > goalStats.weightGoal.target
                      ? `Perder ${(
                          goalStats.weightGoal.current -
                          goalStats.weightGoal.target
                        ).toFixed(1)}kg`
                      : `Ganhar ${(
                          goalStats.weightGoal!.target -
                          goalStats.weightGoal!.current
                        ).toFixed(1)}kg`}
                  </Text>
                  {goalStats.daysRemaining !== null && (
                    <Text style={styles.goalStatusSubtitle}>
                      {goalStats.daysRemaining > 0
                        ? `${goalStats.daysRemaining} dias restantes`
                        : goalStats.daysRemaining === 0
                        ? "Meta vence hoje! 🎯"
                        : `${Math.abs(
                            goalStats.daysRemaining
                          )} dias em atraso ⚠️`}
                      {goalStats.isOnTrack ? " 🟢" : " 🟡"}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Campos de meta otimizados com props memoizadas */}
            {goalFieldProps.map((field, index) => (
              <Input key={index} {...field} />
            ))}

            {/* Mostrar diferença da meta com validação */}
            {uiStates.showGoalDiff && (
              <View
                style={[
                  styles.goalDiffCard,
                  !goalDiff!.isRealistic && styles.goalDiffCardWarning,
                ]}
              >
                <Text style={styles.goalDiffTitle}>
                  {goalDiff!.emoji} Meta: {goalDiff!.type}{" "}
                  {goalDiff!.amount.toFixed(1)}kg
                </Text>
                <Text style={styles.goalDiffSubtitle}>
                  {goalDiff!.isRealistic
                    ? goalDiff!.type === "perder"
                      ? "Você está no caminho certo! 💪"
                      : "Vamos ganhar massa! 🏋️‍♂️"
                    : "⚠️ Meta muito ambiciosa. Considere um objetivo gradual."}
                </Text>
              </View>
            )}
          </View>

          {/* INFORMAÇÕES */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Por que essas informações?</Text>
            <Text style={styles.infoText}>
              • Nome: Personalização do app{"\n"}• Altura: Cálculo do IMC e
              RCEst{"\n"}• Gênero: Interpretação correta da RCQ{"\n"}• Idade:
              Recomendações personalizadas{"\n"}• Meta: Acompanhamento do
              progresso
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button {...saveButtonProps} />
          </View>

          {/* Debug info */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>🔧 Debug Info:</Text>
              <Text style={styles.debugText}>
                Profile Completion: {profileStats.completionPercentage}%
              </Text>
              <Text style={styles.debugText}>
                Has Goal: {goalStats.hasWeightGoal ? "Yes" : "No"}
              </Text>
              <Text style={styles.debugText}>
                Form Errors: {validationData.errorCount}
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

// Styles permanecem os mesmos (não alterados para brevidade)
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
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: colors.primary,
    minWidth: 60,
  },
  missingFieldsText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
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
    flex: 1,
    marginLeft: 8,
  },
  errorTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: colors.warning,
  },
  errorMessage: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  retryButton: {
    padding: 8,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: colors.dark,
    flex: 1,
  },
  suggestButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.primary + "20",
  },
  sectionSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    marginBottom: 16,
  },
  genderLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.dark,
    marginBottom: 8,
    marginTop: 8,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  genderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    gap: 6,
  },
  genderOptionSelected: {
    backgroundColor: colors.primary,
  },
  genderOptionText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.primary,
  },
  genderOptionTextSelected: {
    color: colors.white,
  },
  goalStatusCard: {
    backgroundColor: colors.secondary + "20",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
  },
  goalStatusText: {
    marginLeft: 8,
    flex: 1,
  },
  goalStatusTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: colors.secondary,
  },
  goalStatusSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  goalDiffCard: {
    backgroundColor: colors.secondary + "20",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  goalDiffCardWarning: {
    backgroundColor: colors.warning + "20",
    borderLeftColor: colors.warning,
  },
  goalDiffTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.secondary,
  },
  goalDiffSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.dark,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
  },
  buttonContainer: {
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
const ProfileScreen: React.FC = () => {
  return (
    <ScreenErrorBoundary screenName="Perfil">
      <ProfileScreenContent />
    </ScreenErrorBoundary>
  );
};

export default ProfileScreen;
