interface ChartDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  temperature?: number;
}

interface CachedData {
  chartData: ChartDataPoint[];
  lastUpdate: number;
}

class DataCache {
  private static instance: DataCache;
  private cache: Map<string, CachedData> = new Map();
  private readonly MAX_CHART_POINTS = 50; // Augmenté de 20 à 50
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static getInstance(): DataCache {
    if (!DataCache.instance) {
      DataCache.instance = new DataCache();
    }
    return DataCache.instance;
  }

  addChartData(key: string, dataPoint: ChartDataPoint): ChartDataPoint[] {
    const cached = this.cache.get(key);
    let chartData: ChartDataPoint[] = [];

    if (cached && this.isValidCache(cached.lastUpdate)) {
      chartData = cached.chartData;
    }

    // Ajouter le nouveau point
    chartData.push(dataPoint);

    // Garder seulement les derniers points
    if (chartData.length > this.MAX_CHART_POINTS) {
      chartData = chartData.slice(-this.MAX_CHART_POINTS);
    }

    // Mettre à jour le cache
    this.cache.set(key, {
      chartData,
      lastUpdate: Date.now()
    });

    return chartData;
  }

  getChartData(key: string): ChartDataPoint[] {
    const cached = this.cache.get(key);
    if (cached && this.isValidCache(cached.lastUpdate)) {
      return cached.chartData;
    }
    return [];
  }

  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  private isValidCache(lastUpdate: number): boolean {
    return Date.now() - lastUpdate < this.CACHE_DURATION;
  }

  // Méthode pour obtenir des statistiques du cache
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      maxPoints: this.MAX_CHART_POINTS,
      cacheDuration: this.CACHE_DURATION / (60 * 1000) // en minutes
    };
  }
}

export const dataCache = DataCache.getInstance();
export type { ChartDataPoint };
