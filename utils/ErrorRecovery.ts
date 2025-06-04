export interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  context: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  deviceInfo: {
    userAgent: string;
    timestamp: number;
  };
  retryCount: number;
}

export interface ErrorReport {
  errorId: string;
  timestamp: string;
  level: 'app' | 'screen' | 'component';
  component?: string;
  error: {
    name?: string;
    message?: string;
    stack?: string;
  };
  componentStack?: string;
  deviceInfo: {
    userAgent: string;
    timestamp: number;
  };
}

export interface ErrorStats {
  totalErrors: number;
  recentErrors: number;
  criticalErrors: number;
  errorRate: string;
}