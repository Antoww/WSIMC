import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Wifi,
  RefreshCw,
  Activity,
  Info,
  Thermometer,
  TrendingUp,
  Zap,
  Users,
  Moon,
  Sun
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RealtimeCharts } from './components/Charts';
import { ProcessWindow } from './components/ProcessWindow';
import { dataCache } from './services/dataCache';
import './index.css';

// Types
interface SystemInfo {
  name: string;
  os_version: string;
  kernel_version: string;
  hostname: string;
  uptime: number;
  boot_time: number;
}

interface CpuInfo {
  name: string;
  brand: string;
  usage: number;
  frequency: number;
  cores: number;
  physical_cores: number;
}

interface MemoryInfo {
  total: number;
  used: number;
  available: number;
  usage_percent: number;
  swap_total: number;
  swap_used: number;
}

interface DiskInfo {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  used_space: number;
  usage_percent: number;
  file_system: string;
}

interface RealtimeStats {
  cpu_usage: number;
  memory_usage: number;
  memory_used_gb: number;
  memory_total_gb: number;
}

interface ExtendedRealtimeStats {
  cpu_usage: number;
  memory_usage: number;
  memory_used_gb: number;
  memory_total_gb: number;
  temperatures: TemperatureInfo[];
  network_activity: Record<string, [number, number]>;
  top_processes: ProcessInfo[];
  timestamp: string;
}

interface TemperatureInfo {
  component: string;
  temperature: number;
  max_temperature?: number;
  critical_temperature?: number;
}

interface ProcessInfo {
  name: string;
  pid: number;
  cpu_usage: number;
  memory: number;
}

interface ChartDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  temperature?: number;
}

