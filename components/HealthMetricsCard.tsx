import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";
import { HealthMetric, HealthMetricsCardProps } from "../types";

// ✅ OTIMIZAÇÃO 1: React.memo para prevenir re-renders desnecessários
export const HealthMetricsCard: React.FC<HealthMetricsCardProps> = React.memo(
  ({ metrics }) => {
    // ✅ OTIMIZAÇÃO 2: Memoizar renderização de cada métrica
    const renderedMetrics = useMemo(() => {
      return metrics.map((metric) => (
        <HealthMetricItem key={metric.id} metric={metric} />
      ));
    }, [metrics]);

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Indicadores de Saúde</Text>
        {renderedMetrics}
      </View>
    );
  }
);

HealthMetricsCard.displayName = "HealthMetricsCard";

// ✅ OTIMIZAÇÃO 3: Componente individual para cada métrica
const HealthMetricItem: React.FC<{ metric: HealthMetric }> = React.memo(
  ({ metric }) => {
    // ✅ OTIMIZAÇÃO 4: Icon container style memoizado
    const iconContainerStyle = useMemo(
      (): ViewStyle => ({
        ...styles.iconContainer,
        backgroundColor: metric.color + "20",
      }),
      [metric.color]
    );

    // ✅ OTIMIZAÇÃO 5: Icon props memoizadas
    const iconProps = useMemo(
      () => ({
        name: metric.icon as keyof typeof Ionicons.glyphMap,
        size: 20,
        color: metric.color,
      }),
      [metric.icon, metric.color]
    );

    // ✅ OTIMIZAÇÃO 6: Category text style memoizado
    const categoryTextStyle = useMemo(
      (): TextStyle[] => [styles.metricCategory, { color: metric.color }],
      [metric.color]
    );

    // ✅ OTIMIZAÇÃO 7: Description element memoizado
    const descriptionElement = useMemo(() => {
      if (!metric.description) return null;

      return <Text style={styles.metricDescription}>{metric.description}</Text>;
    }, [metric.description]);

    return (
      <View style={styles.metricRow}>
        <View style={styles.metricHeader}>
          <View style={iconContainerStyle}>
            <Ionicons {...iconProps} />
          </View>

          <View style={styles.metricInfo}>
            <Text style={styles.metricTitle}>{metric.title}</Text>
            {descriptionElement}
          </View>

          <View style={styles.metricValues}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={categoryTextStyle}>{metric.category}</Text>
          </View>
        </View>
      </View>
    );
  }
);

HealthMetricItem.displayName = "HealthMetricItem";

// ✅ OTIMIZAÇÃO 8: Variação com ações (para futuras melhorias)
export const InteractiveHealthMetricsCard: React.FC<
  HealthMetricsCardProps & {
    onMetricPress?: (metric: HealthMetric) => void;
    showRecommendations?: boolean;
  }
> = React.memo(({ metrics, onMetricPress, showRecommendations = false }) => {
  // ✅ Metric press handler memoizado
  const handleMetricPress = useCallback(
    (metric: HealthMetric) => {
      if (onMetricPress) {
        onMetricPress(metric);
      }
    },
    [onMetricPress]
  );

  // ✅ Interactive metrics memoizadas
  const interactiveMetrics = useMemo(() => {
    return metrics.map((metric) => (
      <InteractiveHealthMetricItem
        key={metric.id}
        metric={metric}
        onPress={onMetricPress ? () => handleMetricPress(metric) : undefined}
        showRecommendation={showRecommendations}
      />
    ));
  }, [metrics, handleMetricPress, onMetricPress, showRecommendations]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Indicadores de Saúde</Text>
      {interactiveMetrics}
    </View>
  );
});

InteractiveHealthMetricsCard.displayName = "InteractiveHealthMetricsCard";

