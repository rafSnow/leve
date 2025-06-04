import { Ionicons } from '@expo/vector-icons';

export interface WeightRecord {
  id: string;
  weight: number;
  date: string;
  notes?: string;
  createdAt: Date;
}

export interface MeasurementRecord {
  id: string;
  date: string;
  measurements: {
    chest?: number;
    waist?: number;
    hip?: number;
    thigh?: number;
    arm?: number;
    neck?: number;
    forearm?: number;
    calf?: number;
  };
  notes?: string;
  createdAt: Date;
}

export interface Goal {
  id: string;
  type: 'weight' | 'measurement' | 'habit';
  title: string;
  description?: string;
  target: number; // Valor alvo (compatibilidade)
  targetValue: number; // Novo nome mais claro
  current: number; // Valor atual (compatibilidade)
  startValue: number; // Valor inicial mais claro
  unit: string; // kg, cm, etc.
  deadline?: string | Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  progress?: number; // Porcentagem de progresso calculada
}

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  height?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goals: Goal[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface ProgressData {
  totalWeightLoss: number;
  currentWeight: number;
  goalWeight: number;
  progressPercentage: number;
  daysActive: number;
  lastWeighIn?: string;
}

export interface StorageKeys {
  WEIGHT_RECORDS: 'weight_records';
  MEASUREMENT_RECORDS: 'measurement_records';
  USER_PROFILE: 'user_profile';
  GOALS: 'goals';
  SETTINGS: 'settings';
}

export interface Settings {
  units: {
    weight: 'kg' | 'lbs';
    height: 'cm' | 'ft';
    measurements: 'cm' | 'in';
  };
  notifications: {
    dailyReminder: boolean;
    weeklyProgress: boolean;
    goalDeadlines: boolean;
  };
  privacy: {
    shareProgress: boolean;
    backupData: boolean;
  };
}

// Navigation types
export type RootTabParamList = {
  Progresso: undefined;
  Adicionar: undefined;
  Histórico: undefined;
};

export type AddStackParamList = {
  AddMain: undefined;
  WeightInput: undefined;
  MeasurementsInput: undefined;
};

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: AppError;
}

export interface HealthMetric {
  id: string;
  name: string;
  title: string; // Para compatibilidade com componentes existentes
  value: string;
  category: string;
  color: string;
  description: string;
  recommendation: string;
  icon?: keyof typeof Ionicons.glyphMap; // Propriedade opcional para ícones
}

export interface HealthMetricsCardProps {
  metrics: HealthMetric[];
}