import React, { useState, useEffect } from 'react';
import { performanceMetrics, PerformanceMetric } from '@/lib/performance-metrics';

interface PerformanceMonitorProps {
  refreshInterval?: number; // in milliseconds
}

/**
 * Performance Monitor component to display performance metrics
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  refreshInterval = 5000,
}) => {
  const [metrics, setMetrics] = useState<Record<string, { average: number; min: number; max: number; count: number; unit: PerformanceMetric['unit'] }>>({});
  const [isVisible, setIsVisible] = useState(false);

  // Update metrics on interval
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMetrics.getSummary());
    };

    // Initial update
    updateMetrics();

    // Set up interval
    const intervalId = setInterval(updateMetrics, refreshInterval);

    // Clean up
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Format metric value based on unit
  const formatMetricValue = (value: number, unit: PerformanceMetric['unit']) => {
    switch (unit) {
      case 'ms':
        return `${value.toFixed(2)} ms`;
      case 'bytes':
        return `${value.toFixed(2)} MB`;
      case 'percent':
        return `${value.toFixed(2)}%`;
      case 'count':
        return value.toFixed(0);
      default:
        return value.toString();
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-2 rounded-md text-xs shadow-md"
      >
        Show Performance
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-md shadow-lg p-4 max-w-md max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Performance Metrics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>

      {Object.keys(metrics).length === 0 ? (
        <p className="text-sm text-muted-foreground">No metrics recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(metrics).map(([name, data]) => (
            <div key={name} className="border-t pt-2">
              <h4 className="font-medium text-sm">{name}</h4>
              <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Avg: </span>
                  <span>{formatMetricValue(data.average, data.unit)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Min: </span>
                  <span>{formatMetricValue(data.min, data.unit)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max: </span>
                  <span>{formatMetricValue(data.max, data.unit)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Count: </span>
                  <span>{data.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => performanceMetrics.clearAll()}
          className="text-xs text-destructive hover:underline"
        >
          Clear All Metrics
        </button>
        <button
          onClick={() => setMetrics(performanceMetrics.getSummary())}
          className="text-xs text-primary hover:underline"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default React.memo(PerformanceMonitor);
