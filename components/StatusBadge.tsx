import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";

interface StatusBadgeProps {
  status: "success" | "error" | "warning" | "info" | "neutral";
  text: string;
  icon?: string;
  size?: "small" | "medium" | "large";
  variant?: "filled" | "outlined" | "soft";
  showIcon?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  animated?: boolean;
}

interface StatusConfig {
  color: string;
  backgroundColor: string;
  borderColor: string;
  defaultIcon: string;
}

interface SizeConfig {
  paddingHorizontal: number;
  paddingVertical: number;
  fontSize: number;
  iconSize: number;
  borderRadius: number;
}

interface VariantStyle {
  backgroundColor: string;
  borderWidth: number;
  borderColor?: string;
  color: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(
  ({
    status,
    text,
    icon,
    size = "medium",
    variant = "soft",
    showIcon = true,
    style,
    onPress,
    disabled = false,
    animated = false,
  }) => {
    // ✅ MELHORIA 1: Status config memoizado
    const statusConfig = useMemo((): StatusConfig => {
      switch (status) {
        case "success":
          return {
            color: colors.secondary,
            backgroundColor: colors.secondary + "20",
            borderColor: colors.secondary,
            defaultIcon: "checkmark-circle",
          };
        case "error":
          return {
            color: colors.error,
            backgroundColor: colors.error + "20",
            borderColor: colors.error,
            defaultIcon: "close-circle",
          };
        case "warning":
          return {
            color: colors.warning,
            backgroundColor: colors.warning + "20",
            borderColor: colors.warning,
            defaultIcon: "warning",
          };
        case "info":
          return {
            color: colors.primary,
            backgroundColor: colors.primary + "20",
            borderColor: colors.primary,
            defaultIcon: "information-circle",
          };
        case "neutral":
        default:
          return {
            color: colors.gray,
            backgroundColor: colors.gray + "20",
            borderColor: colors.gray,
            defaultIcon: "ellipse",
          };
      }
    }, [status]);

    // ✅ MELHORIA 2: Size config memoizado
    const sizeConfig = useMemo((): SizeConfig => {
      switch (size) {
        case "small":
          return {
            paddingHorizontal: 8,
            paddingVertical: 4,
            fontSize: 10,
            iconSize: 12,
            borderRadius: 8,
          };
        case "large":
          return {
            paddingHorizontal: 16,
            paddingVertical: 8,
            fontSize: 16,
            iconSize: 18,
            borderRadius: 16,
          };
        case "medium":
        default:
          return {
            paddingHorizontal: 12,
            paddingVertical: 6,
            fontSize: 12,
            iconSize: 14,
            borderRadius: 12,
          };
      }
    }, [size]);

    // ✅ MELHORIA 3: Variant style memoizado
    const variantStyle = useMemo((): VariantStyle => {
      switch (variant) {
        case "filled":
          return {
            backgroundColor: statusConfig.color,
            borderWidth: 0,
            color: colors.white,
          };
        case "outlined":
          return {
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: statusConfig.borderColor,
            color: statusConfig.color,
          };
        case "soft":
        default:
          return {
            backgroundColor: statusConfig.backgroundColor,
            borderWidth: 0,
            color: statusConfig.color,
          };
      }
    }, [variant, statusConfig]);

    // ✅ MELHORIA 4: Icon name memoizado
    const iconName = useMemo(
      () => icon || statusConfig.defaultIcon,
      [icon, statusConfig.defaultIcon]
    );

    // ✅ MELHORIA 5: Container style memoizado
    const containerStyle = useMemo(
      (): ViewStyle => ({
        ...styles.container,
        paddingHorizontal: sizeConfig.paddingHorizontal,
        paddingVertical: sizeConfig.paddingVertical,
        borderRadius: sizeConfig.borderRadius,
        backgroundColor: variantStyle.backgroundColor,
        borderWidth: variantStyle.borderWidth,
        borderColor: variantStyle.borderColor,
        opacity: disabled ? 0.6 : 1,
      }),
      [sizeConfig, variantStyle, disabled]
    );

    // ✅ MELHORIA 6: Icon props memoizadas
    const iconProps = useMemo(
      () => ({
        name: iconName as any,
        size: sizeConfig.iconSize,
        color: variant === "filled" ? colors.white : statusConfig.color,
        style: styles.icon,
      }),
      [iconName, sizeConfig.iconSize, variant, statusConfig.color]
    );

    // ✅ MELHORIA 7: Text style memoizado
    const textStyle = useMemo(
      (): TextStyle => ({
        ...styles.text,
        fontSize: sizeConfig.fontSize,
        color: variant === "filled" ? colors.white : statusConfig.color,
      }),
      [sizeConfig.fontSize, variant, statusConfig.color]
    );

    // ✅ MELHORIA 8: Press handler memoizado
    const handlePress = useCallback(() => {
      if (onPress && !disabled) {
        onPress();
      }
    }, [onPress, disabled]);

    // ✅ MELHORIA 9: Combined style memoizado
    const combinedContainerStyle = useMemo(
      () => [containerStyle, style],
      [containerStyle, style]
    );

    return (
      <View style={combinedContainerStyle}>
        {showIcon && iconName && <Ionicons {...iconProps} />}
        <Text style={textStyle}>{text}</Text>
      </View>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

// ✅ MELHORIA 10: Pressable StatusBadge para interações
export const PressableStatusBadge: React.FC<StatusBadgeProps> = React.memo(
  (props) => {
    const { onPress, disabled = false, ...badgeProps } = props;

    // ✅ Press handler memoizado
    const handlePress = useCallback(() => {
      if (onPress && !disabled) {
        onPress();
      }
    }, [onPress, disabled]);

    // ✅ Container props memoizadas
    const touchableProps = useMemo(
      () => ({
        onPress: handlePress,
        disabled: disabled || !onPress,
        style: { alignSelf: "flex-start" as const },
        accessibilityRole: "button" as const,
        accessibilityLabel: `Status: ${badgeProps.text}`,
      }),
      [handlePress, disabled, onPress, badgeProps.text]
    );

    if (!onPress) {
      return <StatusBadge {...badgeProps} disabled={disabled} />;
    }

    return (
      <TouchableOpacity {...touchableProps}>
        <StatusBadge {...badgeProps} disabled={disabled} />
      </TouchableOpacity>
    );
  }
);

PressableStatusBadge.displayName = "PressableStatusBadge";

// ✅ MELHORIA 11: Animated StatusBadge com transições
export const AnimatedStatusBadge: React.FC<
  StatusBadgeProps & {
    duration?: number;
    scale?: boolean;
    fade?: boolean;
  }
> = React.memo(({ duration = 300, scale = true, fade = true, ...props }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  // ✅ Animation values memoizadas
  const animationValues = useMemo(
    () => ({
      scaleValue: React.useRef(new Animated.Value(0)).current,
      fadeValue: React.useRef(new Animated.Value(0)).current,
    }),
    []
  );

  // ✅ Animation config memoizada
  const animationConfig = useMemo(
    () => ({
      duration,
      useNativeDriver: true,
    }),
    [duration]
  );

  // ✅ Start animation memoizado
  const startAnimation = useCallback(() => {
    const animations = [];

    if (scale) {
      animations.push(
        Animated.timing(animationValues.scaleValue, {
          toValue: 1,
          ...animationConfig,
        })
      );
    }

    if (fade) {
      animations.push(
        Animated.timing(animationValues.fadeValue, {
          toValue: 1,
          ...animationConfig,
        })
      );
    }

    Animated.parallel(animations).start();
  }, [scale, fade, animationValues, animationConfig]);

  // ✅ Animated style memoizado
  const animatedStyle = useMemo(
    () => ({
      transform: scale ? [{ scale: animationValues.scaleValue }] : [],
      opacity: fade ? animationValues.fadeValue : 1,
    }),
    [scale, fade, animationValues]
  );

  React.useEffect(() => {
    setIsVisible(true);
    startAnimation();
  }, [startAnimation]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={animatedStyle}>
      <StatusBadge {...props} />
    </Animated.View>
  );
});

AnimatedStatusBadge.displayName = "AnimatedStatusBadge";

// ✅ MELHORIA 12: StatusBadge com contador
export const CounterStatusBadge: React.FC<
  StatusBadgeProps & {
    count?: number;
    maxCount?: number;
    showCount?: boolean;
  }
> = React.memo(
  ({
    count = 0,
    maxCount = 99,
    showCount = true,
    text: originalText,
    ...props
  }) => {
    // ✅ Display text memoizado
    const displayText = useMemo(() => {
      if (!showCount || count <= 0) {
        return originalText;
      }

      const countText = count > maxCount ? `${maxCount}+` : count.toString();
      return `${originalText} (${countText})`;
    }, [originalText, showCount, count, maxCount]);

    // ✅ Enhanced props memoizadas
    const enhancedProps = useMemo(
      () => ({
        ...props,
        text: displayText,
      }),
      [props, displayText]
    );

    return <StatusBadge {...enhancedProps} />;
  }
);

CounterStatusBadge.displayName = "CounterStatusBadge";

// ✅ MELHORIA 13: Multi StatusBadge para múltiplos status
export const MultiStatusBadge: React.FC<{
  statuses: Array<{
    status: StatusBadgeProps["status"];
    text: string;
    icon?: string;
  }>;
  size?: StatusBadgeProps["size"];
  variant?: StatusBadgeProps["variant"];
  spacing?: number;
  direction?: "row" | "column";
  style?: ViewStyle;
}> = React.memo(
  ({
    statuses,
    size = "medium",
    variant = "soft",
    spacing = 8,
    direction = "row",
    style,
  }) => {
    // ✅ Container style memoizado
    const containerStyle = useMemo(
      (): ViewStyle => ({
        flexDirection: direction,
        alignItems: "center",
        gap: spacing,
      }),
      [direction, spacing]
    );

    // ✅ Badge props memoizadas
    const badgePropsArray = useMemo(
      () =>
        statuses.map((statusItem, index) => ({
          key: index,
          status: statusItem.status,
          text: statusItem.text,
          icon: statusItem.icon,
          size,
          variant,
        })),
      [statuses, size, variant]
    );

    // ✅ Combined style memoizado
    const combinedStyle = useMemo(
      () => [containerStyle, style],
      [containerStyle, style]
    );

    return (
      <View style={combinedStyle}>
        {badgePropsArray.map((badgeProps) => (
          <StatusBadge {...badgeProps} />
        ))}
      </View>
    );
  }
);

MultiStatusBadge.displayName = "MultiStatusBadge";

// ✅ MELHORIA 14: withStatusBadge HOC
export function withStatusBadge<P extends object>(
  Component: React.ComponentType<P>,
  statusExtractor: (props: P) => {
    status: StatusBadgeProps["status"];
    text: string;
  }
) {
  const WrappedComponent = React.memo(
    (
      props: P & {
        showStatusBadge?: boolean;
        statusBadgeProps?: Partial<StatusBadgeProps>;
      }
    ) => {
      const {
        showStatusBadge = true,
        statusBadgeProps,
        ...componentProps
      } = props;

      // ✅ Status data memoizado
      const statusData = useMemo(
        () => statusExtractor(componentProps as P),
        [componentProps]
      );

      // ✅ Badge props memoizadas
      const badgeProps = useMemo(
        () => ({
          status: statusData.status,
          text: statusData.text,
          size: "small" as const,
          ...statusBadgeProps,
        }),
        [statusData, statusBadgeProps]
      );

      if (!showStatusBadge) {
        return <Component {...(componentProps as P)} />;
      }

      return (
        <View style={styles.withStatusContainer}>
          <Component {...(componentProps as P)} />
          <StatusBadge {...badgeProps} />
        </View>
      );
    }
  );

  WrappedComponent.displayName = `withStatusBadge(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// ✅ MELHORIA 15: StatusBadge configurations pré-definidas
export const StatusBadgePresets = {
  // ✅ Health status badges
  BMI_NORMAL: {
    status: "success" as const,
    text: "IMC Normal",
    icon: "fitness-outline",
  },
  BMI_OVERWEIGHT: {
    status: "warning" as const,
    text: "Sobrepeso",
    icon: "warning-outline",
  },
  BMI_OBESE: {
    status: "error" as const,
    text: "Obesidade",
    icon: "alert-circle-outline",
  },

  // ✅ Goal status badges
  GOAL_REACHED: {
    status: "success" as const,
    text: "Meta Atingida",
    icon: "trophy-outline",
  },
  GOAL_APPROACHING: {
    status: "info" as const,
    text: "Quase Lá",
    icon: "flag-outline",
  },
  GOAL_OFF_TRACK: {
    status: "warning" as const,
    text: "Fora da Meta",
    icon: "trending-down-outline",
  },

  // ✅ Data status badges
  DATA_SYNCED: {
    status: "success" as const,
    text: "Sincronizado",
    icon: "cloud-done-outline",
  },
  DATA_SYNCING: {
    status: "info" as const,
    text: "Sincronizando",
    icon: "cloud-upload-outline",
  },
  DATA_ERROR: {
    status: "error" as const,
    text: "Erro",
    icon: "cloud-offline-outline",
  },
} as const;

// ✅ MELHORIA 16: QuickStatusBadge para casos comuns
export const QuickStatusBadge: React.FC<{
  preset: keyof typeof StatusBadgePresets;
  size?: StatusBadgeProps["size"];
  variant?: StatusBadgeProps["variant"];
  style?: ViewStyle;
}> = React.memo(({ preset, size, variant, style }) => {
  // ✅ Preset config memoizada
  const presetConfig = useMemo(() => StatusBadgePresets[preset], [preset]);

  // ✅ Badge props memoizadas
  const badgeProps = useMemo(
    () => ({
      ...presetConfig,
      size,
      variant,
      style,
    }),
    [presetConfig, size, variant, style]
  );

  return <StatusBadge {...badgeProps} />;
});

QuickStatusBadge.displayName = "QuickStatusBadge";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // ✅ Novos estilos para HOC
  withStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
