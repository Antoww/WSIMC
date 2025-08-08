import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import { Activity, Users } from 'lucide-react';

interface ProcessInfo {
  name: string;
  pid: number;
  cpu_usage: number;
  memory: number;
  gpu_usage: number;
}

interface MetricCardProps {
  title: string;
  icon: React.ReactNode | null;
  children: React.ReactNode;
  className?: string;
  isDarkMode?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, icon, children, className = "", isDarkMode = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`backdrop-blur-sm rounded-xl border shadow-lg p-6 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gray-800/50 border-gray-700/50' 
        : 'bg-white/50 border-white/50'
    } ${className}`}
  >
    {title && icon && (
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
    )}
    {children}
  </motion.div>
);

const formatBytes = (bytes: number): string => {
  const gb = bytes / (1024 ** 3);
  return gb < 1 ? `${(bytes / (1024 ** 2)).toFixed(0)}MB` : `${gb.toFixed(1)}GB`;
};

export const ProcessPage: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'name' | 'gpu'>('cpu');
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
        case 'gpu':
          comparison = a.gpu_usage - b.gpu_usage;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (column: 'cpu' | 'memory' | 'name' | 'gpu') => {
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
                <th 
                  onClick={() => handleSort('gpu')}
                  className={`text-right p-4 font-semibold cursor-pointer hover:bg-opacity-50 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-end gap-2">
                    GPU %
                    {sortBy === 'gpu' && (
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
                    <td className="p-4">
                      <div className={`h-4 w-12 rounded animate-pulse ml-auto ${
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
                    <td className="p-4 text-right">
                      <span className={`font-semibold ${
                        process.gpu_usage > 20 ? 'text-red-500' : 
                        process.gpu_usage > 10 ? 'text-yellow-500' : 
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {process.gpu_usage.toFixed(1)}%
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
