import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { colors } from "../styles/colors";

interface ChartProps {
  data: number[];
  labels: string[];
  title: string;
  suffix?: string;
  color?: string;
}

export const Chart: React.FC<ChartProps> = React.memo(
  ({ data, labels, title, suffix = "", color = colors.primary }) => {
    // ✅ MELHORIA 1: Screen width memoizado
    const screenWidth = useMemo(() => {
      return Dimensions.get("window").width;
    }, []);

    // ✅ MELHORIA 2: Chart width memoizado
    const chartWidth = useMemo(() => {
      return screenWidth - 40;
    }, [screenWidth]);

    // ✅ MELHORIA 3: Color function memoizada
    const colorFunction = useCallback(
      (opacity = 1) => {
        return color;
      },
      [color]
    );

    // ✅ MELHORIA 4: Format function memoizada
    const formatYLabel = useCallback(
      (value: string) => {
        return `${value}${suffix}`;
      },
      [suffix]
    );

    // ✅ MELHORIA 5: Chart data memoizado
    const chartData = useMemo(
      () => ({
        labels,
        datasets: [
          {
            data,
            color: colorFunction,
            strokeWidth: 3,
          },
        ],
      }),
      [labels, data, colorFunction]
    );

    // ✅ MELHORIA 6: Chart config memoizado
    const chartConfig = useMemo(
      () => ({
        backgroundColor: colors.white,
        backgroundGradientFrom: colors.white,
        backgroundGradientTo: colors.white,
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
        style: {
          borderRadius: 16,
        },
        propsForDots: {
          r: "6",
          strokeWidth: "2",
          stroke: color,
        },
        formatYLabel,
      }),
      [color, formatYLabel]
    );

    // ✅ MELHORIA 7: Chart props memoizadas
    const chartProps = useMemo(
      () => ({
        data: chartData,
        width: chartWidth,
        height: 220,
        chartConfig,
        style: styles.chart,
        withInnerLines: false,
        withOuterLines: true,
        withVerticalLines: false,
        withHorizontalLines: true,
        segments: 4,
      }),
      [chartData, chartWidth, chartConfig]
    );

    // ✅ MELHORIA 8: Dados estatísticos memoizados
    const chartStats = useMemo(() => {
      if (!data || data.length === 0) {
        return {
          hasData: false,
          isEmpty: true,
          dataPoints: 0,
          minValue: 0,
          maxValue: 0,
          average: 0,
        };
      }

      const minValue = Math.min(...data);
      const maxValue = Math.max(...data);
      const average = data.reduce((sum, val) => sum + val, 0) / data.length;

      return {
        hasData: true,
        isEmpty: false,
        dataPoints: data.length,
        minValue: Number(minValue.toFixed(1)),
        maxValue: Number(maxValue.toFixed(1)),
        average: Number(average.toFixed(1)),
      };
    }, [data]);

    // ✅ MELHORIA 9: Renderização condicional para dados vazios
    if (!chartStats.hasData) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Não há dados suficientes para exibir o gráfico
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>

        {/* ✅ MELHORIA 10: Stats do gráfico */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Mín</Text>
            <Text style={styles.statValue}>
              {chartStats.minValue}
              {suffix}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Máx</Text>
            <Text style={styles.statValue}>
              {chartStats.maxValue}
              {suffix}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Média</Text>
            <Text style={styles.statValue}>
              {chartStats.average}
              {suffix}
            </Text>
          </View>
        </View>

        <LineChart {...chartProps} />

        {/* ✅ MELHORIA 11: Debug info em desenvolvimento */}
        {__DEV__ && (
          <Text style={styles.debugText}>
            {chartStats.dataPoints} pontos • Renderizado:{" "}
            {new Date().toLocaleTimeString()}
          </Text>
        )}
      </View>
    );
  }
);

Chart.displayName = "Chart";

// ✅ MELHORIA 12: Enhanced Chart para casos específicos
export const EnhancedChart: React.FC<
  ChartProps & {
    showStats?: boolean;
    showTrend?: boolean;
    onDataPointPress?: (index: number, value: number) => void;
  }
> = React.memo(
  ({
    showStats = true,
    showTrend = false,
    onDataPointPress,
    ...chartProps
  }) => {
    // ✅ Trend calculation memoizado
    const trendData = useMemo(() => {
      if (!showTrend || !chartProps.data || chartProps.data.length < 2) {
        return null;
      }

      const data = chartProps.data;
      const firstValue = data[0];
      const lastValue = data[data.length - 1];
      const change = lastValue - firstValue;
      const percentChange = (change / firstValue) * 100;

      return {
        change: Number(change.toFixed(1)),
        percentChange: Number(percentChange.toFixed(1)),
        isPositive: change >= 0,
        isNegative: change < 0,
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
      };
    }, [showTrend, chartProps.data]);

    // ✅ Enhanced chart props memoizadas
    const enhancedChartProps = useMemo(
      () => ({
        ...chartProps,
        // Adicionar interatividade se callback fornecido
        ...(onDataPointPress && {
          onDataPointClick: (data: any, index: number) => {
            onDataPointPress(index, chartProps.data[index]);
          },
        }),
      }),
      [chartProps, onDataPointPress]
    );

    return (
      <View style={styles.enhancedContainer}>
        <Chart {...enhancedChartProps} />

        {/* ✅ Trend indicator */}
        {trendData && (
          <View style={styles.trendContainer}>
            <Text
              style={[
                styles.trendText,
                trendData.isPositive
                  ? styles.trendPositive
                  : styles.trendNegative,
              ]}
            >
              {trendData.isPositive ? "↗️" : "↘️"} {trendData.change}
              {chartProps.suffix}({trendData.percentChange > 0 ? "+" : ""}
              {trendData.percentChange}%)
            </Text>
          </View>
        )}
      </View>
    );
  }
);

EnhancedChart.displayName = "EnhancedChart";

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
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: colors.dark,
    marginBottom: 16,
    textAlign: "center",
  },
  chart: {
    borderRadius: 16,
  },
  // ✅ Novos estilos para melhorias
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.dark,
  },
  emptyState: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 16,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
  },
  debugText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: colors.gray,
    textAlign: "center",
    marginTop: 8,
  },
  enhancedContainer: {
    marginVertical: 8,
  },
  trendContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  trendText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  trendPositive: {
    color: colors.success || "#22c55e",
  },
  trendNegative: {
    color: colors.error || "#ef4444",
  },
});
