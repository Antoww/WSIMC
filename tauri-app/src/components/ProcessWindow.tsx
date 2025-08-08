import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import { 
  X, 
  Zap, 
  MemoryStick, 
  RefreshCw,
  Activity
} from 'lucide-react';

interface ProcessInfo {
  name: string;
  pid: number;
  cpu_usage: number;
  memory: number;
}

interface ProcessWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatBytes = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${(bytes / 1024).toFixed(0)}KB` : `${mb.toFixed(1)}MB`;
};

export const ProcessWindow: React.FC<ProcessWindowProps> = ({ isOpen, onClose }) => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'cpu' | 'memory'>('cpu');

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
    if (isOpen) {
      fetchProcesses();
      const interval = setInterval(fetchProcesses, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const sortedProcesses = [...processes].sort((a, b) => {
    if (sortBy === 'cpu') {
      return b.cpu_usage - a.cpu_usage;
    }
    return b.memory - a.memory;
  });

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Activity size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Gestionnaire de Processus</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchProcesses}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('cpu')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'cpu'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-blue-50'
              }`}
            >
              Trier par CPU
            </button>
            <button
              onClick={() => setSortBy('memory')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'memory'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-blue-50'
              }`}
            >
              Trier par Mémoire
            </button>
          </div>
        </div>

        {/* Process List */}
        <div className="flex-1 overflow-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Nom du Processus</th>
                <th className="text-left p-4 font-semibold text-gray-700">PID</th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <Zap size={16} />
                    CPU (%)
                  </div>
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <MemoryStick size={16} />
                    Mémoire
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    </td>
                  </tr>
                ))
              ) : (
                sortedProcesses.map((process, index) => (
                  <motion.tr
                    key={process.pid}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="p-4 font-medium text-gray-800">
                      {process.name}
                    </td>
                    <td className="p-4 text-gray-600 font-mono">
                      {process.pid}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          process.cpu_usage > 50 ? 'bg-red-500' :
                          process.cpu_usage > 20 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <span className="font-semibold">
                          {process.cpu_usage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-gray-700">
                      {formatBytes(process.memory)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Affichage des {processes.length} processus les plus actifs • 
            Mise à jour automatique toutes les 2 secondes
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProcessWindow;
