import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react'; // Importar React hooks
import { WeightRecord, MeasurementRecord, UserProfile, Goal, Settings } from '../types';

const STORAGE_KEYS = {
  WEIGHT_RECORDS: '@leve_plus:weight_records',
  MEASUREMENT_RECORDS: '@leve_plus:measurement_records',
  USER_PROFILE: '@leve_plus:user_profile',
  GOALS: '@leve_plus:goals',
  SETTINGS: '@leve_plus:settings',
  ERROR_LOGS: '@leve_plus:error_logs',
} as const;

// Cache interface
interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
  accessCount: number; // Para hit rate tracking
}

interface CacheConfig {
  ttl: number; // Time to live em milliseconds
  maxSize: number; // Máximo de itens no cache
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private hitCount = 0;
  private missCount = 0;
  private config: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutos
    maxSize: 100, // 100 itens
  };

  // Configurar cache
  configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Verificar se item está válido no cache
  private isValid<T>(item: CacheItem<T>): boolean {
    const now = Date.now();
    return (now - item.timestamp) < this.config.ttl;
  }

  // Limpar cache expirado
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if ((now - item.timestamp) >= this.config.ttl) {
        this.cache.delete(key);
      }
    }

    // Limitar tamanho do cache
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries());
      // Ordenar por timestamp e accessCount (LRU - Least Recently Used)
      entries.sort((a, b) => {
        const timestampDiff = a[1].timestamp - b[1].timestamp;
        if (timestampDiff === 0) {
          return a[1].accessCount - b[1].accessCount;
        }
        return timestampDiff;
      });

      // Remover 20% dos itens menos usados
      const toRemove = Math.floor(this.config.maxSize * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  // Obter do cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || !this.isValid(item)) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Incrementar access count e hit count
    item.accessCount++;
    this.hitCount++;
    return item.data;
  }

  // Salvar no cache
  set<T>(key: string, data: T, version = '1.0'): void {
    this.cleanup();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      version,
      accessCount: 0,
    });
  }

  // Invalidar cache específico
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  // Invalidar cache por padrão
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Limpar todo cache
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  // Estatísticas do cache
  getStats(): { size: number; hitRate: number; memoryUsage: string; totalRequests: number } {
    const size = this.cache.size;
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? Math.round((this.hitCount / totalRequests) * 100) : 0;
    const memoryUsage = `${Math.round(JSON.stringify([...this.cache.values()]).length / 1024)}KB`;

    return {
      size,
      hitRate,
      memoryUsage,
      totalRequests,
    };
  }

  // Reset statistics
  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }
}

// Batch operations interface
interface BatchOperation {
  key: string;
  value: any;
  operation: 'SET' | 'DELETE';
}

