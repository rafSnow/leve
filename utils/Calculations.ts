import { WeightRecord, MeasurementRecord, Goal, ProgressData, UserProfile } from '../types';

export class CalculationUtils {
  // BMI Calculation
  static calculateBMI(weightKg: number, heightCm: number): number {
    const heightM = heightCm / 100;
    return Number((weightKg / (heightM * heightM)).toFixed(1));
  }

  static getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidade grau I';
    if (bmi < 40) return 'Obesidade grau II';
    return 'Obesidade grau III';
  }

  static getBMIColor(bmi: number): string {
    if (bmi < 18.5) return '#3B82F6'; // blue
    if (bmi < 25) return '#10B981'; // green
    if (bmi < 30) return '#F59E0B'; // yellow
    if (bmi < 35) return '#F97316'; // orange
    return '#EF4444'; // red
  }

  // RCQ - Relação Cintura/Quadril
  static calculateWHR(waistCm: number, hipCm: number): number {
    if (hipCm === 0) return 0;
    return Number((waistCm / hipCm).toFixed(2));
  }

  static getWHRCategory(whr: number, gender: 'male' | 'female' | 'other'): string {
    if (gender === 'male') {
      if (whr < 0.9) return 'Baixo risco';
      if (whr <= 0.99) return 'Risco moderado';
      return 'Alto risco';
    } else { // female ou other
      if (whr < 0.8) return 'Baixo risco';
      if (whr <= 0.84) return 'Risco moderado';
      return 'Alto risco';
    }
  }

  static getWHRColor(whr: number, gender: 'male' | 'female' | 'other'): string {
    const category = this.getWHRCategory(whr, gender);
    if (category === 'Baixo risco') return '#10B981'; // green
    if (category === 'Risco moderado') return '#F59E0B'; // yellow
    return '#EF4444'; // red
  }

  // RCEst - Relação Cintura/Estatura
  static calculateWHtR(waistCm: number, heightCm: number): number {
    if (heightCm === 0) return 0;
    return Number((waistCm / heightCm).toFixed(2));
  }

  static getWHtRCategory(whtr: number): string {
    if (whtr < 0.4) return 'Muito magro';
    if (whtr < 0.5) return 'Saudável';
    if (whtr < 0.6) return 'Sobrepeso';
    return 'Obesidade';
  }

  static getWHtRColor(whtr: number): string {
    if (whtr < 0.4) return '#3B82F6'; // blue
    if (whtr < 0.5) return '#10B981'; // green
    if (whtr < 0.6) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  }

  // ✅ VERSÃO UNIFICADA: calculateHealthMetrics com overloads
  static calculateHealthMetrics(
    weightKg: number,
    heightCm: number,
    waistCm?: number,
    hipCm?: number,
    gender?: 'male' | 'female' | 'other'
  ): {
    bmi: number;
    bmiCategory: string;
    bmiColor: string;
    whr?: number;
    whrCategory?: string;
    whrColor?: string;
    whtr?: number;
    whtrCategory?: string;
    whtrColor?: string;
  };

  static calculateHealthMetrics(params: {
    weight: number;
    height: number;
    gender: 'male' | 'female' | 'other';
    waist?: number;
    hip?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    value: string;
    category: string;
    color: string;
    description: string;
    recommendation: string;
  }>>;

  // ✅ Implementação unificada
  static calculateHealthMetrics(
    weightKgOrParams: number | {
      weight: number;
      height: number;
      gender: 'male' | 'female' | 'other';
      waist?: number;
      hip?: number;
    },
    heightCm?: number,
    waistCm?: number,
    hipCm?: number,
    gender: 'male' | 'female' | 'other' = 'other'
  ): any {
    // ✅ Verificar se é a versão com parâmetros ou a versão legacy
    if (typeof weightKgOrParams === 'object') {
      // Versão com objeto de parâmetros (assíncrona)
      return this.calculateHealthMetricsAdvanced(weightKgOrParams);
    }

    // Versão legacy (síncrona)
    return this.calculateHealthMetricsLegacy(
      weightKgOrParams,
      heightCm!,
      waistCm,
      hipCm,
      gender
    );
  }

  // ✅ Implementação da versão legacy (síncrona)
  private static calculateHealthMetricsLegacy(
    weightKg: number,
    heightCm: number,
    waistCm?: number,
    hipCm?: number,
    gender: 'male' | 'female' | 'other' = 'other'
  ): {
    bmi: number;
    bmiCategory: string;
    bmiColor: string;
    whr?: number;
    whrCategory?: string;
    whrColor?: string;
    whtr?: number;
    whtrCategory?: string;
    whtrColor?: string;
  } {
    const bmi = this.calculateBMI(weightKg, heightCm);
    const result: any = {
      bmi,
      bmiCategory: this.getBMICategory(bmi),
      bmiColor: this.getBMIColor(bmi),
    };

    if (waistCm && hipCm) {
      const whr = this.calculateWHR(waistCm, hipCm);
      result.whr = whr;
      result.whrCategory = this.getWHRCategory(whr, gender);
      result.whrColor = this.getWHRColor(whr, gender);
    }

    if (waistCm && heightCm) {
      const whtr = this.calculateWHtR(waistCm, heightCm);
      result.whtr = whtr;
      result.whtrCategory = this.getWHtRCategory(whtr);
      result.whtrColor = this.getWHtRColor(whtr);
    }

    return result;
  }

  // ✅ Implementação da versão avançada (assíncrona)
  private static async calculateHealthMetricsAdvanced(params: {
    weight: number;
    height: number;
    gender: 'male' | 'female' | 'other';
    waist?: number;
    hip?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    title: string;
    value: string;
    category: string;
    color: string;
    description: string;
    recommendation: string;
    icon?: string;
  }>> {
    const { weight, height, gender, waist, hip } = params;
    const metrics = [];

    try {
      // BMI
      const bmi = this.calculateBMI(weight, height);
      const bmiCategory = this.getBMICategory(bmi);
      const bmiColor = this.getBMIColor(bmi);

      metrics.push({
        id: 'bmi',
        name: 'IMC',
        title: 'Índice de Massa Corporal', // ✅ Adicionado title
        value: `${bmi.toFixed(1)}`,
        category: bmiCategory,
        color: bmiColor,
        description: 'Índice de Massa Corporal',
        recommendation: this.getBMIRecommendation(bmi),
        icon: 'body-outline', // ✅ Adicionado icon
      });

      // RCQ (se tiver cintura e quadril)
      if (waist && hip) {
        const whr = this.calculateWHR(waist, hip);
        const whrCategory = this.getWHRCategory(whr, gender);
        const whrColor = this.getWHRColor(whr, gender);

        metrics.push({
          id: 'whr',
          name: 'RCQ',
          title: 'Relação Cintura/Quadril', // ✅ Adicionado title
          value: `${whr.toFixed(2)}`,
          category: whrCategory,
          color: whrColor,
          description: 'Relação Cintura/Quadril',
          recommendation: this.getWHRRecommendation(whr, gender),
          icon: 'resize-outline', // ✅ Adicionado icon
        });
      }

      // RCEst (se tiver cintura)
      if (waist) {
        const whtr = this.calculateWHtR(waist, height);
        const whtrCategory = this.getWHtRCategory(whtr);
        const whtrColor = this.getWHtRColor(whtr);

        metrics.push({
          id: 'whtr',
          name: 'RCEst',
          title: 'Relação Cintura/Estatura', // ✅ Adicionado title
          value: `${whtr.toFixed(2)}`,
          category: whtrCategory,
          color: whtrColor,
          description: 'Relação Cintura/Estatura',
          recommendation: this.getWHtRRecommendation(whtr),
          icon: 'analytics-outline', // ✅ Adicionado icon
        });
      }

      return metrics;
    } catch (error) {
      console.error('Error calculating health metrics:', error);
      throw new Error('Erro ao calcular métricas de saúde');
    }
  }

  // ✅ Recomendações para BMI
  static getBMIRecommendation(bmi: number): string {
    if (bmi < 18.5) return 'Considere aumentar o peso de forma saudável com orientação nutricional.';
    if (bmi < 25) return 'Parabéns! Mantenha um estilo de vida saudável.';
    if (bmi < 30) return 'Considere reduzir o peso com dieta equilibrada e exercícios.';
    if (bmi < 35) return 'Importante reduzir o peso. Procure orientação médica.';
    return 'Procure orientação médica urgente para controle do peso.';
  }

  // ✅ Recomendações para RCQ
  static getWHRRecommendation(whr: number, gender: 'male' | 'female' | 'other'): string {
    const category = this.getWHRCategory(whr, gender);
    if (category === 'Baixo risco') {
      return 'Excelente distribuição de gordura corporal. Continue assim!';
    }
    if (category === 'Risco moderado') {
      return 'Considere exercícios para reduzir medidas da cintura.';
    }
    return 'Importante reduzir a gordura abdominal. Procure orientação médica.';
  }

  // ✅ Recomendações para RCEst
  static getWHtRRecommendation(whtr: number): string {
    if (whtr < 0.4) return 'Pode estar muito magro. Considere ganhar peso saudável.';
    if (whtr < 0.5) return 'Excelente relação cintura/altura. Mantenha!';
    if (whtr < 0.6) return 'Considere reduzir a circunferência da cintura.';
    return 'Importante reduzir gordura abdominal. Procure orientação médica.';
  }

  // ✅ NOVA FUNÇÃO: Análise de progresso da meta
  static analyzeGoalProgress(goal: Goal, currentValue: number): {
    goal: Goal;
    currentValue: number;
    distanceToGoal: number;
    progressPercentage: number;
    hasReached: boolean;
    isApproaching: boolean;
    direction: 'above' | 'below' | 'at';
    estimatedDaysToGoal?: number;
    message: string;
  } {
    try {
      // Validar inputs
      if (!goal || typeof currentValue !== 'number' || isNaN(currentValue)) {
        throw new Error('Dados inválidos para análise da meta');
      }

      const targetValue = goal.targetValue || goal.target;
      const startValue = goal.startValue || goal.current;

      if (typeof targetValue !== 'number' || typeof startValue !== 'number') {
        throw new Error('Valores da meta são inválidos');
      }

      // Calcular distância até a meta
      const distanceToGoal = Math.abs(currentValue - targetValue);

      // Determinar direção
      let direction: 'above' | 'below' | 'at' = 'at';
      if (currentValue > targetValue) {
        direction = 'above';
      } else if (currentValue < targetValue) {
        direction = 'below';
      }

      // Verificar se atingiu a meta (tolerância de 0.1)
      const hasReached = distanceToGoal <= 0.1;

      // Verificar se está se aproximando (dentro de 10% da distância total)
      const totalDistance = Math.abs(targetValue - startValue);
      const isApproaching = totalDistance > 0 && (distanceToGoal / totalDistance) <= 0.1;

      // Calcular porcentagem de progresso
      let progressPercentage = 0;
      if (totalDistance > 0) {
        const currentProgress = Math.abs(startValue - currentValue);
        progressPercentage = Math.min((currentProgress / totalDistance) * 100, 100);
      }

      // Estimar dias para atingir a meta (baseado no histórico)
      let estimatedDaysToGoal: number | undefined;
      if (!hasReached && goal.deadline) {
        const deadline = new Date(goal.deadline);
        const now = new Date();
        const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysRemaining > 0) {
          estimatedDaysToGoal = daysRemaining;
        }
      }

      // Gerar mensagem personalizada
      let message = '';
      if (hasReached) {
        message = '🎯 Parabéns! Você atingiu sua meta!';
      } else if (isApproaching) {
        message = `🔥 Você está quase lá! Faltam apenas ${distanceToGoal.toFixed(1)}${goal.unit || 'kg'}!`;
      } else {
        const progressText = progressPercentage > 0 ? ` (${progressPercentage.toFixed(0)}% concluído)` : '';
        message = `📊 Distância até a meta: ${distanceToGoal.toFixed(1)}${goal.unit || 'kg'}${progressText}`;
      }

      return {
        goal,
        currentValue,
        distanceToGoal,
        progressPercentage,
        hasReached,
        isApproaching,
        direction,
        estimatedDaysToGoal,
        message,
      };
    } catch (error) {
      console.error('Error analyzing goal progress:', error);

      // Retorno fallback em caso de erro
      return {
        goal,
        currentValue,
        distanceToGoal: 0,
        progressPercentage: 0,
        hasReached: false,
        isApproaching: false,
        direction: 'at',
        message: 'Erro ao analisar progresso da meta',
      };
    }
  }

  // Weight Progress
  static calculateWeightProgress(records: WeightRecord[]): ProgressData | null {
    if (records.length === 0) return null;

    const sortedRecords = [...records].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstRecord = sortedRecords[0];
    const lastRecord = sortedRecords[sortedRecords.length - 1];
    const totalWeightLoss = firstRecord.weight - lastRecord.weight;

    return {
      totalWeightLoss,
      currentWeight: lastRecord.weight,
      goalWeight: 0, // Will be set based on user goals
      progressPercentage: 0, // Will be calculated based on goals
      daysActive: this.calculateDaysActive(records),
      lastWeighIn: lastRecord.date,
    };
  }

  static calculateDaysActive(records: WeightRecord[]): number {
    if (records.length === 0) return 0;

    const dates = records.map(record => new Date(record.date).toDateString());
    const uniqueDates = new Set(dates);
    return uniqueDates.size;
  }

  // Goal Progress
  static calculateGoalProgress(goal: Goal, currentValue: number): number {
    if (goal.type === 'weight') {
      const totalChange = Math.abs(goal.target - goal.current);
      const currentChange = Math.abs(currentValue - goal.current);
      return Math.min((currentChange / totalChange) * 100, 100);
    }

    // For measurements, assume we want to decrease
    const totalChange = Math.abs(goal.current - goal.target);
    const currentChange = Math.abs(goal.current - currentValue);
    return Math.min((currentChange / totalChange) * 100, 100);
  }

  // Chart Data
  static prepareWeightChartData(records: WeightRecord[], maxPoints: number = 10): {
    labels: string[];
    data: number[];
  } {
    if (records.length === 0) {
      return { labels: [], data: [] };
    }

    const sortedRecords = [...records].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let processedRecords = sortedRecords;

    // If we have more records than maxPoints, sample them
    if (sortedRecords.length > maxPoints) {
      const step = Math.floor(sortedRecords.length / maxPoints);
      processedRecords = sortedRecords.filter((_, index) => index % step === 0);

      // Always include the last record
      if (processedRecords[processedRecords.length - 1] !== sortedRecords[sortedRecords.length - 1]) {
        processedRecords.push(sortedRecords[sortedRecords.length - 1]);
      }
    }

    return {
      labels: processedRecords.map(record =>
        new Date(record.date).toLocaleDateString('pt-BR', {
          month: 'short',
          day: 'numeric'
        })
      ),
      data: processedRecords.map(record => record.weight),
    };
  }

  // Statistics
  static calculateWeightStatistics(records: WeightRecord[]): {
    average: number;
    min: number;
    max: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } | null {
    if (records.length === 0) return null;

    const weights = records.map(record => record.weight);
    const average = weights.reduce((sum, weight) => sum + weight, 0) / weights.length;
    const min = Math.min(...weights);
    const max = Math.max(...weights);

    // Calculate trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (records.length >= 2) {
      const sortedRecords = [...records].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const firstWeight = sortedRecords[0].weight;
      const lastWeight = sortedRecords[sortedRecords.length - 1].weight;
      const difference = lastWeight - firstWeight;

      if (Math.abs(difference) > 0.5) { // Significant change threshold
        trend = difference > 0 ? 'increasing' : 'decreasing';
      }
    }

    return {
      average: Number(average.toFixed(1)),
      min,
      max,
      trend,
    };
  }

  // Date utilities
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
  }

  static formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('pt-BR');
  }

  static getDaysAgo(date: Date | string): number {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Unit conversions
  static kgToLbs(kg: number): number {
    return Number((kg * 2.20462).toFixed(1));
  }

  static lbsToKg(lbs: number): number {
    return Number((lbs / 2.20462).toFixed(1));
  }

  static cmToInches(cm: number): number {
    return Number((cm / 2.54).toFixed(1));
  }

  static inchesToCm(inches: number): number {
    return Number((inches * 2.54).toFixed(1));
  }
}