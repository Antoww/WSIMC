import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChartDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  temperature?: number;
}

interface RealtimeChartsProps {
  data: ChartDataPoint[];
}

export const RealtimeCharts: React.FC<RealtimeChartsProps> = ({ data }) => {
  const formatTooltipTime = (value: string) => {
    try {
      const date = new Date(value);
      return format(date, 'HH:mm:ss', { locale: fr });
    } catch {
      return value;
    }
  };

  return (
    <div className="metric-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Performance Temps Réel
        </h3>
        <div className="text-sm text-gray-600">
          {data.length} / 50 points de données
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTooltipTime}
            stroke="#6b7280"
            fontSize={12}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={12}
            domain={[0, 100]}
          />
          <Tooltip 
            labelFormatter={formatTooltipTime}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}%`, 
              name === 'cpu' ? 'CPU' : 'Mémoire'
            ]}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="cpu"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.4}
            name="CPU"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="memory"
            stackId="2"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.4}
            name="Mémoire"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>CPU (%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Mémoire (%)</span>
        </div>
      </div>
    </div>
  );
};

export default RealtimeCharts;
