import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";

// ✅ Interface otimizada
interface MotivationalCardProps {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  variant?: "default" | "success" | "warning" | "info";
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  disabled?: boolean;
}

// ✅ OTIMIZAÇÃO 1: React.memo para prevenir re-renders desnecessários
export const MotivationalCard: React.FC<MotivationalCardProps> = React.memo(
  ({
    message,
    icon = "star",
    onPress,
    variant = "default",
    size = "medium",
    style,
    disabled = false,
  }) => {
    // ✅ OTIMIZAÇÃO 2: Variant colors memoizadas
    const variantColors = useMemo(() => {
      switch (variant) {
        case "success":
          return {
            background: colors.secondary + "15",
            border: colors.secondary + "30",
            icon: colors.secondary,
            text: colors.dark,
          };
        case "warning":
          return {
            background: colors.warning + "15",
            border: colors.warning + "30",
            icon: colors.warning,
            text: colors.dark,
          };
        case "info":
          return {
            background: colors.primary + "15",
            border: colors.primary + "30",
            icon: colors.primary,
            text: colors.dark,
          };
        case "default":
        default:
          return {
            background: colors.white,
            border: "transparent",
            icon: colors.accent,
            text: colors.dark,
          };
      }
    }, [variant]);

    // ✅ OTIMIZAÇÃO 3: Size config memoizada
    const sizeConfig = useMemo(() => {
      switch (size) {
        case "small":
          return {
            padding: 12,
            borderRadius: 8,
            iconSize: 20,
            fontSize: 14,
            marginVertical: 4,
          };
        case "large":
          return {
            padding: 20,
            borderRadius: 16,
            iconSize: 28,
            fontSize: 18,
            marginVertical: 12,
          };
        case "medium":
        default:
          return {
            padding: 16,
            borderRadius: 12,
            iconSize: 24,
            fontSize: 16,
            marginVertical: 8,
          };
      }
    }, [size]);

    // ✅ OTIMIZAÇÃO 4: Container style memoizado
    const containerStyle = useMemo(
      (): ViewStyle => ({
        ...styles.container,
        backgroundColor: variantColors.background,
        borderColor: variantColors.border,
        borderWidth: variantColors.border !== "transparent" ? 1 : 0,
        padding: sizeConfig.padding,
        borderRadius: sizeConfig.borderRadius,
        marginVertical: sizeConfig.marginVertical,
        opacity: disabled ? 0.6 : 1,
      }),
      [variantColors, sizeConfig, disabled]
    );

    // ✅ OTIMIZAÇÃO 5: Icon props memoizadas
    const iconProps = useMemo(
      () => ({
        name: icon,
        size: sizeConfig.iconSize,
        color: variantColors.icon,
        style: styles.icon,
      }),
      [icon, sizeConfig.iconSize, variantColors.icon]
    );

    // ✅ OTIMIZAÇÃO 6: Text style memoizado
    const textStyle = useMemo(
      (): TextStyle => ({
        ...styles.message,
        fontSize: sizeConfig.fontSize,
        color: variantColors.text,
      }),
      [sizeConfig.fontSize, variantColors.text]
    );

    // ✅ OTIMIZAÇÃO 7: Combined style memoizado
    const combinedContainerStyle = useMemo(
      () => [containerStyle, style],
      [containerStyle, style]
    );

    // ✅ OTIMIZAÇÃO 8: Press handler memoizado
    const handlePress = useCallback(() => {
      if (onPress && !disabled) {
        onPress();
      }
    }, [onPress, disabled]);

    // ✅ OTIMIZAÇÃO 9: Content memoizado
    const content = useMemo(
      () => (
        <>
          <Ionicons {...iconProps} />
          <Text style={textStyle}>{message}</Text>
        </>
      ),
      [iconProps, textStyle, message]
    );

    // ✅ OTIMIZAÇÃO 10: Touchable props memoizadas
    const touchableProps = useMemo(() => {
      if (!onPress) return null;

      return {
        onPress: handlePress,
        disabled,
        style: combinedContainerStyle,
        accessibilityRole: "button" as const,
        accessibilityLabel: `Cartão motivacional: ${message}`,
        accessibilityState: { disabled },
      };
    }, [onPress, handlePress, disabled, combinedContainerStyle, message]);

    // ✅ Renderização condicional otimizada
    if (onPress) {
      return (
        <TouchableOpacity {...touchableProps!}>{content}</TouchableOpacity>
      );
    }

    return <View style={combinedContainerStyle}>{content}</View>;
  }
);

MotivationalCard.displayName = "MotivationalCard";

// ✅ OTIMIZAÇÃO 11: Presets memoizados
export const MotivationalCardPresets = {
  WEIGHT_SUCCESS: {
    message: "Parabéns! Você está no caminho certo! 🎉",
    icon: "trophy-outline" as keyof typeof Ionicons.glyphMap,
    variant: "success" as const,
  },
  WEIGHT_MOTIVATION: {
    message: "Cada passo conta na sua jornada! 👣",
    icon: "footsteps-outline" as keyof typeof Ionicons.glyphMap,
    variant: "default" as const,
  },
  GOAL_REACHED: {
    message: "Meta alcançada! Você é incrível! 🌟",
    icon: "star-outline" as keyof typeof Ionicons.glyphMap,
    variant: "success" as const,
  },
} as const;

// ✅ OTIMIZAÇÃO 12: QuickMotivationalCard otimizado
export const QuickMotivationalCard: React.FC<{
  preset: keyof typeof MotivationalCardPresets;
  size?: MotivationalCardProps["size"];
  onPress?: MotivationalCardProps["onPress"];
  style?: MotivationalCardProps["style"];
}> = React.memo(({ preset, size, onPress, style }) => {
  // ✅ Preset config memoizada
  const presetConfig = useMemo(() => MotivationalCardPresets[preset], [preset]);

  // ✅ Card props memoizadas
  const cardProps = useMemo(
    () => ({
      ...presetConfig,
      size,
      onPress,
      style,
    }),
    [presetConfig, size, onPress, style]
  );

  return <MotivationalCard {...cardProps} />;
});

QuickMotivationalCard.displayName = "QuickMotivationalCard";

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
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
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.dark,
  },
});
