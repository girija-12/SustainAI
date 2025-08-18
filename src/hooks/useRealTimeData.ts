import { useState, useEffect, useCallback } from 'react';
import { WeatherService, FinancialService, NewsService, AIService } from '../services/apiService';

// Hook for real-time weather and climate data
export function useWeatherData(lat: number, lon: number, enabled = true) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async () => {
    if (!enabled || !lat || !lon) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const weatherData = await WeatherService.getCurrentWeather(lat, lon);
      const climateRisk = await WeatherService.getClimateRiskData(lat, lon);
      
      setData({
        current: weatherData,
        climateRisk: climateRisk
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, [lat, lon, enabled]);

  useEffect(() => {
    fetchWeatherData();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  return { data, loading, error, refetch: fetchWeatherData };
}

// Hook for financial market data
export function useFinancialData(symbols: string[] = [], enabled = true) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancialData = useCallback(async () => {
    if (!enabled || symbols.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const promises = symbols.map(symbol => FinancialService.getESGData(symbol));
      const results = await Promise.all(promises);
      
      setData(results.filter(Boolean));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  }, [symbols, enabled]);

  useEffect(() => {
    fetchFinancialData();
    
    // Refresh every 5 minutes during market hours
    const interval = setInterval(fetchFinancialData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFinancialData]);

  return { data, loading, error, refetch: fetchFinancialData };
}

// Hook for market trends
export function useMarketTrends(enabled = true) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketTrends = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const trends = await FinancialService.getMarketTrends();
      setData(trends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market trends');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchMarketTrends();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchMarketTrends, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMarketTrends]);

  return { data, loading, error, refetch: fetchMarketTrends };
}

// Hook for ESG news and alerts
export function useESGNews(enabled = true) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchNews = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [esgNews, policyNews] = await Promise.all([
        NewsService.getESGNews(1, 10),
        NewsService.getPolicyUpdates()
      ]);
      
      // Combine and sort by date
      const allNews = [...esgNews, ...policyNews]
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, 20);
      
      setData(allNews);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchNews();
    
    // Refresh every 15 minutes
    const interval = setInterval(fetchNews, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return { data, loading, error, lastUpdate, refetch: fetchNews };
}

// Hook for AI-powered investment analysis
export function useAIAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeInvestment = useCallback(async (investment: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await AIService.analyzeInvestmentOpportunity(investment);
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze investment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const generatePortfolioRecommendations = useCallback(async (investments: any[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const recommendations = await AIService.generatePortfolioRecommendations(investments);
      return recommendations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate recommendations';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getChatResponse = useCallback(async (messages: Array<{role: string, content: string}>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AIService.getChatCompletion(messages);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analyzeInvestment,
    generatePortfolioRecommendations,
    getChatResponse,
    loading,
    error
  };
}

// Simplified hook for dashboard alerts only
export function useDashboardData(investments: any[] = []) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate sample alerts to prevent API loops
  useEffect(() => {
    const sampleAlerts = [
      {
        id: 1,
        type: 'opportunity',
        title: 'New Green Bond Opportunity',
        description: 'European Green Bond yields 4.2% with AAA rating',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: false,
        isBookmarked: false
      },
      {
        id: 2,
        type: 'policy',
        title: 'EU Taxonomy Update',
        description: 'New regulations affect renewable energy classifications',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        isRead: false,
        isBookmarked: false
      },
      {
        id: 3,
        type: 'climate',
        title: 'Climate Risk Alert',
        description: 'Increased flooding risk in Southeast Asia affects infrastructure investments',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        isRead: true,
        isBookmarked: true
      }
    ];
    
    setAlerts(sampleAlerts);
  }, []);

  return {
    alerts,
    loading,
    error,
    refetch: () => {}
  };
}

// Hook for real-time portfolio monitoring
export function usePortfolioMonitoring(investments: any[] = []) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateMetrics = useCallback(async () => {
    if (investments.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate portfolio metrics
      const totalValue = investments.reduce((sum, inv) => sum + inv.investmentSize, 0);
      const avgESG = investments.reduce((sum, inv) => sum + inv.esgScore, 0) / investments.length;
      const avgROI = investments.reduce((sum, inv) => sum + inv.roi, 0) / investments.length;
      const avgClimateRisk = investments.reduce((sum, inv) => sum + inv.climateRisk, 0) / investments.length;
      
      // Risk distribution
      const riskDistribution = {
        low: investments.filter(inv => inv.risk === 'Low').length,
        medium: investments.filter(inv => inv.risk === 'Medium').length,
        high: investments.filter(inv => inv.risk === 'High').length
      };
      
      // Sector allocation
      const sectorAllocation = investments.reduce((acc, inv) => {
        acc[inv.sector] = (acc[inv.sector] || 0) + inv.investmentSize;
        return acc;
      }, {} as Record<string, number>);
      
      // Regional allocation
      const regionalAllocation = investments.reduce((acc, inv) => {
        acc[inv.region] = (acc[inv.region] || 0) + inv.investmentSize;
        return acc;
      }, {} as Record<string, number>);

      setMetrics({
        totalValue,
        avgESG: Math.round(avgESG),
        avgROI: Number(avgROI.toFixed(1)),
        avgClimateRisk: Math.round(avgClimateRisk),
        riskDistribution,
        sectorAllocation,
        regionalAllocation,
        lastUpdated: new Date()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate portfolio metrics');
    } finally {
      setLoading(false);
    }
  }, [investments]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  return { metrics, loading, error, refetch: calculateMetrics };
}