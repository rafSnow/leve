import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  suffix?: string;
  onIconPress?: () => void;
  variant?: "default" | "outline" | "filled";
  size?: "small" | "medium" | "large";
}

// ✅ OTIMIZAÇÃO 1: React.memo para prevenir re-renders desnecessários
export const Input: React.FC<InputProps> = React.memo(
  ({
    label,
    error,
    icon,
    suffix,
    onIconPress,
    style,
    variant = "default",
    size = "medium",
    ...props
  }) => {
    const [isFocused, setIsFocused] = useState(false);

    // ✅ OTIMIZAÇÃO 2: Size configuration memoizada
    const sizeConfig = useMemo(() => {
      switch (size) {
        case "small":
          return {
            minHeight: 44,
            fontSize: 14,
            iconSize: 18,
            paddingHorizontal: 12,
            paddingVertical: 12,
          };
        case "large":
          return {
            minHeight: 64,
            fontSize: 18,
            iconSize: 24,
            paddingHorizontal: 20,
            paddingVertical: 20,
          };
        case "medium":
        default:
          return {
            minHeight: 56,
            fontSize: 16,
            iconSize: 20,
            paddingHorizontal: 16,
            paddingVertical: 16,
          };
      }
    }, [size]);

    // ✅ OTIMIZAÇÃO 3: Variant colors memoizadas
    const variantColors = useMemo(() => {
      switch (variant) {
        case "outline":
          return {
            background: "transparent",
            border: colors.primary,
            focusedBorder: colors.primary,
            errorBorder: colors.error,
          };
        case "filled":
          return {
            background: colors.lightGray + "50",
            border: "transparent",
            focusedBorder: colors.primary,
            errorBorder: colors.error,
          };
        case "default":
        default:
          return {
            background: colors.white,
            border: colors.lightGray,
            focusedBorder: colors.primary,
            errorBorder: colors.error,
          };
      }
    }, [variant]);

    // ✅ OTIMIZAÇÃO 4: Icon color memoizada
    const iconColor = useMemo(() => {
      if (error) return colors.error;
      if (isFocused) return colors.primary;
      return colors.gray;
    }, [error, isFocused]);

    // ✅ OTIMIZAÇÃO 5: Container style memoizado
    const containerStyle = useMemo(
      (): ViewStyle => ({
        ...styles.inputContainer,
        backgroundColor: variantColors.background,
        borderColor: error
          ? variantColors.errorBorder
          : isFocused
          ? variantColors.focusedBorder
          : variantColors.border,
        minHeight: sizeConfig.minHeight,
        paddingHorizontal: sizeConfig.paddingHorizontal,
      }),
      [
        variantColors.background,
        variantColors.border,
        variantColors.focusedBorder,
        variantColors.errorBorder,
        error,
        isFocused,
        sizeConfig.minHeight,
        sizeConfig.paddingHorizontal,
      ]
    );

    // ✅ OTIMIZAÇÃO 6: Input style memoizado
    const inputStyle = useMemo(
      (): TextStyle => ({
        ...styles.input,
        fontSize: sizeConfig.fontSize,
        paddingVertical: sizeConfig.paddingVertical,
      }),
      [sizeConfig.fontSize, sizeConfig.paddingVertical]
    );

    // ✅ OTIMIZAÇÃO 7: Combined input style memoizado
    const combinedInputStyle = useMemo(
      () => [inputStyle, style],
      [inputStyle, style]
    );

    // ✅ OTIMIZAÇÃO 8: Icon props memoizadas
    const iconProps = useMemo(() => {
      if (!icon) return null;

      return {
        name: icon,
        size: sizeConfig.iconSize,
        color: iconColor,
        style: styles.icon,
      };
    }, [icon, sizeConfig.iconSize, iconColor]);

    // ✅ OTIMIZAÇÃO 9: Focus handlers memoizados
    const handleFocus = useCallback(
      (e: any) => {
        setIsFocused(true);
        props.onFocus?.(e);
      },
      [props.onFocus]
    );

    const handleBlur = useCallback(
      (e: any) => {
        setIsFocused(false);
        props.onBlur?.(e);
      },
      [props.onBlur]
    );

    // ✅ OTIMIZAÇÃO 10: Icon press handler memoizado
    const handleIconPress = useCallback(() => {
      if (onIconPress) {
        onIconPress();
      }
    }, [onIconPress]);

    // ✅ OTIMIZAÇÃO 11: TouchableOpacity props memoizadas
    const touchableProps = useMemo(() => {
      if (!icon || !onIconPress) return null;

      return {
        onPress: handleIconPress,
        disabled: !onIconPress,
        accessibilityRole: "button" as const,
        accessibilityLabel: `Ícone do campo ${label || "input"}`,
      };
    }, [icon, onIconPress, handleIconPress, label]);

    // ✅ OTIMIZAÇÃO 12: TextInput props memoizadas
    const textInputProps = useMemo(
      () => ({
        ...props,
        style: combinedInputStyle,
        onFocus: handleFocus,
        onBlur: handleBlur,
        placeholderTextColor: colors.gray,
      }),
      [props, combinedInputStyle, handleFocus, handleBlur]
    );

    // ✅ OTIMIZAÇÃO 13: Label element memoizado
    const labelElement = useMemo(() => {
      if (!label) return null;

      return (
        <Text style={[styles.label, { fontSize: sizeConfig.fontSize }]}>
          {label}
        </Text>
      );
    }, [label, sizeConfig.fontSize]);

    // ✅ OTIMIZAÇÃO 14: Icon element memoizado
    const iconElement = useMemo(() => {
      if (!iconProps) return null;

      if (touchableProps) {
        return (
          <TouchableOpacity {...touchableProps}>
            <Ionicons {...iconProps} />
          </TouchableOpacity>
        );
      }

      return <Ionicons {...iconProps} />;
    }, [iconProps, touchableProps]);

    // ✅ OTIMIZAÇÃO 15: Suffix element memoizado
    const suffixElement = useMemo(() => {
      if (!suffix) return null;

      return (
        <Text style={[styles.suffix, { fontSize: sizeConfig.fontSize }]}>
          {suffix}
        </Text>
      );
    }, [suffix, sizeConfig.fontSize]);

    // ✅ OTIMIZAÇÃO 16: Error element memoizado
    const errorElement = useMemo(() => {
      if (!error) return null;

      return <Text style={styles.errorText}>{error}</Text>;
    }, [error]);

    return (
      <View style={styles.container}>
        {labelElement}

        <View style={containerStyle}>
          {iconElement}
          <TextInput {...textInputProps} />
          {suffixElement}
        </View>

        {errorElement}
      </View>
    );
  }
);

