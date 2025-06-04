import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors } from "../styles/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[]; // ✅ CORREÇÃO 1: Aceitar array de estilos
  textStyle?: TextStyle | TextStyle[]; // ✅ CORREÇÃO 2: Aceitar array de estilos
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button: React.FC<ButtonProps> = React.memo(
  ({
    title,
    onPress,
    variant = "primary",
    size = "medium",
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon,
    iconPosition = "left",
  }) => {
    // ✅ CORREÇÃO 3: Button style com flatten para garantir ViewStyle
    const buttonStyle = useMemo(() => {
      const baseStyles = [
        styles.button,
        styles[variant],
        styles[size],
        (disabled || loading) && styles.disabled,
      ];

      if (style) {
        return [...baseStyles, style] as ViewStyle[];
      }

      return baseStyles as ViewStyle[];
    }, [variant, size, disabled, loading, style]);

    // ✅ CORREÇÃO 4: Text style com flatten para garantir TextStyle
    const textStyleMemo = useMemo(() => {
      const baseStyles = [
        styles.text,
        styles[`${variant}Text` as keyof typeof styles],
        styles[`${size}Text` as keyof typeof styles],
      ];

      if (textStyle) {
        return [...baseStyles, textStyle] as TextStyle[];
      }

      return baseStyles as TextStyle[];
    }, [variant, size, textStyle]);

    // ✅ MELHORIA 3: Loading state memoizado
    const isInteractive = useMemo(
      () => !disabled && !loading,
      [disabled, loading]
    );

    // ✅ MELHORIA 4: onPress handler memoizado
    const handlePress = useCallback(() => {
      if (isInteractive) {
        onPress();
      }
    }, [onPress, isInteractive]);

    // ✅ MELHORIA 5: Loading indicator props memoizadas
    const loadingIndicatorProps = useMemo(
      () => ({
        size: (size === "small" ? 16 : size === "large" ? 24 : 20) as any,
        color: variant === "outline" ? colors.primary : colors.white,
      }),
      [size, variant]
    );

    // ✅ MELHORIA 6: Content layout memoizado
    const contentLayout = useMemo(() => {
      if (loading) {
        return (
          <>
            <ActivityIndicator {...loadingIndicatorProps} />
            {title && (
              <Text style={[textStyleMemo, { marginLeft: 8 }]}>
                Carregando...
              </Text>
            )}
          </>
        );
      }

      if (icon && iconPosition === "left") {
        return (
          <>
            {icon}
            <Text style={[textStyleMemo, { marginLeft: 8 }]}>{title}</Text>
          </>
        );
      }

      if (icon && iconPosition === "right") {
        return (
          <>
            <Text style={[textStyleMemo, { marginRight: 8 }]}>{title}</Text>
            {icon}
          </>
        );
      }

      return <Text style={textStyleMemo}>{title}</Text>;
    }, [
      loading,
      loadingIndicatorProps,
      title,
      textStyleMemo,
      icon,
      iconPosition,
    ]);

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={handlePress}
        disabled={!isInteractive}
        activeOpacity={0.8}
      >
        {contentLayout}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";

// ✅ CORREÇÃO 5: ButtonGroup com tipos corretos
export const ButtonGroup: React.FC<{
  buttons: (Omit<ButtonProps, "key"> & { key: string })[];
  spacing?: number;
  direction?: "row" | "column";
}> = React.memo(({ buttons, spacing = 12, direction = "row" }) => {
  // ✅ Container style memoizado com tipo correto
  const containerStyle = useMemo(() => {
    const baseStyle = [
      styles.buttonGroup,
      direction === "row" ? styles.buttonGroupRow : styles.buttonGroupColumn,
    ];

    // ✅ CORREÇÃO 6: Adicionar gap apenas se suportado
    if (spacing > 0) {
      return [...baseStyle, { gap: spacing }] as ViewStyle[];
    }

    return baseStyle as ViewStyle[];
  }, [direction, spacing]);

  // ✅ CORREÇÃO 7: Render button com tipos seguros
  const renderButton = useCallback(
    (
      buttonProps: Omit<ButtonProps, "key"> & { key: string },
      index: number
    ) => {
      const { key, style: buttonStyle, ...restProps } = buttonProps;

      // ✅ Item style com tipo seguro
      const itemStyle = useMemo(() => {
        const baseItemStyle =
          direction === "row"
            ? styles.buttonGroupItem
            : styles.buttonGroupItemColumn;

        // ✅ Adicionar margin se gap não suportado
        const marginStyle =
          spacing > 0 && index > 0
            ? {
                [direction === "row" ? "marginLeft" : "marginTop"]: spacing,
              }
            : {};

        if (buttonStyle) {
          return [baseItemStyle, marginStyle, buttonStyle] as ViewStyle[];
        }

        return [baseItemStyle, marginStyle] as ViewStyle[];
      }, [buttonStyle, index]);

      return <Button key={key} {...restProps} style={itemStyle} />;
    },
    [direction, spacing]
  );

  return <View style={containerStyle}>{buttons.map(renderButton)}</View>;
});

ButtonGroup.displayName = "ButtonGroup";

// ✅ MELHORIA 8: Enhanced Button com estado avançado
export const EnhancedButton: React.FC<
  ButtonProps & {
    hapticFeedback?: boolean;
    debounceMs?: number;
    confirmAction?: boolean;
    confirmMessage?: string;
    analytics?: {
      event: string;
      properties?: Record<string, any>;
    };
  }
> = React.memo(
  ({
    hapticFeedback = false,
    debounceMs = 0,
    confirmAction = false,
    confirmMessage = "Tem certeza?",
    analytics,
    onPress,
    ...buttonProps
  }) => {
    // ✅ Debounced press handler memoizado
    const debouncedPress = useMemo(() => {
      if (debounceMs <= 0) return onPress;

      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(onPress, debounceMs);
      };
    }, [onPress, debounceMs]);

    // ✅ Enhanced press handler memoizado
    const enhancedPress = useCallback(async () => {
      try {
        // Haptic feedback
        if (hapticFeedback && Haptics) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Confirm action
        if (confirmAction) {
          Alert.alert("Confirmação", confirmMessage, [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Confirmar",
              onPress: debouncedPress,
              style: "default",
            },
          ]);
          return;
        }

        // Analytics tracking
        if (analytics) {
          console.log(
            `📊 Button Analytics: ${analytics.event}`,
            analytics.properties
          );
        }

        debouncedPress();
      } catch (error) {
        console.error("Enhanced button error:", error);
        debouncedPress(); // Fallback
      }
    }, [
      hapticFeedback,
      confirmAction,
      confirmMessage,
      analytics,
      debouncedPress,
    ]);

    return <Button {...buttonProps} onPress={enhancedPress} />;
  }
);

