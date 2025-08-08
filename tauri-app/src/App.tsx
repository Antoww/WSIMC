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
  Info
} from 'lucide-react';
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
}> = ({ title, icon, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`metric-card ${className}`}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
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

const RealtimeMonitor: React.FC = () => {
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRealtimeStats = async () => {
    try {
      setIsLoading(true);
      const result = await invoke<RealtimeStats>('get_real_time_stats');
      setStats(result);
    } catch (error) {
      console.error('Error fetching realtime stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeStats();
    const interval = setInterval(fetchRealtimeStats, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="metric-card animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MetricCard title="Processeur" icon={<Cpu size={20} />}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Utilisation</span>
            <span className="text-lg font-bold text-gray-800">
              {stats.cpu_usage.toFixed(1)}%
            </span>
          </div>
          <ProgressBar 
            value={stats.cpu_usage} 
            color={stats.cpu_usage > 80 ? "red" : stats.cpu_usage > 60 ? "yellow" : "blue"} 
          />
        </div>
      </MetricCard>

      <MetricCard title="Mémoire" icon={<MemoryStick size={20} />}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Utilisation</span>
            <span className="text-lg font-bold text-gray-800">
              {stats.memory_usage.toFixed(1)}%
            </span>
          </div>
          <ProgressBar 
            value={stats.memory_usage} 
            color={stats.memory_usage > 80 ? "red" : stats.memory_usage > 60 ? "yellow" : "blue"} 
          />
          <div className="text-sm text-gray-600">
            {stats.memory_used_gb.toFixed(1)} GB / {stats.memory_total_gb.toFixed(1)} GB
          </div>
        </div>
      </MetricCard>
    </div>
  );
};

const SystemOverview: React.FC = () => {
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
        <MetricCard title="Informations Système" icon={<Monitor size={20} />}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Système:</span>
              <span className="font-medium">{systemInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Version:</span>
              <span className="font-medium">{systemInfo.os_version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nom PC:</span>
              <span className="font-medium">{systemInfo.hostname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime:</span>
              <span className="font-medium">{formatUptime(systemInfo.uptime)}</span>
            </div>
          </div>
        </MetricCard>
      )}

      {/* CPU Info */}
      {cpuInfo && (
        <MetricCard title="Processeur" icon={<Cpu size={20} />}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Modèle:</span>
              <span className="font-medium text-right">{cpuInfo.brand}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cœurs:</span>
              <span className="font-medium">{cpuInfo.cores} ({cpuInfo.physical_cores} physiques)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fréquence:</span>
              <span className="font-medium">{cpuInfo.frequency} MHz</span>
            </div>
          </div>
        </MetricCard>
      )}

      {/* Memory Info */}
      {memoryInfo && (
        <MetricCard title="Mémoire" icon={<MemoryStick size={20} />}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">{formatBytes(memoryInfo.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Utilisée:</span>
              <span className="font-medium">{formatBytes(memoryInfo.used)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Disponible:</span>
              <span className="font-medium">{formatBytes(memoryInfo.available)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Swap:</span>
              <span className="font-medium">{formatBytes(memoryInfo.swap_total)}</span>
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
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diskInfo.map((disk, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-800">{disk.mount_point}</span>
                  <span className="text-sm text-gray-600">{disk.file_system}</span>
                </div>
                <ProgressBar value={disk.usage_percent} />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
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
  const [activeTab, setActiveTab] = useState<'monitor' | 'overview'>('monitor');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-none border-0 border-b border-white/20 p-6 mb-8"
      >
        <div className="flex items-center justify-center gap-4">
          <div className="p-3 bg-blue-500 rounded-full text-white">
            <Monitor size={32} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            What's In My Computer?
          </h1>
        </div>
      </motion.header>

      {/* Navigation */}
      <div className="container mx-auto px-6 mb-8">
        <nav className="flex gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg w-fit mx-auto">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'monitor'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
            }`}
          >
            <Activity size={18} />
            Monitoring
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
            }`}
          >
            <Info size={18} />
            Détails Hardware
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
          {activeTab === 'monitor' ? <RealtimeMonitor /> : <SystemOverview />}
        </motion.div>
      </main>
    </div>
  );
};

export default App;
