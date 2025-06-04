import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../styles/colors";

interface ProgressCircleProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  title?: string;
  subtitle?: string;
  animated?: boolean;
  showPercentage?: boolean;
  onProgressComplete?: () => void;
}

interface CircleCalculations {
  radius: number;
  circumference: number;
  strokeDasharray: string;
  strokeDashoffset: number;
  center: number;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = React.memo(
  ({
    progress,
    size = 120,
    strokeWidth = 8,
    color = colors.primary,
    backgroundColor = colors.lightGray,
    title,
    subtitle,
    animated = false,
    showPercentage = true,
    onProgressComplete,
  }) => {
    // ✅ MELHORIA 1: Cálculos matemáticos memoizados
    const circleCalculations = useMemo((): CircleCalculations => {
      const radius = (size - strokeWidth) / 2;
      const circumference = radius * 2 * Math.PI;
      const strokeDasharray = `${circumference} ${circumference}`;
      const strokeDashoffset = circumference - (progress / 100) * circumference;
      const center = size / 2;

      return {
        radius,
        circumference,
        strokeDasharray,
        strokeDashoffset,
        center,
      };
    }, [size, strokeWidth, progress]);

    // ✅ MELHORIA 2: Container style memoizado
    const containerStyle = useMemo(
      (): ViewStyle => ({
        ...styles.container,
        width: size,
        height: size,
      }),
      [size]
    );

    // ✅ MELHORIA 3: Background circle props memoizadas
    const backgroundCircleProps = useMemo(
      () => ({
        cx: circleCalculations.center,
        cy: circleCalculations.center,
        r: circleCalculations.radius,
        stroke: backgroundColor,
        strokeWidth,
        fill: "transparent" as const,
      }),
      [
        circleCalculations.center,
        circleCalculations.radius,
        backgroundColor,
        strokeWidth,
      ]
    );

    // ✅ MELHORIA 4: Progress circle props memoizadas
    const progressCircleProps = useMemo(
      () => ({
        cx: circleCalculations.center,
        cy: circleCalculations.center,
        r: circleCalculations.radius,
        stroke: color,
        strokeWidth,
        fill: "transparent" as const,
        strokeDasharray: circleCalculations.strokeDasharray,
        strokeDashoffset: circleCalculations.strokeDashoffset,
        strokeLinecap: "round" as const,
      }),
      [
        circleCalculations.center,
        circleCalculations.radius,
        circleCalculations.strokeDasharray,
        circleCalculations.strokeDashoffset,
        color,
        strokeWidth,
      ]
    );

    // ✅ MELHORIA 5: Transform string memoizado
    const transformString = useMemo(
      () =>
        `rotate(-90 ${circleCalculations.center} ${circleCalculations.center})`,
      [circleCalculations.center]
    );

    // ✅ MELHORIA 6: SVG props memoizadas
    const svgProps = useMemo(
      () => ({
        width: size,
        height: size,
        style: styles.svg,
      }),
      [size]
    );

    // ✅ MELHORIA 7: Percentage text memoizado
    const percentageText = useMemo(
      () => Math.round(Math.max(0, Math.min(100, progress))),
      [progress]
    );

    // ✅ MELHORIA 8: Progress complete callback
    const handleProgressComplete = useCallback(() => {
      if (onProgressComplete && progress >= 100) {
        onProgressComplete();
      }
    }, [onProgressComplete, progress]);

    // ✅ MELHORIA 9: Effect para detectar progresso completo
    React.useEffect(() => {
      if (progress >= 100) {
        handleProgressComplete();
      }
    }, [progress, handleProgressComplete]);

    // ✅ MELHORIA 10: Percentage style memoizado baseado no progresso
    const percentageStyle = useMemo(
      () => [
        styles.percentage,
        progress >= 100 && styles.percentageComplete,
        progress < 25 && styles.percentageLow,
      ],
      [progress]
    );

    // ✅ MELHORIA 11: Title style memoizado
    const titleStyle = useMemo(
      () => [styles.title, !subtitle && styles.titleNoSubtitle],
      [subtitle]
    );

    return (
      <View style={containerStyle}>
        <Svg {...svgProps}>
          {/* Background circle */}
          <Circle {...backgroundCircleProps} />

          {/* Progress circle */}
          <Circle {...progressCircleProps} transform={transformString} />
        </Svg>

        <View style={styles.content}>
          {showPercentage && (
            <Text style={percentageStyle}>{percentageText}%</Text>
          )}
          {title && <Text style={titleStyle}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    );
  }
);

ProgressCircle.displayName = "ProgressCircle";

// ✅ MELHORIA 12: Animated ProgressCircle com interpolação
export const AnimatedProgressCircle: React.FC<
  ProgressCircleProps & {
    duration?: number;
    easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  }
> = React.memo(
  ({ progress, duration = 1000, easing = "ease-out", ...props }) => {
    const [animatedProgress, setAnimatedProgress] = React.useState(0);

    // ✅ Animation effect memoizado
    React.useEffect(() => {
      const startTime = Date.now();
      const startProgress = animatedProgress;
      const targetProgress = progress;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);

        // Easing functions
        let easedProgress = progressRatio;
        switch (easing) {
          case "ease-in":
            easedProgress = progressRatio * progressRatio;
            break;
          case "ease-out":
            easedProgress = 1 - Math.pow(1 - progressRatio, 2);
            break;
          case "ease-in-out":
            easedProgress =
              progressRatio < 0.5
                ? 2 * progressRatio * progressRatio
                : 1 - Math.pow(-2 * progressRatio + 2, 2) / 2;
            break;
        }

        const currentProgress =
          startProgress + (targetProgress - startProgress) * easedProgress;
        setAnimatedProgress(currentProgress);

        if (progressRatio < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [progress, duration, easing, animatedProgress]);

    return <ProgressCircle {...props} progress={animatedProgress} animated />;
  }
);

AnimatedProgressCircle.displayName = "AnimatedProgressCircle";

// ✅ MELHORIA 13: Multi-Progress Circle para múltiplas métricas
export const MultiProgressCircle: React.FC<{
  progresses: {
    value: number;
    color: string;
    strokeWidth?: number;
    label?: string;
  }[];
  size?: number;
  backgroundColor?: string;
  title?: string;
  centerContent?: React.ReactNode;
}> = React.memo(
  ({
    progresses,
    size = 120,
    backgroundColor = colors.lightGray,
    title,
    centerContent,
  }) => {
    // ✅ Calculations para múltiplos círculos
    const multiCircleCalculations = useMemo(() => {
      const totalStrokeWidth = progresses.reduce(
        (sum, p) => sum + (p.strokeWidth || 8),
        0
      );
      const spacing = 2;
      let currentRadius =
        (size - totalStrokeWidth - (progresses.length - 1) * spacing) / 2;

      return progresses.map((progress, index) => {
        const strokeWidth = progress.strokeWidth || 8;
        const radius = currentRadius;
        const circumference = radius * 2 * Math.PI;
        const strokeDasharray = `${circumference} ${circumference}`;
        const strokeDashoffset =
          circumference - (progress.value / 100) * circumference;

        currentRadius += strokeWidth + spacing;

        return {
          radius,
          circumference,
          strokeDasharray,
          strokeDashoffset,
          strokeWidth,
          color: progress.color,
          label: progress.label,
        };
      });
    }, [progresses, size]);

    // ✅ SVG props memoizadas
    const svgProps = useMemo(
      () => ({
        width: size,
        height: size,
        style: styles.svg,
      }),
      [size]
    );

    // ✅ Container style memoizado
    const containerStyle = useMemo(
      () => ({
        ...styles.container,
        width: size,
        height: size,
      }),
      [size]
    );

    const center = size / 2;

    return (
      <View style={containerStyle}>
        <Svg {...svgProps}>
          {/* Background circles */}
          {multiCircleCalculations.map((calc, index) => (
            <Circle
              key={`bg-${index}`}
              cx={center}
              cy={center}
              r={calc.radius}
              stroke={backgroundColor}
              strokeWidth={calc.strokeWidth}
              fill="transparent"
            />
          ))}

          {/* Progress circles */}
          {multiCircleCalculations.map((calc, index) => (
            <Circle
              key={`progress-${index}`}
              cx={center}
              cy={center}
              r={calc.radius}
              stroke={calc.color}
              strokeWidth={calc.strokeWidth}
              fill="transparent"
              strokeDasharray={calc.strokeDasharray}
              strokeDashoffset={calc.strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          ))}
        </Svg>

        <View style={styles.content}>
          {centerContent || (
            <>
              {title && <Text style={styles.title}>{title}</Text>}
              {progresses.map(
                (progress, index) =>
                  progress.label && (
                    <Text
                      key={index}
                      style={[styles.subtitle, { color: progress.color }]}
                    >
                      {progress.label}: {Math.round(progress.value)}%
                    </Text>
                  )
              )}
            </>
          )}
        </View>
      </View>
    );
  }
);

MultiProgressCircle.displayName = "MultiProgressCircle";

// ✅ MELHORIA 14: Gradient ProgressCircle
export const GradientProgressCircle: React.FC<
  ProgressCircleProps & {
    gradientColors?: string[];
    gradientId?: string;
  }
> = React.memo(
  ({
    gradientColors = [colors.primary, colors.secondary],
    gradientId = "progressGradient",
    ...props
  }) => {
    // ✅ Gradient definition memoizada
    const gradientDef = useMemo(
      () => (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientColors.map((color, index) => (
              <stop
                key={index}
                offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
        </defs>
      ),
      [gradientColors, gradientId]
    );

    return <ProgressCircle {...props} color={`url(#${gradientId})`} />;
  }
);

GradientProgressCircle.displayName = "GradientProgressCircle";

// ✅ MELHORIA 15: Mini ProgressCircle para uso em listas
export const MiniProgressCircle: React.FC<{
  progress: number;
  color?: string;
  size?: number;
}> = React.memo(({ progress, color = colors.primary, size = 24 }) => {
  // ✅ Mini calculations memoizadas
  const miniCalculations = useMemo(() => {
    const strokeWidth = 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return {
      radius,
      strokeWidth,
      circumference,
      strokeDasharray,
      strokeDashoffset,
      center: size / 2,
    };
  }, [progress, size]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={miniCalculations.center}
          cy={miniCalculations.center}
          r={miniCalculations.radius}
          stroke={colors.lightGray}
          strokeWidth={miniCalculations.strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={miniCalculations.center}
          cy={miniCalculations.center}
          r={miniCalculations.radius}
          stroke={color}
          strokeWidth={miniCalculations.strokeWidth}
          fill="transparent"
          strokeDasharray={miniCalculations.strokeDasharray}
          strokeDashoffset={miniCalculations.strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${miniCalculations.center} ${miniCalculations.center})`}
        />
      </Svg>
    </View>
  );
});

MiniProgressCircle.displayName = "MiniProgressCircle";

// ✅ MELHORIA 16: withProgressCircle HOC
export function withProgressCircle<P extends object>(
  Component: React.ComponentType<P>,
  progressExtractor: (props: P) => number
) {
  const WrappedComponent = React.memo(
    (
      props: P & {
        showProgress?: boolean;
        progressSize?: number;
        progressColor?: string;
      }
    ) => {
      const {
        showProgress = true,
        progressSize = 24,
        progressColor,
        ...componentProps
      } = props;
      const progress = progressExtractor(componentProps as P);

      if (!showProgress) {
        return <Component {...(componentProps as P)} />;
      }

      return (
        <View style={styles.withProgressContainer}>
          <Component {...(componentProps as P)} />
          <MiniProgressCircle
            progress={progress}
            size={progressSize}
            color={progressColor}
          />
        </View>
      );
    }
  );

  WrappedComponent.displayName = `withProgressCircle(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  svg: {
    position: "absolute",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  percentage: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: colors.dark,
  },
  // ✅ Novos estilos para percentage states
  percentageComplete: {
    color: colors.success,
  },
  percentageLow: {
    color: colors.warning,
  },
  title: {
    fontFamily: "Poppins_400Regular",
    fontSize: 8,
    color: colors.gray,
    marginTop: 2,
    textAlign: "center",
  },
  titleNoSubtitle: {
    marginTop: 4,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 6,
    color: colors.gray,
    textAlign: "center",
    marginTop: 1,
  },
  // ✅ Novos estilos para HOC
  withProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