// Utility functions
const formatBytes = (bytes: number): string => {
  const gb = bytes / (1024 ** 3);
  return gb < 1 ? `${(bytes / (1024 ** 2)).toFixed(0)}MB` : `${gb.toFixed(1)}GB`;
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

// Components
const MetricCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isDarkMode?: boolean;
}> = ({ title, icon, children, className = "", isDarkMode = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`backdrop-blur-sm rounded-xl border shadow-lg p-6 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gray-800/50 border-gray-700/50' 
        : 'bg-white/50 border-white/50'
    } ${className}`}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-lg transition-colors duration-200 ${
        isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
      }`}>
        {icon}
      </div>
      <h3 className={`text-lg font-semibold transition-colors duration-200 ${
        isDarkMode ? 'text-gray-200' : 'text-gray-800'
      }`}>{title}</h3>
    </div>
    {children}
  </motion.div>
);

const ProgressBar: React.FC<{ value: number; max?: number; color?: string }> = ({ 
  value, 
  max = 100, 
  color = "blue" 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClass = color === "red" ? "from-red-500 to-red-600" : 
                    color === "yellow" ? "from-yellow-500 to-yellow-600" :
                    "from-blue-500 to-blue-600";
  
  return (
    <div className="progress-bar">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
      />
    </div>
  );
};

const RealtimeMonitor: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [extendedStats, setExtendedStats] = useState<ExtendedRealtimeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const fetchRealtimeStats = async () => {
    try {
      setIsLoading(true);
      const [basicResult, extendedResult] = await Promise.all([
        invoke<RealtimeStats>('get_real_time_stats'),
        invoke<ExtendedRealtimeStats>('get_extended_realtime_stats')
      ]);
      
      setStats(basicResult);
      setExtendedStats(extendedResult);

      // Ajouter au graphique
      const avgTemp = extendedResult.temperatures.length > 0 
        ? extendedResult.temperatures.reduce((acc, temp) => acc + temp.temperature, 0) / extendedResult.temperatures.length
        : undefined;

      const newDataPoint: ChartDataPoint = {
        timestamp: new Date(extendedResult.timestamp).toISOString(),
        cpu: extendedResult.cpu_usage,
        memory: extendedResult.memory_usage,
        temperature: avgTemp
      };

      setChartData(prev => {
        const newData = [...prev, newDataPoint];
        return newData.slice(-20); // Garder les 20 derniers points
      });

    } catch (error) {
      console.error('Error fetching realtime stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeStats();
    const interval = setInterval(fetchRealtimeStats, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!stats || !extendedStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="metric-card animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
      <div className="space-y-8">
        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Processeur" icon={<Cpu size={20} />} isDarkMode={isDarkMode}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Utilisation</span>
                <span className={`text-lg font-bold transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {extendedStats.cpu_usage.toFixed(1)}%
                </span>
              </div>
              <ProgressBar 
                value={extendedStats.cpu_usage} 
                color={extendedStats.cpu_usage > 80 ? "red" : extendedStats.cpu_usage > 60 ? "yellow" : "blue"} 
              />
            </div>
          </MetricCard>

          <MetricCard title="Mémoire" icon={<MemoryStick size={20} />} isDarkMode={isDarkMode}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Utilisation</span>
                <span className={`text-lg font-bold transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {extendedStats.memory_usage.toFixed(1)}%
                </span>
              </div>
              <ProgressBar 
                value={extendedStats.memory_usage} 
                color={extendedStats.memory_usage > 80 ? "red" : extendedStats.memory_usage > 60 ? "yellow" : "blue"} 
              />
              <div className={`text-sm transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {extendedStats.memory_used_gb.toFixed(1)} GB / {extendedStats.memory_total_gb.toFixed(1)} GB
              </div>
            </div>
          </MetricCard>

          {extendedStats.temperatures.length > 0 && (
            <MetricCard title="Température" icon={<Thermometer size={20} />} isDarkMode={isDarkMode}>
              <div className="space-y-2">
                {extendedStats.temperatures.slice(0, 2).map((temp, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className={`text-sm font-medium truncate transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {temp.component.replace(/^.*\\/, '').substring(0, 12)}
                    </span>
                    <span className={`text-sm font-bold ${
                      temp.temperature > 80 ? 'text-red-500' : 
                      temp.temperature > 65 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {temp.temperature.toFixed(1)}°C
                    </span>
                  </div>
                ))}
              </div>
            </MetricCard>
          )}

          <MetricCard title="Processus Actifs" icon={<Zap size={20} />} isDarkMode={isDarkMode}>
            <div className="space-y-2">
              {extendedStats.top_processes.slice(0, 3).map((proc, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className={`text-sm font-medium truncate transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {proc.name.length > 12 ? proc.name.substring(0, 12) + '...' : proc.name}
                  </span>
                  <span className={`text-sm font-bold transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {proc.cpu_usage.toFixed(1)}%
                  </span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className={`text-xs text-center transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Voir l'onglet "Processus" pour plus de détails
                </div>
              </div>
            </div>
          </MetricCard>
        </div>      {/* Graphiques */}
      <RealtimeCharts data={chartData} />

      {/* Activité réseau */}
      {Object.keys(extendedStats.network_activity).length > 0 && (
        <MetricCard 
          title="Activité Réseau" 
          icon={<Wifi size={20} />}
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(extendedStats.network_activity).slice(0, 4).map(([name, [received, transmitted]], index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-800 mb-2">{name}</div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>↓ {formatBytes(received)}</span>
                  <span>↑ {formatBytes(transmitted)}</span>
                </div>
              </div>
            ))}
          </div>
        </MetricCard>
      )}
    </div>
  );
};

const ProcessPage: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'name'>('cpu');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProcesses = async () => {
    try {
      setIsLoading(true);
      const result = await invoke<ProcessInfo[]>('get_top_processes');
      setProcesses(result);
    } catch (error) {
      console.error('Error fetching processes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredAndSortedProcesses = processes
    .filter(process => 
      process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.pid.toString().includes(searchTerm)
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'cpu':
          comparison = a.cpu_usage - b.cpu_usage;
          break;
        case 'memory':
          comparison = a.memory - b.memory;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (column: 'cpu' | 'memory' | 'name') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête de la page processus */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold transition-colors duration-200 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            Gestionnaire des Processus
          </h2>
          <p className={`text-sm transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {processes.length} processus actifs • Mise à jour toutes les 3 secondes
          </p>
        </div>
        
        {/* Recherche */}
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un processus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 pr-4 py-2 rounded-lg border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-600 text-gray-200 placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
            }`}
          />
          <Activity size={20} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
        </div>
      </div>

      {/* Tableau des processus */}
      <MetricCard title="" icon={null} isDarkMode={isDarkMode} className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b transition-colors duration-200 ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <th 
                  onClick={() => handleSort('name')}
                  className={`text-left p-4 font-semibold cursor-pointer hover:bg-opacity-50 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    Processus
                    {sortBy === 'name' && (
                      sortOrder === 'desc' ? '↓' : '↑'
                    )}
                  </div>
                </th>
                <th className={`text-left p-4 font-semibold transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  PID
                </th>
                <th 
                  onClick={() => handleSort('cpu')}
                  className={`text-right p-4 font-semibold cursor-pointer hover:bg-opacity-50 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-end gap-2">
                    CPU %
                    {sortBy === 'cpu' && (
                      sortOrder === 'desc' ? '↓' : '↑'
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('memory')}
                  className={`text-right p-4 font-semibold cursor-pointer hover:bg-opacity-50 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-end gap-2">
                    Mémoire
                    {sortBy === 'memory' && (
                      sortOrder === 'desc' ? '↓' : '↑'
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <tr key={index} className={`border-b transition-colors duration-200 ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <td className="p-4">
                      <div className={`h-4 rounded animate-pulse ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                    </td>
                    <td className="p-4">
                      <div className={`h-4 w-16 rounded animate-pulse ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                    </td>
                    <td className="p-4">
                      <div className={`h-4 w-12 rounded animate-pulse ml-auto ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                    </td>
                    <td className="p-4">
                      <div className={`h-4 w-20 rounded animate-pulse ml-auto ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredAndSortedProcesses.map((process, index) => (
                  <tr 
                    key={`${process.pid}-${index}`}
                    className={`border-b transition-colors duration-200 hover:bg-opacity-50 ${
                      isDarkMode 
                        ? 'border-gray-700 hover:bg-gray-700' 
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          process.cpu_usage > 5 ? 'bg-red-500' : 
                          process.cpu_usage > 1 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className={`font-medium transition-colors duration-200 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {process.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm font-mono transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {process.pid}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-semibold ${
                        process.cpu_usage > 10 ? 'text-red-500' : 
                        process.cpu_usage > 5 ? 'text-yellow-500' : 
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {process.cpu_usage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-medium transition-colors duration-200 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {formatBytes(process.memory)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </MetricCard>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg transition-colors duration-200 ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-blue-50'
        }`}>
          <div className={`text-sm font-medium transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-blue-600'
          }`}>Total Processus</div>
          <div className={`text-2xl font-bold transition-colors duration-200 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>{processes.length}</div>
        </div>
        
        <div className={`p-4 rounded-lg transition-colors duration-200 ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-green-50'
        }`}>
          <div className={`text-sm font-medium transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-green-600'
          }`}>Processus Actifs</div>
          <div className={`text-2xl font-bold transition-colors duration-200 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>{processes.filter(p => p.cpu_usage > 1).length}</div>
        </div>

        <div className={`p-4 rounded-lg transition-colors duration-200 ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-yellow-50'
        }`}>
          <div className={`text-sm font-medium transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-yellow-600'
          }`}>CPU Moyen</div>
          <div className={`text-2xl font-bold transition-colors duration-200 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            {processes.length > 0 ? (processes.reduce((acc, p) => acc + p.cpu_usage, 0) / processes.length).toFixed(1) : '0.0'}%
          </div>
        </div>

        <div className={`p-4 rounded-lg transition-colors duration-200 ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-red-50'
        }`}>
          <div className={`text-sm font-medium transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-red-600'
          }`}>Mémoire Totale</div>
          <div className={`text-2xl font-bold transition-colors duration-200 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            {formatBytes(processes.reduce((acc, p) => acc + p.memory, 0))}
          </div>
        </div>
      </div>
    </div>
  );
};
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [cpuInfo, setCpuInfo] = useState<CpuInfo | null>(null);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [diskInfo, setDiskInfo] = useState<DiskInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllInfo = async () => {
    try {
      setIsLoading(true);
      const [system, cpu, memory, disks] = await Promise.all([
        invoke<SystemInfo>('get_system_info'),
        invoke<CpuInfo>('get_cpu_info'),
        invoke<MemoryInfo>('get_memory_info'),
        invoke<DiskInfo[]>('get_disk_info'),
      ]);
      
      setSystemInfo(system);
      setCpuInfo(cpu);
      setMemoryInfo(memory);
      setDiskInfo(disks);
    } catch (error) {
      console.error('Error fetching system info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="metric-card animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Info */}
      {systemInfo && (
        <MetricCard title="Informations Système" icon={<Monitor size={20} />} isDarkMode={isDarkMode}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Système:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{systemInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Version:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{systemInfo.os_version}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Nom PC:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{systemInfo.hostname}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Uptime:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{formatUptime(systemInfo.uptime)}</span>
            </div>
          </div>
        </MetricCard>
      )}

      {/* CPU Info */}
      {cpuInfo && (
        <MetricCard title="Processeur" icon={<Cpu size={20} />} isDarkMode={isDarkMode}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Modèle:</span>
              <span className={`font-medium text-right transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{cpuInfo.brand}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Utilisation:</span>
              <span className="font-medium text-blue-400">{cpuInfo.usage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Cœurs:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{cpuInfo.cores} ({cpuInfo.physical_cores} physiques)</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Fréquence:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{cpuInfo.frequency} MHz</span>
            </div>
          </div>
        </MetricCard>
      )}

      {/* Memory Info */}
      {memoryInfo && (
        <MetricCard title="Mémoire" icon={<MemoryStick size={20} />} isDarkMode={isDarkMode}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Utilisation:</span>
              <span className="font-medium text-blue-400">{memoryInfo.usage_percent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Total:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{formatBytes(memoryInfo.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Utilisée:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{formatBytes(memoryInfo.used)}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Disponible:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{formatBytes(memoryInfo.available)}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Swap:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {formatBytes(memoryInfo.swap_total)}
                {memoryInfo.swap_total > 0 && memoryInfo.swap_used > 0 && (
                  <span className="text-blue-400 ml-2">
                    ({((memoryInfo.swap_used / memoryInfo.swap_total) * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          </div>
        </MetricCard>
      )}

      {/* Disks */}
      {diskInfo.length > 0 && (
        <MetricCard 
          title="Stockage" 
          icon={<HardDrive size={20} />}
          className="lg:col-span-2"
          isDarkMode={isDarkMode}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diskInfo.map((disk, index) => (
              <div key={index} className={`p-4 rounded-lg transition-colors duration-200 ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-medium transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>{disk.mount_point}</span>
                  <span className={`text-sm transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{disk.file_system}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-400">
                    {disk.usage_percent.toFixed(1)}% utilisé
                  </span>
                </div>
                <ProgressBar value={disk.usage_percent} />
                <div className={`flex justify-between text-xs mt-1 transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <span>{formatBytes(disk.used_space)} utilisé</span>
                  <span>{formatBytes(disk.total_space)} total</span>
                </div>
              </div>
            ))}
          </div>
        </MetricCard>
      )}
    </div>
  );
};

const SystemOverview: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [cpuInfo, setCpuInfo] = useState<CpuInfo | null>(null);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [diskInfo, setDiskInfo] = useState<DiskInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllInfo = async () => {
    try {
      setIsLoading(true);
      const [system, cpu, memory, disks] = await Promise.all([
        invoke<SystemInfo>('get_system_info'),
        invoke<CpuInfo>('get_cpu_info'),
        invoke<MemoryInfo>('get_memory_info'),
        invoke<DiskInfo[]>('get_disk_info'),
      ]);
      
      setSystemInfo(system);
      setCpuInfo(cpu);
      setMemoryInfo(memory);
      setDiskInfo(disks);
    } catch (error) {
      console.error('Error fetching system info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`backdrop-blur-sm rounded-xl border shadow-lg p-6 animate-pulse transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-white/50'
          }`}>
            <div className={`h-4 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div className="space-y-2">
              <div className={`h-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <div className={`h-3 rounded w-3/4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Info */}
      {systemInfo && (
        <MetricCard title="Informations Système" icon={<Monitor size={20} />} isDarkMode={isDarkMode}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Système:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{systemInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Version:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{systemInfo.os_version}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Nom PC:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{systemInfo.hostname}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Uptime:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{formatUptime(systemInfo.uptime)}</span>
            </div>
          </div>
        </MetricCard>
      )}

      {/* CPU Info */}
      {cpuInfo && (
        <MetricCard title="Processeur" icon={<Cpu size={20} />} isDarkMode={isDarkMode}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Modèle:</span>
              <span className={`font-medium text-right transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{cpuInfo.brand}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Utilisation:</span>
              <span className="font-medium text-blue-400">{cpuInfo.usage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Cœurs:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{cpuInfo.cores} ({cpuInfo.physical_cores} physiques)</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Fréquence:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{cpuInfo.frequency} MHz</span>
            </div>
          </div>
        </MetricCard>
      )}

      {/* Memory Info */}
      {memoryInfo && (
        <MetricCard title="Mémoire" icon={<MemoryStick size={20} />} isDarkMode={isDarkMode}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Utilisation:</span>
              <span className="font-medium text-blue-400">{memoryInfo.usage_percent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Total:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{formatBytes(memoryInfo.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Utilisée:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{formatBytes(memoryInfo.used)}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Disponible:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>{formatBytes(memoryInfo.available)}</span>
            </div>
            <div className="flex justify-between">
              <span className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Swap:</span>
              <span className={`font-medium transition-colors duration-200 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {formatBytes(memoryInfo.swap_total)}
                {memoryInfo.swap_total > 0 && memoryInfo.swap_used > 0 && (
                  <span className="text-blue-400 ml-2">
                    ({((memoryInfo.swap_used / memoryInfo.swap_total) * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          </div>
        </MetricCard>
      )}

      {/* Disks */}
      {diskInfo.length > 0 && (
        <MetricCard 
          title="Stockage" 
          icon={<HardDrive size={20} />}
          className="lg:col-span-2"
          isDarkMode={isDarkMode}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diskInfo.map((disk, index) => (
              <div key={index} className={`p-4 rounded-lg transition-colors duration-200 ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-medium transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>{disk.mount_point}</span>
                  <span className={`text-sm transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{disk.file_system}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-400">
                    {disk.usage_percent.toFixed(1)}% utilisé
                  </span>
                </div>
                <ProgressBar value={disk.usage_percent} />
                <div className={`flex justify-between text-xs mt-1 transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <span>{formatBytes(disk.used_space)} utilisé</span>
                  <span>{formatBytes(disk.total_space)} total</span>
                </div>
              </div>
            ))}
          </div>
        </MetricCard>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'overview' | 'processes'>('monitor');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Définir le thème sombre par défaut
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initialize dark mode on first load
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-slate-50 to-blue-50'
    }`}>
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`backdrop-blur-sm rounded-none border-0 border-b p-6 mb-8 transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-gray-800/80 border-gray-700/20' 
            : 'bg-white/80 border-white/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center gap-4 flex-1">
            <div className="p-3 bg-blue-500 rounded-full text-white">
              <Monitor size={32} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              What's In My Computer?
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </motion.header>

      {/* Navigation */}
      <div className="container mx-auto px-6 mb-8">
        <nav className={`flex gap-2 p-1 backdrop-blur-sm rounded-xl shadow-lg w-fit mx-auto transition-colors duration-200 ${
          isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
        }`}>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'monitor'
                ? 'bg-blue-500 text-white shadow-md'
                : isDarkMode 
                  ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
            }`}
          >
            <Activity size={18} />
            Monitoring Avancé
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-blue-500 text-white shadow-md'
                : isDarkMode 
                  ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
            }`}
          >
            <Info size={18} />
            Détails Hardware
          </button>
          <button
            onClick={() => setActiveTab('processes')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'processes'
                ? 'bg-blue-500 text-white shadow-md'
                : isDarkMode 
                  ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
            }`}
          >
            <Users size={18} />
            Processus
          </button>
        </nav>
      </div>

      {/* Content */}
      <main className="container mx-auto px-6 pb-12">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'monitor' && <RealtimeMonitor isDarkMode={isDarkMode} />}
          {activeTab === 'overview' && <SystemOverview isDarkMode={isDarkMode} />}
          {activeTab === 'processes' && <ProcessPage isDarkMode={isDarkMode} />}
        </motion.div>
      </main>
    </div>
  );
};

export default App;
