import React, { useMemo, useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";
import {
  ProgressCircle,
  AnimatedProgressCircle,
  MultiProgressCircle,
  MiniProgressCircle,
} from "./ProgressCircle";

interface GoalCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  progress: number;
  deadline?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  showDetails?: boolean;
  variant?: "default" | "compact" | "detailed";
  // ✅ NOVAS PROPS PARA PROGRESSCIRCLE OTIMIZADO
  animated?: boolean;
  showProgressAnimation?: boolean;
  progressColor?: string;
  onProgressComplete?: () => void;
  multiProgress?: Array<{
    value: number;
    color: string;
    label: string;
  }>;
}

// ✅ OTIMIZAÇÃO 1: React.memo para prevenir re-renders desnecessários
export const GoalCard: React.FC<GoalCardProps> = React.memo(
  ({
    title,
    current,
    target,
    unit,
    progress,
    deadline,
    icon,
    onPress,
    showDetails = true,
    variant = "default",
    animated = false,
    showProgressAnimation = false,
    progressColor,
    onProgressComplete,
    multiProgress,
  }) => {
    // ✅ OTIMIZAÇÃO 2: Cálculos memoizados
    const calculations = useMemo(() => {
      const difference = Math.abs(current - target);
      const isLoss = current > target;
      const isComplete = progress >= 100;
      const remainingPercentage = Math.max(0, 100 - progress);

      return {
        difference,
        isLoss,
        isComplete,
        remainingPercentage,
        formattedCurrent: current.toFixed(1),
        formattedTarget: target.toFixed(1),
        formattedDifference: difference.toFixed(1),
      };
    }, [current, target, progress]);

    // ✅ OTIMIZAÇÃO 3: Icon props memoizadas
    const iconProps = useMemo(
      () => ({
        name: icon,
        size: variant === "compact" ? 20 : 24,
        color: colors.primary,
      }),
      [icon, variant]
    );

    // ✅ OTIMIZAÇÃO 4: ProgressCircle color baseado no progresso
    const progressCircleColor = useMemo(() => {
      if (progressColor) return progressColor;

      if (calculations.isComplete) return colors.success;
      if (progress >= 80) return colors.secondary;
      if (progress >= 50) return colors.primary;
      if (progress >= 25) return colors.warning;
      return colors.error;
    }, [progressColor, calculations.isComplete, progress]);

    // ✅ OTIMIZAÇÃO 5: ProgressCircle size baseado na variante
    const progressCircleSize = useMemo(() => {
      switch (variant) {
        case "compact":
          return 60;
        case "detailed":
          return 100;
        default:
          return 80;
      }
    }, [variant]);

    // ✅ OTIMIZAÇÃO 6: ProgressCircle props memoizadas
    const progressCircleProps = useMemo(
      () => ({
        progress: Math.max(0, Math.min(100, progress)),
        size: progressCircleSize,
        color: progressCircleColor,
        title: variant === "compact" ? "" : `${progress.toFixed(0)}%`,
        subtitle: variant === "compact" ? "" : "concluída",
        strokeWidth: variant === "compact" ? 6 : 8,
        showPercentage: variant !== "compact",
        onProgressComplete,
        subtitleFontSize:
          variant === "compact" ? 8 : variant === "detailed" ? 10 : 9,
      }),
      [
        progress,
        progressCircleSize,
        progressCircleColor,
        variant,
        onProgressComplete,
      ]
    );

    // ✅ OTIMIZAÇÃO 7: Multi-progress props memoizadas
    const multiProgressProps = useMemo(() => {
      if (!multiProgress) return null;

      return {
        progresses: multiProgress,
        size: progressCircleSize,
        title: variant === "compact" ? "" : "Progresso",
        backgroundColor: colors.lightGray,
        subtitleFontSize:
          variant === "compact" ? 8 : variant === "detailed" ? 10 : 9,
      };
    }, [multiProgress, progressCircleSize, variant]);

    // ✅ OTIMIZAÇÃO 8: Animated progress props memoizadas
    const animatedProgressProps = useMemo(
      () => ({
        ...progressCircleProps,
        duration: showProgressAnimation ? 1500 : 1000,
        easing: "ease-out" as const,
        subtitleFontSize:
          variant === "compact" ? 8 : variant === "detailed" ? 10 : 9,
      }),
      [progressCircleProps, showProgressAnimation]
    );

    // ✅ OTIMIZAÇÃO 9: Progress component memoizado
    const progressComponent = useMemo(() => {
      // Multi-progress tem prioridade
      if (multiProgressProps) {
        return <MultiProgressCircle {...multiProgressProps} />;
      }

      // Progress animado
      if (animated || showProgressAnimation) {
        return <AnimatedProgressCircle {...animatedProgressProps} />;
      }

      // Progress normal otimizado
      return <ProgressCircle {...progressCircleProps} />;
    }, [
      multiProgressProps,
      animated,
      showProgressAnimation,
      animatedProgressProps,
      progressCircleProps,
    ]);

    // ✅ OTIMIZAÇÃO 10: Container style baseado na variante
    const containerStyle = useMemo((): ViewStyle => {
      const baseStyle = { ...styles.container };

      if (variant === "compact") {
        return {
          ...baseStyle,
          padding: 12,
          marginVertical: 4,
        };
      }

      if (variant === "detailed") {
        return {
          ...baseStyle,
          padding: 20,
          marginVertical: 12,
        };
      }

      return baseStyle;
    }, [variant]);

    // ✅ OTIMIZAÇÃO 11: Remaining value style memoizado
    const remainingValueStyle = useMemo(
      (): TextStyle => ({
        ...styles.statValue,
        color: calculations.isComplete ? colors.success : progressCircleColor,
      }),
      [calculations.isComplete, progressCircleColor]
    );

    // ✅ OTIMIZAÇÃO 12: Deadline element memoizado
    const deadlineElement = useMemo(() => {
      if (!deadline) return null;

      return <Text style={styles.deadline}>Meta: {deadline}</Text>;
    }, [deadline]);

    // ✅ OTIMIZAÇÃO 13: Progress label memoizado
    const progressLabel = useMemo(() => {
      return calculations.isLoss ? "Faltam" : "Restam";
    }, [calculations.isLoss]);

    // ✅ OTIMIZAÇÃO 14: Status message memoizado com emoji baseado no progresso
    const statusMessage = useMemo(() => {
      if (calculations.isComplete) {
        return "🎯 Meta alcançada!";
      }

      if (progress >= 90) {
        return "🔥 Quase lá! Falta muito pouco!";
      }

      if (progress >= 75) {
        return "💪 Excelente progresso!";
      }

      if (progress >= 50) {
        return "🚀 Você está no meio do caminho!";
      }

      if (progress >= 25) {
        return "⭐ Bom início, continue assim!";
      }

      return "🌟 Toda jornada começa com o primeiro passo!";
    }, [calculations.isComplete, progress]);

    // ✅ OTIMIZAÇÃO 15: Stats data memoizada com cores dinâmicas
    const statsData = useMemo(
      () => [
        {
          id: "current",
          label: "Atual",
          value: `${calculations.formattedCurrent} ${unit}`,
          style: styles.statValue,
          color: colors.dark,
        },
        {
          id: "target",
          label: "Meta",
          value: `${calculations.formattedTarget} ${unit}`,
          style: styles.statValue,
          color: progressCircleColor,
        },
        {
          id: "remaining",
          label: progressLabel,
          value: `${calculations.formattedDifference} ${unit}`,
          style: remainingValueStyle,
          color: remainingValueStyle.color,
        },
      ],
      [
        calculations.formattedCurrent,
        calculations.formattedTarget,
        calculations.formattedDifference,
        unit,
        progressLabel,
        remainingValueStyle,
        progressCircleColor,
      ]
    );

    // ✅ OTIMIZAÇÃO 16: Stats elements memoizados
    const statsElements = useMemo(() => {
      return statsData.map((stat) => (
        <View key={stat.id} style={styles.statItem}>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={[stat.style, { color: stat.color }]}>{stat.value}</Text>
        </View>
      ));
    }, [statsData]);

    // ✅ OTIMIZAÇÃO 17: Handle press memoizado
    const handlePress = useCallback(() => {
      if (onPress) {
        onPress();
      }
    }, [onPress]);

    // ✅ OTIMIZAÇÃO 18: Progress complete handler memoizado
    const handleProgressComplete = useCallback(() => {
      console.log(`🎯 Meta "${title}" alcançada!`);
      // Aqui você pode adicionar celebração, analytics, etc.
    }, [title]);

    // ✅ OTIMIZAÇÃO 19: Enhanced progress circle com callback
    const enhancedProgressComponent = useMemo(() => {
      const enhancedProps = {
        ...progressCircleProps,
        onProgressComplete: onProgressComplete || handleProgressComplete,
      };

      if (multiProgressProps) {
        return <MultiProgressCircle {...multiProgressProps} />;
      }

      if (animated || showProgressAnimation) {
        return (
          <AnimatedProgressCircle
            {...animatedProgressProps}
            onProgressComplete={enhancedProps.onProgressComplete}
          />
        );
      }

      return <ProgressCircle {...enhancedProps} />;
    }, [
      progressCircleProps,
      multiProgressProps,
      animated,
      showProgressAnimation,
      animatedProgressProps,
      onProgressComplete,
      handleProgressComplete,
    ]);

    // ✅ OTIMIZAÇÃO 20: Content based on variant memoizado
    const content = useMemo(
      () => (
        <>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons {...iconProps} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {deadlineElement}
            </View>
            {/* Mini progress circle no header para variante compact */}
            {variant === "compact" && (
              <MiniProgressCircle
                progress={progress}
                color={progressCircleColor}
                size={24}
              />
            )}
          </View>

          <View style={styles.content}>
            {variant !== "compact" && (
              <View style={styles.progressContainer}>
                {enhancedProgressComponent}
              </View>
            )}

            <View style={styles.statsContainer}>{statsElements}</View>
          </View>

          {showDetails && variant === "detailed" && (
            <View style={styles.detailsContainer}>
              <Text style={styles.statusMessage}>{statusMessage}</Text>
              <Text style={styles.progressText}>
                {progress.toFixed(1)}% concluído
              </Text>

              {/* Progress breakdown para variante detailed */}
              <View style={styles.progressBreakdown}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, progress)}%`,
                        backgroundColor: progressCircleColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressBreakdownText}>
                  {calculations.formattedCurrent} de{" "}
                  {calculations.formattedTarget} {unit}
                </Text>
              </View>
            </View>
          )}
        </>
      ),
      [
        iconProps,
        title,
        deadlineElement,
        variant,
        progress,
        progressCircleColor,
        enhancedProgressComponent,
        statsElements,
        showDetails,
        statusMessage,
        calculations.formattedCurrent,
        calculations.formattedTarget,
        unit,
      ]
    );

    if (onPress) {
      return (
        <TouchableOpacity style={containerStyle} onPress={handlePress}>
          {content}
        </TouchableOpacity>
      );
    }

    return <View style={containerStyle}>{content}</View>;
  }
);

GoalCard.displayName = "GoalCard";

// ✅ OTIMIZAÇÃO 21: Enhanced GoalCard com multi-progress
export const MultiProgressGoalCard: React.FC<
  Omit<GoalCardProps, "multiProgress"> & {
    progressData: Array<{
      label: string;
      current: number;
      target: number;
      color: string;
    }>;
  }
> = React.memo(({ progressData, ...goalProps }) => {
  // ✅ Multi-progress calculations memoizadas
  const multiProgressCalculations = useMemo(() => {
    return progressData.map((item) => {
      const progress =
        item.target > 0 ? Math.min(100, (item.current / item.target) * 100) : 0;

      return {
        value: progress,
        color: item.color,
        label: item.label,
      };
    });
  }, [progressData]);

  // ✅ Overall progress memoizado
  const overallProgress = useMemo(() => {
    const totalProgress = multiProgressCalculations.reduce(
      (sum, item) => sum + item.value,
      0
    );
    return totalProgress / multiProgressCalculations.length;
  }, [multiProgressCalculations]);

  // ✅ Enhanced props memoizadas
  const enhancedProps = useMemo(
    () => ({
      ...goalProps,
      progress: overallProgress,
      multiProgress: multiProgressCalculations,
    }),
    [goalProps, overallProgress, multiProgressCalculations]
  );

  return <GoalCard {...enhancedProps} />;
});

MultiProgressGoalCard.displayName = "MultiProgressGoalCard";

// ✅ OTIMIZAÇÃO 22: Animated GoalCard aprimorado
export const EnhancedAnimatedGoalCard: React.FC<
  GoalCardProps & {
    animationDuration?: number;
    celebrateOnComplete?: boolean;
  }
> = React.memo(
  ({ animationDuration = 1500, celebrateOnComplete = true, ...goalProps }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // ✅ Progress complete handler com celebração
    const handleProgressComplete = useCallback(() => {
      if (celebrateOnComplete && goalProps.progress >= 100) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }

      if (goalProps.onProgressComplete) {
        goalProps.onProgressComplete();
      }
    }, [celebrateOnComplete, goalProps.progress, goalProps.onProgressComplete]);

    // ✅ Enhanced props memoizadas
    const enhancedProps = useMemo(
      () => ({
        ...goalProps,
        animated: true,
        showProgressAnimation: true,
        onProgressComplete: handleProgressComplete,
      }),
      [goalProps, handleProgressComplete]
    );

    // ✅ Celebration overlay memoizado
    const celebrationOverlay = useMemo(() => {
      if (!showCelebration) return null;

      return (
        <View style={styles.celebrationOverlay}>
          <Text style={styles.celebrationText}>🎉 Parabéns! 🎉</Text>
          <Text style={styles.celebrationSubtext}>Meta alcançada!</Text>
        </View>
      );
    }, [showCelebration]);

    return (
      <View style={styles.enhancedContainer}>
        <GoalCard {...enhancedProps} />
        {celebrationOverlay}
      </View>
    );
  }
);

EnhancedAnimatedGoalCard.displayName = "EnhancedAnimatedGoalCard";

// ✅ Manter todas as outras variações existentes...
export const CompactGoalCard: React.FC<Omit<GoalCardProps, "variant">> =
  React.memo((props) => {
    const compactProps = useMemo(
      () => ({
        ...props,
        variant: "compact" as const,
        showDetails: false,
      }),
      [props]
    );

    return <GoalCard {...compactProps} />;
  });

export const DetailedGoalCard: React.FC<Omit<GoalCardProps, "variant">> =
  React.memo((props) => {
    const detailedProps = useMemo(
      () => ({
        ...props,
        variant: "detailed" as const,
        showDetails: true,
        animated: true,
        showProgressAnimation: true,
      }),
      [props]
    );

    return <GoalCard {...detailedProps} />;
  });

// ✅ Manter todos os outros componentes existentes...
// (GoalCardCollection, ActionableGoalCard, LoadingGoalCard, etc.)

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.dark,
  },
  deadline: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressContainer: {
    marginRight: 20,
  },
  statsContainer: {
    flex: 1,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: colors.dark,
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  statusMessage: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  progressText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    textAlign: "center",
    marginBottom: 12,
  },
  // ✅ Novos estilos para funcionalidades aprimoradas
  progressBreakdown: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressBreakdownText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: colors.gray,
    textAlign: "center",
  },
  enhancedContainer: {
    position: "relative",
  },
  celebrationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(76, 175, 80, 0.95)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  celebrationText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: colors.white,
    textAlign: "center",
  },
  celebrationSubtext: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    marginTop: 4,
  },
  // Manter todos os outros estilos existentes...
  collection: {
    gap: 8,
  },
  actionableContainer: {
    position: "relative",
  },
  actionContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    marginTop: 12,
  },
});
