export interface PerformanceMetrics {
  memoryUsage: string;
  cpuLoad: string;
  appUptime: string;
  networkLatency: string;
  adminStatus: string;
}

export interface DisplayMetric {
  color: string;
  icon: string;
  label: string;
  value: string | number;
  unit: string;
  trend: number;
}

export interface ApiEndpointLog {
  path: string;
  method: string;
  lastContacted: Date | null;
  lastPing: Date | null;
  status: string;
  hitCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  firstSeen: Date;
  timelineData: {
    timestamp: Date;
    responseTime: number;
    status: number;
    requestBody?: unknown;
    responseBody?: unknown;
    headers?: unknown;
  }[];
}
