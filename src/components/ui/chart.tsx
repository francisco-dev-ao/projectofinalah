
import * as React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface ChartProps {
  options?: ApexOptions;
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  type: "line" | "area" | "bar" | "pie" | "donut" | "radialBar" | "scatter" | "bubble" | "heatmap" | "candlestick" | "boxPlot" | "radar" | "polarArea" | "rangeBar" | "rangeArea" | "treemap";
  height?: number | string;
  width?: number | string;
}

export const Chart = React.forwardRef<any, ChartProps>(({ options = {}, series, type, height = 350, width = "100%" }, ref) => {
  const chartRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  // Default options for all charts
  const defaultOptions: ApexOptions = {
    chart: {
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      fontFamily: 'inherit',
      animations: {
        enabled: false, // Disable animations to prevent DOM issues
      },
      redrawOnParentResize: true,
      redrawOnWindowResize: true,
    },
    colors: ['#0ea5e9', '#84cc16', '#f59e0b', '#ef4444', '#8b5cf6'],
    grid: {
      borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      labels: {
        style: {
          fontSize: '12px',
          fontFamily: 'inherit',
        },
      },
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          fontFamily: 'inherit',
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontFamily: 'inherit',
      fontSize: '13px',
    },
    tooltip: {
      theme: 'light',
    },
  };

  // Merge default options with provided options
  const mergedOptions = React.useMemo(() => ({
    ...defaultOptions,
    ...options,
    chart: {
      ...defaultOptions.chart,
      ...options.chart,
      type,
    },
  }), [options, type]);

  // Validate and sanitize series data to match ApexCharts types
  const validSeries = React.useMemo(() => {
    if (!series || (Array.isArray(series) && series.length === 0)) {
      return [];
    }
    
    // For non-axis charts (pie, donut, radialBar)
    if (['pie', 'donut', 'radialBar'].includes(type)) {
      if (Array.isArray(series) && series.every(item => typeof item === 'number')) {
        return series as ApexNonAxisChartSeries;
      }
      return [];
    }
    
    // For axis charts - ensure series is an array of objects with proper structure
    if (Array.isArray(series)) {
      const filteredSeries = series.filter(item => 
        item && 
        typeof item === 'object' && 
        'data' in item &&
        Array.isArray(item.data)
      );
      return filteredSeries.length > 0 ? filteredSeries as ApexAxisChartSeries : [];
    }
    
    return [];
  }, [series, type]);

  // Track mount state
  React.useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      setIsReady(false);
    };
  }, []);

  // Only render when we have valid data and component is mounted
  React.useEffect(() => {
    if (validSeries && validSeries.length > 0 && isMounted && containerRef.current) {
      // Add a small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        if (isMounted && containerRef.current) {
          setIsReady(true);
        }
      }, 100);
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      setIsReady(false);
    }
  }, [validSeries, isMounted]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (chartRef.current) {
        try {
          if (chartRef.current.chart && typeof chartRef.current.chart.destroy === 'function') {
            chartRef.current.chart.destroy();
          }
        } catch (error) {
          // Silently ignore cleanup errors
        }
      }
    };
  }, []);

  // Handle ref assignment
  React.useImperativeHandle(ref, () => chartRef.current, []);

  if (!isMounted || !isReady || !validSeries || validSeries.length === 0) {
    return (
      <div 
        ref={containerRef}
        className="w-full flex items-center justify-center bg-gray-50 rounded-lg" 
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <p className="text-gray-500 text-sm">Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <ReactApexChart
        options={mergedOptions}
        series={validSeries}
        type={type}
        height={height}
        width={width}
      />
    </div>
  );
});

Chart.displayName = "Chart";

export default Chart;