// ✅ OTIMIZAÇÃO 9: Item interativo otimizado
const InteractiveHealthMetricItem: React.FC<{
  metric: HealthMetric;
  onPress?: () => void;
  showRecommendation?: boolean;
}> = React.memo(({ metric, onPress, showRecommendation = false }) => {
  // ✅ Container style baseado na interatividade
  const containerStyle = useMemo(() => {
    if (!onPress) return styles.metricRow;

    return [styles.metricRow, styles.interactiveMetricRow];
  }, [onPress]);

  // ✅ Icon container style memoizado
  const iconContainerStyle = useMemo(
    (): ViewStyle => ({
      ...styles.iconContainer,
      backgroundColor: metric.color + "20",
    }),
    [metric.color]
  );

  // ✅ Icon props memoizadas
  const iconProps = useMemo(
    () => ({
      name: metric.icon,
      size: 20,
      color: metric.color,
    }),
    [metric.icon, metric.color]
  );

  // ✅ Category text style memoizado
  const categoryTextStyle = useMemo(
    (): TextStyle => ({
      ...styles.metricCategory,
      color: metric.color,
    }),
    [metric.color]
  );

  // ✅ Description element memoizado
  const descriptionElement = useMemo(() => {
    if (!metric.description) return null;

    return <Text style={styles.metricDescription}>{metric.description}</Text>;
  }, [metric.description]);

  // ✅ Recommendation element memoizado
  const recommendationElement = useMemo(() => {
    if (!showRecommendation || !metric.recommendation) return null;

    return (
      <View style={styles.recommendationContainer}>
        <Text style={styles.recommendationText}>{metric.recommendation}</Text>
      </View>
    );
  }, [showRecommendation, metric.recommendation]);

  // ✅ Content memoizado
  const content = useMemo(
    () => (
      <>
        <View style={styles.metricHeader}>
          <View style={iconContainerStyle}>
            <Ionicons {...iconProps} />
          </View>

          <View style={styles.metricInfo}>
            <Text style={styles.metricTitle}>{metric.title}</Text>
            {descriptionElement}
          </View>

          <View style={styles.metricValues}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={categoryTextStyle}>{metric.category}</Text>
          </View>
        </View>
        {recommendationElement}
      </>
    ),
    [
      iconContainerStyle,
      iconProps,
      metric.title,
      metric.value,
      metric.category,
      descriptionElement,
      categoryTextStyle,
      recommendationElement,
    ]
  );

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
});

InteractiveHealthMetricItem.displayName = "InteractiveHealthMetricItem";

// ✅ OTIMIZAÇÃO 10: Card compacto para espaços menores
export const CompactHealthMetricsCard: React.FC<HealthMetricsCardProps> =
  React.memo(({ metrics }) => {
    // ✅ Compact metrics memoizadas
    const compactMetrics = useMemo(() => {
      return metrics.map((metric) => (
        <CompactHealthMetricItem key={metric.id} metric={metric} />
      ));
    }, [metrics]);

    return (
      <View style={[styles.container, styles.compactContainer]}>
        <Text style={[styles.title, styles.compactTitle]}>
          Indicadores de Saúde
        </Text>
        <View style={styles.compactGrid}>{compactMetrics}</View>
      </View>
    );
  });

CompactHealthMetricsCard.displayName = "CompactHealthMetricsCard";

// ✅ OTIMIZAÇÃO 11: Item compacto otimizado
const CompactHealthMetricItem: React.FC<{ metric: HealthMetric }> = React.memo(
  ({ metric }) => {
    // ✅ Compact icon style memoizado
    const compactIconStyle = useMemo(
      (): ViewStyle => ({
        ...styles.compactIcon,
        backgroundColor: metric.color + "15",
      }),
      [metric.color]
    );

    // ✅ Compact icon props memoizadas
    const compactIconProps = useMemo(
      () => ({
        name: metric.icon,
        size: 16,
        color: metric.color,
      }),
      [metric.icon, metric.color]
    );

    // ✅ Compact value style memoizado
    const compactValueStyle = useMemo(
      (): TextStyle => ({
        ...styles.compactValue,
        color: metric.color,
      }),
      [metric.color]
    );

    return (
      <View style={styles.compactItem}>
        <View style={compactIconStyle}>
          <Ionicons {...compactIconProps} />
        </View>
        <Text style={styles.compactTitle}>{metric.title}</Text>
        <Text style={compactValueStyle}>{metric.value}</Text>
      </View>
    );
  }
);

CompactHealthMetricItem.displayName = "CompactHealthMetricItem";

// ✅ OTIMIZAÇÃO 12: Card com agrupamento por categoria
export const GroupedHealthMetricsCard: React.FC<
  HealthMetricsCardProps & {
    groupByCategory?: boolean;
  }
> = React.memo(({ metrics, groupByCategory = false }) => {
  // ✅ Grouped metrics memoizadas
  const groupedMetrics = useMemo(() => {
    if (!groupByCategory) {
      return { "Todos os Indicadores": metrics };
    }

    return metrics.reduce((groups, metric) => {
      const category = metric.category || "Outros";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(metric);
      return groups;
    }, {} as Record<string, HealthMetric[]>);
  }, [metrics, groupByCategory]);

  // ✅ Rendered groups memoizadas
  const renderedGroups = useMemo(() => {
    return Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
      <View key={category} style={styles.categoryGroup}>
        {groupByCategory && (
          <Text style={styles.categoryTitle}>{category}</Text>
        )}
        {categoryMetrics.map((metric) => (
          <HealthMetricItem key={metric.id} metric={metric} />
        ))}
      </View>
    ));
  }, [groupedMetrics, groupByCategory]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Indicadores de Saúde</Text>
      {renderedGroups}
    </View>
  );
});

