import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Activity,
  Users,
  Clock,
  ThumbsUp,
  Target
} from 'lucide-react';

// 简单的图表组件（使用CSS实现基础可视化）
interface ChartProps {
  data: any[];
  title: string;
  className?: string;
}

// 柱状图组件
export const BarChart: React.FC<ChartProps & { 
  xKey: string; 
  yKey: string; 
  color?: string;
  maxValue?: number;
}> = ({ data, title, xKey, yKey, color = '#3B82F6', maxValue, className = '' }) => {
  const max = maxValue || Math.max(...data.map(item => item[yKey]));
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2" />
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-20 text-sm text-gray-600 truncate mr-3">
              {item[xKey]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 mr-3">
              <div
                className="h-6 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(item[yKey] / max) * 100}%`,
                  backgroundColor: color
                }}
              ></div>
            </div>
            <div className="w-16 text-sm font-medium text-gray-900 text-right">
              {item[yKey]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 折线图组件
export const LineChart: React.FC<ChartProps & { 
  xKey: string; 
  yKey: string; 
  color?: string;
  maxValue?: number;
}> = ({ data, title, xKey, yKey, color = '#3B82F6', maxValue, className = '' }) => {
  const max = maxValue || Math.max(...data.map(item => item[yKey]));
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2" />
        {title}
      </h3>
      <div className="h-64 relative">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 380 + 10;
            const y = 190 - ((item[yKey] / max) * 160) + 10;
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color}
                  className="hover:r-6 transition-all duration-200"
                />
                {index < data.length - 1 && (
                  <line
                    x1={x}
                    y1={y}
                    x2={(index + 1) / (data.length - 1) * 380 + 10}
                    y2={190 - ((data[index + 1][yKey] / max) * 160) + 10}
                    stroke={color}
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          {data.map((item, index) => (
            <span key={index}>{item[xKey]}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// 饼图组件
export const PieChart: React.FC<ChartProps & { 
  labelKey: string; 
  valueKey: string; 
  colors?: string[];
}> = ({ data, title, labelKey, valueKey, colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'], className = '' }) => {
  const total = data.reduce((sum, item) => sum + item[valueKey], 0);
  let cumulativePercentage = 0;
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <PieChartIcon className="h-5 w-5 mr-2" />
        {title}
      </h3>
      <div className="flex items-center">
        <div className="w-32 h-32 relative mr-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item[valueKey] / total) * 100;
              const startAngle = cumulativePercentage * 3.6;
              const endAngle = (cumulativePercentage + percentage) * 3.6;
              cumulativePercentage += percentage;
              
              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;
              
              const largeArcFlag = percentage > 50 ? 1 : 0;
              const x1 = 50 + 40 * Math.cos(startAngleRad);
              const y1 = 50 + 40 * Math.sin(startAngleRad);
              const x2 = 50 + 40 * Math.cos(endAngleRad);
              const y2 = 50 + 40 * Math.sin(endAngleRad);
              
              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  className="hover:opacity-80 transition-opacity duration-200"
                />
              );
            })}
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, index) => {
            const percentage = ((item[valueKey] / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="text-sm text-gray-600 flex-1">{item[labelKey]}</span>
                <span className="text-sm font-medium text-gray-900">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 指标卡片组件
export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, trend, subtitle }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-1">
              <span className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs 上期</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 热力图组件
export const HeatmapChart: React.FC<ChartProps & {
  xKey: string;
  yKey: string;
  valueKey: string;
  maxValue?: number;
}> = ({ data, title, xKey, yKey, valueKey, maxValue, className = '' }) => {
  const max = maxValue || Math.max(...data.map(item => item[valueKey]));
  const xValues = [...new Set(data.map(item => item[xKey]))];
  const yValues = [...new Set(data.map(item => item[yKey]))];
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Activity className="h-5 w-5 mr-2" />
        {title}
      </h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-2 py-1 text-xs text-gray-500"></th>
                {xValues.map(x => (
                  <th key={x} className="px-2 py-1 text-xs text-gray-500 text-center">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yValues.map(y => (
                <tr key={y}>
                  <td className="px-2 py-1 text-xs text-gray-500 text-right">
                    {y}
                  </td>
                  {xValues.map(x => {
                    const item = data.find(d => d[xKey] === x && d[yKey] === y);
                    const intensity = item ? (item[valueKey] / max) * 100 : 0;
                    
                    return (
                      <td key={`${x}-${y}`} className="px-2 py-1">
                        <div
                          className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-medium"
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${intensity / 100})`,
                            color: intensity > 50 ? 'white' : 'black'
                          }}
                        >
                          {item ? item[valueKey] : '-'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 进度条组件
export const ProgressBar: React.FC<{
  value: number;
  max: number;
  label: string;
  color?: string;
  showPercentage?: boolean;
}> = ({ value, max, label, color = '#3B82F6', showPercentage = true }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        ></div>
      </div>
    </div>
  );
};

// 统计表格组件
export const StatsTable: React.FC<{
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  title?: string;
  className?: string;
}> = ({ data, columns, title, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map(column => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 时间轴组件
export const Timeline: React.FC<{
  events: Array<{
    time: string;
    title: string;
    description?: string;
    status: 'success' | 'warning' | 'error' | 'info';
  }>;
  title?: string;
  className?: string;
}> = ({ events, title, className = '' }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      )}
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="flex items-start">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)} mt-2 mr-4 flex-shrink-0`}></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                <span className="text-xs text-gray-500">{event.time}</span>
              </div>
              {event.description && (
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