class StorageService {
  private cache = new CacheManager();
  private pendingOperations: BatchOperation[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // 100ms para batch operations
  private performanceMetrics = {
    totalOperations: 0,
    averageResponseTime: 0,
    errorCount: 0,
  };

  constructor() {
    // Configurar cache otimizado
    this.cache.configure({
      ttl: 10 * 60 * 1000, // 10 minutos para dados principais
      maxSize: 150,
    });

    // Limpar cache e mostrar estatísticas a cada 5 minutos
    setInterval(() => {
      const stats = this.cache.getStats();
      console.log('📊 Cache Stats:', {
        ...stats,
        hitRate: `${stats.hitRate}%`,
        performance: this.performanceMetrics,
      });

      // Reset stats se necessário
      if (stats.totalRequests > 1000) {
        this.cache.resetStats();
        this.performanceMetrics = {
          totalOperations: 0,
          averageResponseTime: 0,
          errorCount: 0,
        };
      }
    }, 5 * 60 * 1000);
  }

  // Track performance metrics
  private trackOperation(duration: number, success: boolean): void {
    this.performanceMetrics.totalOperations++;

    if (success) {
      // Calcular média móvel do tempo de resposta
      const currentAvg = this.performanceMetrics.averageResponseTime;
      const count = this.performanceMetrics.totalOperations;
      this.performanceMetrics.averageResponseTime =
        (currentAvg * (count - 1) + duration) / count;
    } else {
      this.performanceMetrics.errorCount++;
    }
  }

  // Generic methods com cache e performance tracking
  private async setItem<T>(key: string, value: T): Promise<void> {
    const startTime = Date.now();
    try {
      const jsonValue = JSON.stringify(value);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem(key, jsonValue);

      // Atualizar cache
      this.cache.set(key, value);

      const duration = Date.now() - startTime;
      this.trackOperation(duration, true);

      console.log(`✅ Saved to storage and cache: ${key} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.trackOperation(duration, false);

      console.error(`❌ Error saving ${key}:`, error);
      throw error;
    }
  }

  private async getItem<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      // Tentar cache primeiro
      const cachedData = this.cache.get<T>(key);
      if (cachedData !== null) {
        const duration = Date.now() - startTime;
        this.trackOperation(duration, true);
        console.log(`⚡ Cache hit: ${key} (${duration}ms)`);
        return cachedData;
      }

      // Se não estiver no cache, buscar no AsyncStorage
      console.log(`💾 Cache miss, loading from storage: ${key}`);
      const jsonValue = await AsyncStorage.getItem(key);

      if (jsonValue != null) {
        const data = JSON.parse(jsonValue);
        // Salvar no cache para próximas consultas
        this.cache.set(key, data);

        const duration = Date.now() - startTime;
        this.trackOperation(duration, true);
        return data;
      }

      const duration = Date.now() - startTime;
      this.trackOperation(duration, true);
      return null;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.trackOperation(duration, false);

      console.error(`❌ Error getting ${key}:`, error);
      return null;
    }
  }

  private async removeItem(key: string): Promise<void> {
    const startTime = Date.now();
    try {
      await AsyncStorage.removeItem(key);
      this.cache.invalidate(key);

      const duration = Date.now() - startTime;
      this.trackOperation(duration, true);

      console.log(`🗑️ Removed from storage and cache: ${key} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.trackOperation(duration, false);

      console.error(`❌ Error removing ${key}:`, error);
      throw error;
    }
  }

  // Batch operations para melhor performance
  private addToBatch(operation: BatchOperation): void {
    this.pendingOperations.push(operation);

    // Cancelar timeout anterior
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Executar batch após delay
    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, this.BATCH_DELAY);
  }

  private async executeBatch(): Promise<void> {
    if (this.pendingOperations.length === 0) return;

    const startTime = Date.now();
    console.log(`🔄 Executing batch with ${this.pendingOperations.length} operations`);

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    const promises = operations.map(async (op) => {
      try {
        if (op.operation === 'SET') {
          await AsyncStorage.setItem(op.key, JSON.stringify(op.value));
          this.cache.set(op.key, op.value);
        } else if (op.operation === 'DELETE') {
          await AsyncStorage.removeItem(op.key);
          this.cache.invalidate(op.key);
        }
      } catch (error) {
        console.error(`❌ Batch operation failed for ${op.key}:`, error);
        this.performanceMetrics.errorCount++;
      }
    });

    await Promise.allSettled(promises);
    const duration = Date.now() - startTime;
    console.log(`✅ Batch completed (${duration}ms)`);
  }

  // Método público para forçar batch
  async flushBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    await this.executeBatch();
  }

  // Weight Records com cache otimizado
  async saveWeightRecord(record: WeightRecord): Promise<void> {
    const records = await this.getWeightRecords();
    const updatedRecords = [...records, record];
    await this.setItem(STORAGE_KEYS.WEIGHT_RECORDS, updatedRecords);

    // Invalidar cache relacionado
    this.cache.invalidatePattern('weight');
  }

  async getWeightRecords(): Promise<WeightRecord[]> {
    const records = await this.getItem<WeightRecord[]>(STORAGE_KEYS.WEIGHT_RECORDS);
    return records || [];
  }

