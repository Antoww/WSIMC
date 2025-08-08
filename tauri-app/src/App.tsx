import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Activity,
  Info,
  Thermometer,
  Zap,
  Users,
  Moon,
  Sun
} from 'lucide-react';
import { RealtimeCharts } from './components/Charts';
import { ProcessPage } from './components/ProcessPage';
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
  gpu_usage: number;
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
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 transition-colors duration-200`}>
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

      const newDataPoint: ChartDataPoint = {
        timestamp: new Date(extendedResult.timestamp).toISOString(),
        cpu: extendedResult.cpu_usage,
        memory: extendedResult.memory_usage,
      };

      setChartData(prev => {
        const newData = [...prev, newDataPoint];
        return newData.slice(-20);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`backdrop-blur-sm rounded-xl border shadow-lg p-6 animate-pulse transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-white/50'
          }`}>
            <div className={`h-4 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div className={`h-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
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
      </div>

      {/* Graphiques */}
      <RealtimeCharts data={chartData} />
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