Input.displayName = "Input";

// ✅ OTIMIZAÇÃO 17: Variações especializadas para casos comuns
export const NumericInput: React.FC<InputProps> = React.memo((props) => {
  // ✅ Props pré-otimizadas para números
  const numericProps = useMemo(
    () => ({
      keyboardType: "numeric" as const,
      ...props,
    }),
    [props]
  );

  return <Input {...numericProps} />;
});

NumericInput.displayName = "NumericInput";

// ✅ OTIMIZAÇÃO 18: Input para peso (muito usado)
export const WeightInput: React.FC<
  Omit<InputProps, "suffix" | "icon" | "keyboardType">
> = React.memo((props) => {
  // ✅ Props pré-otimizadas para peso
  const weightProps = useMemo(
    () => ({
      icon: "scale-outline" as keyof typeof Ionicons.glyphMap,
      suffix: "kg",
      keyboardType: "numeric" as const,
      placeholder: "Ex: 75.5",
      ...props,
    }),
    [props]
  );

  return <Input {...weightProps} />;
});

WeightInput.displayName = "WeightInput";

// ✅ OTIMIZAÇÃO 19: Input para medidas (muito usado no MeasurementsScreen)
export const MeasurementInput: React.FC<
  Omit<InputProps, "suffix" | "icon" | "keyboardType">
> = React.memo((props) => {
  // ✅ Props pré-otimizadas para medidas
  const measurementProps = useMemo(
    () => ({
      icon: "body-outline" as keyof typeof Ionicons.glyphMap,
      suffix: "cm",
      keyboardType: "numeric" as const,
      ...props,
    }),
    [props]
  );

  return <Input {...measurementProps} />;
});

MeasurementInput.displayName = "MeasurementInput";