GroupedHealthMetricsCard.displayName = "GroupedHealthMetricsCard";

// ✅ OTIMIZAÇÃO 13: Card com filtros
export const FilterableHealthMetricsCard: React.FC<
  HealthMetricsCardProps & {
    filter?: (metric: HealthMetric) => boolean;
    sortBy?: "name" | "value" | "category";
  }
> = React.memo(({ metrics, filter, sortBy }) => {
  // ✅ Filtered and sorted metrics memoizadas
  const processedMetrics = useMemo(() => {
    let processed = metrics;

    // Apply filter
    if (filter) {
      processed = processed.filter(filter);
    }

    // Apply sorting
    if (sortBy) {
      processed = [...processed].sort((a, b) => {
        switch (sortBy) {
          case "name":
            return (a.title || a.name).localeCompare(b.title || b.name);
          case "category":
            return a.category.localeCompare(b.category);
          case "value":
            return a.value.localeCompare(b.value);
          default:
            return 0;
        }
      });
    }

    return processed;
  }, [metrics, filter, sortBy]);

  // ✅ Filtered metrics rendered memoizadas
  const filteredMetrics = useMemo(() => {
    return processedMetrics.map((metric) => (
      <HealthMetricItem key={metric.id} metric={metric} />
    ));
  }, [processedMetrics]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Indicadores de Saúde ({processedMetrics.length})
      </Text>
      {filteredMetrics}
    </View>
  );
});

FilterableHealthMetricsCard.displayName = "FilterableHealthMetricsCard";

// ✅ OTIMIZAÇÃO 14: Card com loading state
export const LoadingHealthMetricsCard: React.FC<{
  isLoading?: boolean;
  metrics?: HealthMetric[];
  loadingMessage?: string;
}> = React.memo(
  ({ isLoading = false, metrics = [], loadingMessage = "Carregando..." }) => {
    // ✅ Loading content memoizado
    const loadingContent = useMemo(() => {
      if (!isLoading) return null;

      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      );
    }, [isLoading, loadingMessage]);

    // ✅ Metrics content memoizado
    const metricsContent = useMemo(() => {
      if (isLoading || metrics.length === 0) return null;

      return <HealthMetricsCard metrics={metrics} />;
    }, [isLoading, metrics]);

    // ✅ Empty state memoizado
    const emptyState = useMemo(() => {
      if (isLoading || metrics.length > 0) return null;

      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhum indicador disponível no momento
          </Text>
        </View>
      );
    }, [isLoading, metrics.length]);

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Indicadores de Saúde</Text>
        {loadingContent}
        {metricsContent}
        {emptyState}
      </View>
    );
  }
);

LoadingHealthMetricsCard.displayName = "LoadingHealthMetricsCard";

// ✅ OTIMIZAÇÃO 15: Hook para métricas derivadas
export const useDerivedHealthMetrics = (metrics: HealthMetric[]) => {
  return useMemo(() => {
    const categoryCounts = metrics.reduce((counts, metric) => {
      counts[metric.category] = (counts[metric.category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const avgNumericValue = metrics
      .map((m) => parseFloat(m.value.replace(/[^\d.]/g, "")))
      .filter((v) => !isNaN(v))
      .reduce((sum, val, _, arr) => sum + val / arr.length, 0);

    const highPriorityMetrics = metrics.filter(
      (m) =>
        m.category.toLowerCase().includes("alto") ||
        m.category.toLowerCase().includes("crítico")
    );

    return {
      total: metrics.length,
      categoryCounts,
      avgNumericValue: isNaN(avgNumericValue) ? 0 : avgNumericValue,
      highPriorityCount: highPriorityMetrics.length,
      categories: Object.keys(categoryCounts),
    };
  }, [metrics]);
};

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
  },
  metricRow: {
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: colors.dark,
  },
  metricDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  metricValues: {
    alignItems: "flex-end",
  },
  metricValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.dark,
  },
  metricCategory: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  // ✅ Estilos para variações otimizadas
  interactiveMetricRow: {
    backgroundColor: colors.lightGray + "30",
    borderRadius: 8,
    padding: 8,
  },
  compactContainer: {
    padding: 12,
  },
  compactTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  compactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  compactItem: {
    width: "48%",
    backgroundColor: colors.lightGray + "20",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  compactValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    marginTop: 2,
  },
  categoryGroup: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  recommendationContainer: {
    backgroundColor: colors.secondary + "10",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  recommendationText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.secondary,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
  },
});