  async updateWeightRecord(id: string, updates: Partial<WeightRecord>): Promise<void> {
    const records = await this.getWeightRecords();
    const updatedRecords = records.map(record =>
      record.id === id ? { ...record, ...updates } : record
    );
    await this.setItem(STORAGE_KEYS.WEIGHT_RECORDS, updatedRecords);
    this.cache.invalidatePattern('weight');
  }

  async deleteWeightRecord(id: string): Promise<void> {
    const records = await this.getWeightRecords();
    const filteredRecords = records.filter(record => record.id !== id);
    await this.setItem(STORAGE_KEYS.WEIGHT_RECORDS, filteredRecords);
    this.cache.invalidatePattern('weight');
  }

  // Measurement Records com cache
  async saveMeasurementRecord(record: MeasurementRecord): Promise<void> {
    const records = await this.getMeasurementRecords();
    const updatedRecords = [...records, record];
    await this.setItem(STORAGE_KEYS.MEASUREMENT_RECORDS, updatedRecords);
    this.cache.invalidatePattern('measurement');
  }

  async getMeasurementRecords(): Promise<MeasurementRecord[]> {
    const records = await this.getItem<MeasurementRecord[]>(STORAGE_KEYS.MEASUREMENT_RECORDS);
    return records || [];
  }

  async updateMeasurementRecord(id: string, updates: Partial<MeasurementRecord>): Promise<void> {
    const records = await this.getMeasurementRecords();
    const updatedRecords = records.map(record =>
      record.id === id ? { ...record, ...updates } : record
    );
    await this.setItem(STORAGE_KEYS.MEASUREMENT_RECORDS, updatedRecords);
    this.cache.invalidatePattern('measurement');
  }

  async deleteMeasurementRecord(id: string): Promise<void> {
    const records = await this.getMeasurementRecords();
    const filteredRecords = records.filter(record => record.id !== id);
    await this.setItem(STORAGE_KEYS.MEASUREMENT_RECORDS, filteredRecords);
    this.cache.invalidatePattern('measurement');
  }

