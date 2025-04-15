/**
 * Performance metrics utility for measuring and tracking application performance
 */

// Performance metric types
export type PerformanceMetric = {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: number;
};

// Performance metrics storage
class PerformanceMetrics {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private maxMetricsPerKey = 100;
  
  /**
   * Record a performance metric
   * @param name Metric name
   * @param value Metric value
   * @param unit Metric unit
   */
  record(name: string, value: number, unit: PerformanceMetric['unit'] = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metrics = this.metrics.get(name)!;
    metrics.push(metric);
    
    // Limit the number of metrics stored
    if (metrics.length > this.maxMetricsPerKey) {
      metrics.shift();
    }
  }
  
  /**
   * Get metrics by name
   * @param name Metric name
   * @returns Array of metrics
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }
  
  /**
   * Get the average value of a metric
   * @param name Metric name
   * @returns Average value
   */
  getAverage(name: string): number | null {
    const metrics = this.getMetrics(name);
    
    if (metrics.length === 0) {
      return null;
    }
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }
  
  /**
   * Clear all metrics
   */
  clearAll(): void {
    this.metrics.clear();
  }
  
  /**
   * Clear metrics by name
   * @param name Metric name
   */
  clear(name: string): void {
    this.metrics.delete(name);
  }
  
  /**
   * Get all metric names
   * @returns Array of metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }
  
  /**
   * Get a summary of all metrics
   * @returns Object with metric summaries
   */
  getSummary(): Record<string, { average: number; min: number; max: number; count: number; unit: PerformanceMetric['unit'] }> {
    const summary: Record<string, { average: number; min: number; max: number; count: number; unit: PerformanceMetric['unit'] }> = {};
    
    // Use Array.from to convert Map.entries() to an array for better compatibility
    Array.from(this.metrics.entries()).forEach(([name, metrics]) => {
      if (metrics.length === 0) {
        return; // Skip empty metrics
      }
      
      const values = metrics.map((m: PerformanceMetric) => m.value);
      const unit = metrics[0].unit;
      
      summary[name] = {
        average: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: metrics.length,
        unit,
      };
    });
    
    return summary;
  }
}

// Create singleton instance
export const performanceMetrics = new PerformanceMetrics();

/**
 * Measure the execution time of a function
 * @param name Metric name
 * @param fn Function to measure
 * @returns Function result
 */
export function measure<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  performanceMetrics.record(name, end - start, 'ms');
  
  return result;
}

/**
 * Create a performance measurement wrapper for a function
 * @param name Metric name
 * @param fn Function to wrap
 * @returns Wrapped function
 */
export function measureFunction<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = fn(...args);
    
    // Handle promises
    if (result instanceof Promise) {
      return result.then((value) => {
        const end = performance.now();
        performanceMetrics.record(name, end - start, 'ms');
        return value;
      }) as ReturnType<T>;
    }
    
    const end = performance.now();
    performanceMetrics.record(name, end - start, 'ms');
    return result;
  };
}

/**
 * Measure component render time using React profiler
 * @param id Component ID
 * @param phase Render phase
 * @param actualDuration Actual render duration
 */
export function measureRender(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
): void {
  performanceMetrics.record(`render.${id}.${phase}`, actualDuration, 'ms');
}

/**
 * Measure memory usage
 * @returns Memory usage in MB
 */
export function measureMemory(): Promise<number> {
  if (window.performance && 'memory' in window.performance) {
    const memory = (window.performance as any).memory;
    const usedHeapSize = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    
    performanceMetrics.record('memory.heap', usedHeapSize, 'bytes');
    return Promise.resolve(usedHeapSize);
  }
  
  return Promise.resolve(0);
}

export default performanceMetrics;