// ✅ OTIMIZAÇÃO 20: Input para datas (usado em todos os screens)
export const DateInput: React.FC<Omit<InputProps, "icon" | "editable">> =
  React.memo((props) => {
    // ✅ Props pré-otimizadas para datas
    const dateProps = useMemo(
      () => ({
        icon: "calendar-outline" as keyof typeof Ionicons.glyphMap,
        editable: false,
        placeholder: "DD/MM/AAAA",
        ...props,
      }),
      [props]
    );

    return <Input {...dateProps} />;
  });

DateInput.displayName = "DateInput";

// ✅ OTIMIZAÇÃO 21: Input para observações (multiline)
export const NotesInput: React.FC<
  Omit<InputProps, "icon" | "multiline" | "numberOfLines">
> = React.memo((props) => {
  // ✅ Props pré-otimizadas para observações
  const notesProps = useMemo(
    () => ({
      icon: "chatbubble-outline" as keyof typeof Ionicons.glyphMap,
      multiline: true,
      numberOfLines: 3,
      placeholder: "Observações opcionais...",
      ...props,
    }),
    [props]
  );

  return <Input {...notesProps} />;
});

NotesInput.displayName = "NotesInput";

// ✅ OTIMIZAÇÃO 22: Input para busca (usado no HistoryScreen)
export const SearchInput: React.FC<Omit<InputProps, "icon">> = React.memo(
  (props) => {
    // ✅ Props pré-otimizadas para busca
    const searchProps = useMemo(
      () => ({
        icon: "search-outline" as keyof typeof Ionicons.glyphMap,
        placeholder: "Buscar...",
        ...props,
      }),
      [props]
    );

    return <Input {...searchProps} />;
  }
);

SearchInput.displayName = "SearchInput";

// ✅ OTIMIZAÇÃO 23: Input para senha
export const PasswordInput: React.FC<
  Omit<InputProps, "icon" | "secureTextEntry">
> = React.memo((props) => {
  const [isSecure, setIsSecure] = useState(true);

  // ✅ Toggle handler memoizado
  const toggleSecure = useCallback(() => {
    setIsSecure((prev) => !prev);
  }, []);

  // ✅ Password props memoizadas
  const passwordProps = useMemo(
    () => ({
      icon: isSecure
        ? "eye-outline"
        : ("eye-off-outline" as keyof typeof Ionicons.glyphMap),
      secureTextEntry: isSecure,
      onIconPress: toggleSecure,
      placeholder: "Digite sua senha",
      ...props,
    }),
    [isSecure, toggleSecure, props]
  );

  return <Input {...passwordProps} />;
});

PasswordInput.displayName = "PasswordInput";

// ✅ OTIMIZAÇÃO 24: Input controlado otimizado
export const ControlledInput: React.FC<
  InputProps & {
    value: string;
    onChangeText: (text: string) => void;
    debounceMs?: number;
  }
> = React.memo(({ value, onChangeText, debounceMs = 0, ...props }) => {
  const [localValue, setLocalValue] = useState(value);

  // ✅ Debounced change handler memoizado
  const debouncedOnChange = useMemo(() => {
    if (debounceMs === 0) return onChangeText;

    let timeout: NodeJS.Timeout;
    return (text: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => onChangeText(text), debounceMs);
    };
  }, [onChangeText, debounceMs]);

  // ✅ Handle change memoizado
  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text);
      debouncedOnChange(text);
    },
    [debouncedOnChange]
  );

  // ✅ Sync with external value
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // ✅ Controlled props memoizadas
  const controlledProps = useMemo(
    () => ({
      value: localValue,
      onChangeText: handleChange,
      ...props,
    }),
    [localValue, handleChange, props]
  );

  return <Input {...controlledProps} />;
});

ControlledInput.displayName = "ControlledInput";

// ✅ OTIMIZAÇÃO 25: Input factory para casos específicos
export const createSpecializedInput = <T extends Partial<InputProps>>(
  defaultProps: T
) => {
  const SpecializedInput = React.memo<Omit<InputProps, keyof T> & Partial<T>>(
    (props) => {
      // ✅ Merged props memoizadas
      const mergedProps = useMemo(
        () => ({
          ...defaultProps,
          ...props,
        }),
        [props]
      );

      return <Input {...mergedProps} />;
    }
  );

  return SpecializedInput;
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.dark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.dark,
    paddingVertical: 16,
  },
  suffix: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.gray,
    marginLeft: 8,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});