  // User Profile com cache
  async saveUserProfile(profile: UserProfile): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_PROFILE, profile);
    this.cache.invalidatePattern('profile');
  }

  async getUserProfile(): Promise<UserProfile | null> {
    return await this.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE);
  }

  // Goals com cache
  async saveGoal(goal: Goal): Promise<void> {
    const goals = await this.getGoals();
    const updatedGoals = [...goals, goal];
    await this.setItem(STORAGE_KEYS.GOALS, updatedGoals);
    this.cache.invalidatePattern('goal');
  }

  async getGoals(): Promise<Goal[]> {
    const goals = await this.getItem<Goal[]>(STORAGE_KEYS.GOALS);
    return goals || [];
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    const goals = await this.getGoals();
    const updatedGoals = goals.map(goal =>
      goal.id === id ? { ...goal, ...updates } : goal
    );
    await this.setItem(STORAGE_KEYS.GOALS, updatedGoals);
    this.cache.invalidatePattern('goal');
  }

  async deleteGoal(id: string): Promise<void> {
    const goals = await this.getGoals();
    const filteredGoals = goals.filter(goal => goal.id !== id);
    await this.setItem(STORAGE_KEYS.GOALS, filteredGoals);
    this.cache.invalidatePattern('goal');
  }

  // Settings com cache
  async saveSettings(settings: Settings): Promise<void> {
    await this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  async getSettings(): Promise<Settings | null> {
    return await this.getItem<Settings>(STORAGE_KEYS.SETTINGS);
  }

  // Utility methods otimizados
  async clearAllData(): Promise<void> {
    const startTime = Date.now();
    console.log('🧹 Clearing all data...');

    const keys = Object.values(STORAGE_KEYS);
    await Promise.all(keys.map(key => this.removeItem(key)));
    this.cache.clear();

    const duration = Date.now() - startTime;
    console.log(`✅ All data cleared (${duration}ms)`);
  }

  async exportData(): Promise<string> {
    const startTime = Date.now();
    console.log('📤 Exporting data...');

    try {
      // Usar Promise.all para buscar dados em paralelo
      const [weightRecords, measurementRecords, userProfile, goals, settings] = await Promise.all([
        this.getWeightRecords(),
        this.getMeasurementRecords(),
        this.getUserProfile(),
        this.getGoals(),
        this.getSettings(),
      ]);

      const data = {
        weightRecords,
        measurementRecords,
        userProfile,
        goals,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0',
        metadata: {
          totalRecords: weightRecords.length + measurementRecords.length,
          exportDuration: Date.now() - startTime,
        },
      };

      const jsonString = JSON.stringify(data, null, 2);
      const duration = Date.now() - startTime;
      console.log(`✅ Data exported (${duration}ms, ${Math.round(jsonString.length / 1024)}KB)`);

      return jsonString;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Export failed (${duration}ms):`, error);
      throw error;
    }
  }

  async importData(jsonData: string): Promise<void> {
    const startTime = Date.now();
    console.log('📥 Importing data...');

    try {
      const data = JSON.parse(jsonData);

      // Validar versão
      if (data.version && data.version !== '1.0') {
        console.warn('⚠️ Import data version mismatch:', data.version);
      }

      // Limpar cache antes do import
      this.cache.clear();

      // Usar batch operations para melhor performance
      const operations: Promise<void>[] = [];

      if (data.weightRecords) {
        operations.push(this.setItem(STORAGE_KEYS.WEIGHT_RECORDS, data.weightRecords));
      }
      if (data.measurementRecords) {
        operations.push(this.setItem(STORAGE_KEYS.MEASUREMENT_RECORDS, data.measurementRecords));
      }
      if (data.userProfile) {
        operations.push(this.setItem(STORAGE_KEYS.USER_PROFILE, data.userProfile));
      }
      if (data.goals) {
        operations.push(this.setItem(STORAGE_KEYS.GOALS, data.goals));
      }
      if (data.settings) {
        operations.push(this.setItem(STORAGE_KEYS.SETTINGS, data.settings));
      }

      await Promise.all(operations);

      const duration = Date.now() - startTime;
      const totalRecords = data.metadata?.totalRecords || 'unknown';
      console.log(`✅ Data imported successfully (${duration}ms, ${totalRecords} records)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Import failed (${duration}ms):`, error);
      throw error;
    }
  }

  // Método para pré-carregar dados importantes
  async preloadData(): Promise<void> {
    try {
      console.log('🚀 Starting preload...');

      // Pré-carregar dados críticos em paralelo
      await Promise.all([
        this.getUserProfile().catch(() => null),
        this.getWeightRecords().catch(() => []),
        this.getGoals().catch(() => []),
        this.getSettings().catch(() => null),
      ]);

      console.log('✅ Preload completed');
    } catch (error) {
      console.error('❌ Preload failed:', error);
      throw error;
    }
  }

  // Método para otimizar storage
  async optimizeStorage(): Promise<void> {
    console.log('🔧 Optimizing storage...');
    const startTime = Date.now();

    try {
      // Limpar cache
      this.cache.clear();

      // Forçar execução de batch pendente
      await this.flushBatch();

      // Recarregar dados críticos
      await this.preloadData();

      const duration = Date.now() - startTime;
      console.log(`✅ Storage optimization completed (${duration}ms)`);
    } catch (error) {
      console.error('❌ Storage optimization failed:', error);
      throw error;
    }
  }

  // Estatísticas do storage com mais detalhes
  async getStorageStats(): Promise<{
    cache: { size: number; hitRate: number; memoryUsage: string; totalRequests: number };
    storage: { weightRecords: number; measurementRecords: number; totalSize: string; goals: number };
    performance: { totalOperations: number; averageResponseTime: number; errorCount: number; errorRate: string };
  }> {
    try {
      const cacheStats = this.cache.getStats();

      const [weightRecords, measurementRecords, goals] = await Promise.all([
        this.getWeightRecords(),
        this.getMeasurementRecords(),
        this.getGoals(),
      ]);

      const totalData = { weightRecords, measurementRecords, goals };
      const totalSize = JSON.stringify(totalData).length;

      const errorRate = this.performanceMetrics.totalOperations > 0
        ? `${Math.round((this.performanceMetrics.errorCount / this.performanceMetrics.totalOperations) * 100)}%`
        : '0%';

      return {
        cache: cacheStats,
        storage: {
          weightRecords: weightRecords.length,
          measurementRecords: measurementRecords.length,
          goals: goals.length,
          totalSize: `${Math.round(totalSize / 1024)}KB`,
        },
        performance: {
          ...this.performanceMetrics,
          averageResponseTime: Math.round(this.performanceMetrics.averageResponseTime),
          errorRate,
        },
      };
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      throw error;
    }
  }

  // Health check do storage
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      const stats = await this.getStorageStats();

      // Check cache hit rate
      if (stats.cache.hitRate < 50) {
        issues.push(`Low cache hit rate: ${stats.cache.hitRate}%`);
        suggestions.push('Consider increasing cache TTL or checking data access patterns');
      }

      // Check error rate
      const errorRate = parseFloat(stats.performance.errorRate);
      if (errorRate > 5) {
        issues.push(`High error rate: ${stats.performance.errorRate}`);
        suggestions.push('Check storage permissions and available disk space');
      }

      // Check response time
      if (stats.performance.averageResponseTime > 1000) {
        issues.push(`Slow response time: ${stats.performance.averageResponseTime}ms`);
        suggestions.push('Consider optimizing data structure or clearing cache');
      }

      // Check memory usage
      const memorySizeKB = parseInt(stats.cache.memoryUsage.replace('KB', ''));
      if (memorySizeKB > 5000) { // 5MB
        issues.push(`High memory usage: ${stats.cache.memoryUsage}`);
        suggestions.push('Consider reducing cache size or TTL');
      }

      const status = issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'warning' : 'error';

      return { status, issues, suggestions };
    } catch (error) {
      return {
        status: 'error',
        issues: ['Storage health check failed'],
        suggestions: ['Check storage service connection and permissions'],
      };
    }
  }
  async logError(errorLog: any): Promise<void> {
    try {
      const existingLogs = await this.getErrorLogs();
      const updatedLogs = [errorLog, ...existingLogs].slice(0, 100); // Manter últimos 100
      await this.setItem('@leve_plus:error_logs', updatedLogs);
      console.log('📝 Error logged successfully');
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }
  async getErrorLogs(): Promise<any[]> {
    try {
      const logs = await this.getItem<any[]>('@leve_plus:error_logs');
      return logs || [];
    } catch (error) {
      console.error('Failed to get error logs:', error);
      return [];
    }
  }

  async clearErrorLogs(): Promise<void> {
    try {
      await this.removeItem('@leve_plus:error_logs');
      console.log('🧹 Error logs cleared');
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }

  async saveErrorLogs(logs: any[]): Promise<void> {
    try {
      await this.setItem('@leve_plus:error_logs', logs);
    } catch (error) {
      console.error('Failed to save error logs:', error);
    }
  }

  // Método para limpar cache (usado no error boundary)
  clearCache(): void {
    if (this.cache && typeof this.cache.clear === 'function') {
      this.cache.clear();
      console.log('🧹 Cache cleared by error boundary');
    }
  }


  // Health check com error logs
  async getErrorStats(): Promise<{
    totalErrors: number;
    recentErrors: number;
    criticalErrors: number;
    errorRate: string;
  }> {
    try {
      const logs = await this.getErrorLogs();
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      const recentErrors = logs.filter(log =>
        new Date(log.timestamp).getTime() > oneDayAgo
      ).length;

      const criticalErrors = logs.filter(log =>
        log.level === 'app' || log.error?.name === 'TypeError'
      ).length;

      const totalOperations = this.performanceMetrics.totalOperations;
      const errorRate = totalOperations > 0
        ? `${Math.round((logs.length / totalOperations) * 100)}%`
        : '0%';

      return {
        totalErrors: logs.length,
        recentErrors,
        criticalErrors,
        errorRate,
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        totalErrors: 0,
        recentErrors: 0,
        criticalErrors: 0,
        errorRate: '0%',
      };
    }
  }

}

export const storageService = new StorageService();