EnhancedButton.displayName = "EnhancedButton";

// ✅ CORREÇÃO 8: LoadingButton com tipos corretos
export const LoadingButton: React.FC<
  ButtonProps & {
    loadingText?: string;
  }
> = React.memo(
  ({ loading, title, loadingText = "Carregando...", ...props }) => {
    // ✅ Loading title memoizado
    const displayTitle = useMemo(() => {
      return loading ? loadingText : title;
    }, [loading, title, loadingText]);

    return (
      <Button
        {...props}
        title={displayTitle}
        loading={loading}
        disabled={loading || props.disabled}
      />
    );
  }
);

LoadingButton.displayName = "LoadingButton";

// ✅ CORREÇÃO 9: IconButton com interface corrigida
interface IconButtonProps extends Omit<ButtonProps, "title"> {
  iconName: string;
  iconSize?: number;
  iconColor?: string;
  accessibilityLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = React.memo(
  ({
    iconName,
    iconSize = 24,
    iconColor,
    accessibilityLabel,
    size = "medium",
    variant = "primary",
    style,
    ...props
  }) => {
    // ✅ Icon color memoizado
    const finalIconColor = useMemo(() => {
      if (iconColor) return iconColor;
      return variant === "outline" ? colors.primary : colors.white;
    }, [iconColor, variant]);

    // ✅ Icon component memoizado
    const iconComponent = useMemo(() => {
      // Placeholder - substitua por seu componente de ícone
      return (
        <Text style={{ fontSize: iconSize, color: finalIconColor }}>
          {iconName}
        </Text>
      );
    }, [iconName, iconSize, finalIconColor]);

    // ✅ CORREÇÃO 10: Button style para icon button com tipo seguro
    const iconButtonStyle = useMemo(() => {
      const baseStyles = [
        styles.iconButton,
        styles[size],
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "outline" && styles.outline,
        props.disabled && styles.disabled,
      ];

      if (style) {
        return [...baseStyles, style] as ViewStyle[];
      }

      return baseStyles as ViewStyle[];
    }, [size, variant, props.disabled, style]);

    return (
      <TouchableOpacity
        {...props}
        style={iconButtonStyle}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {iconComponent}
      </TouchableOpacity>
    );
  }
);

IconButton.displayName = "IconButton";

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  text: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  // ✅ Estilos para componentes adicionais
  buttonGroup: {
    flexDirection: "row",
  },
  buttonGroupRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonGroupColumn: {
    flexDirection: "column",
  },
  buttonGroupItem: {
    flex: 1,
  },
  buttonGroupItemColumn: {
    width: "100%",
  },
  iconButton: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1, // Quadrado
  },
});
