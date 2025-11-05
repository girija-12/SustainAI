import { useState, useEffect, useMemo } from 'react';
import { useDashboardData, useMarketTrends, useAIAnalysis } from '../../hooks/useRealTimeData';
import {
  MapPin,
  Filter,
  TrendingUp,
  AlertTriangle,
  Globe,
  DollarSign,
  Leaf,
  Shield,
  Search,
  ChevronDown,
  Bell,
  BookmarkPlus,
  X,
  Play,
  BarChart3,
  Target,
  Clock,
  Calendar,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import ChatWidget from '../shared/ChatWidget';
import GlobalInvestmentMap from './components/GlobalInvestmentMap';
import FilterSidebar from './components/FilterSidebar';
import ESGROIGraph from './components/ESGROIGraph';
import TopOpportunitiesTable from './components/TopOpportunitiesTable';
import ImpactRiskSimulator from './components/ImpactRiskSimulator';
import PortfolioESGAnalyzer from './components/PortfolioESGAnalyzer';
import AlertsFeed from './components/AlertsFeed';

// Types
interface Investment {
  id: number;
  name: string;
  region: string;
  sector: string;
  impact: string;
  roi: number;
  esgScore: number;
  risk: 'Low' | 'Medium' | 'High';
  prediction: 'up' | 'down' | 'stable';
  investmentSize: number;
  timeHorizon: 'Short' | 'Long';
  lat: number;
  lng: number;
  climateRisk: number;
  policyScore: number;
  sdgAlignment: string[];
  realTimeData?: {
    weather?: {
      riskScore: number;
      current?: {
        temperature: number;
        description: string;
        humidity: number;
        windSpeed: number;
      };
    };
    financial?: any;
    news?: any[];
    lastUpdated: Date;
  };
}

interface FilterState {
  regions: string[];
  sectors: string[];
  riskLevels: string[];
  esgRange: [number, number];
  investmentRange: [number, number];
  timeHorizon: string[];
}

interface Alert {
  id: number;
  type: 'opportunity' | 'policy' | 'climate';
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  isBookmarked: boolean;
}

export default function InvestmentPrediction() {
  // State Management
  const [filters, setFilters] = useState<FilterState>({
    regions: [],
    sectors: [],
    riskLevels: [],
    esgRange: [0, 100],
    investmentRange: [1000, 1000000],
    timeHorizon: []
  });

  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'roi' | 'esgScore' | 'risk'>('roi');
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');

  // Sample Data - In production, this would come from Convex
  const investments: Investment[] = [
    {
      id: 1,
      name: 'Solar Energy Fund',
      region: 'North America',
      sector: 'Energy',
      impact: 'Environmental',
      roi: 12.5,
      esgScore: 85,
      risk: 'Low',
      prediction: 'up',
      investmentSize: 50000,
      timeHorizon: 'Long',
      lat: 40.7128,
      lng: -74.0060,
      climateRisk: 20,
      policyScore: 90,
      sdgAlignment: ['SDG 7', 'SDG 13']
    },
    {
      id: 2,
      name: 'Clean Water Initiative',
      region: 'Africa',
      sector: 'Water',
      impact: 'Social',
      roi: 8.3,
      esgScore: 92,
      risk: 'Medium',
      prediction: 'up',
      investmentSize: 25000,
      timeHorizon: 'Long',
      lat: -1.2921,
      lng: 36.8219,
      climateRisk: 45,
      policyScore: 75,
      sdgAlignment: ['SDG 6', 'SDG 3']
    },
    {
      id: 3,
      name: 'Sustainable Agriculture',
      region: 'Asia',
      sector: 'Agriculture',
      impact: 'Environmental',
      roi: 15.2,
      esgScore: 78,
      risk: 'Medium',
      prediction: 'up',
      investmentSize: 75000,
      timeHorizon: 'Long',
      lat: 35.6762,
      lng: 139.6503,
      climateRisk: 35,
      policyScore: 80,
      sdgAlignment: ['SDG 2', 'SDG 15']
    },
    {
      id: 4,
      name: 'Education Technology',
      region: 'Europe',
      sector: 'Technology',
      impact: 'Social',
      roi: 10.8,
      esgScore: 88,
      risk: 'Low',
      prediction: 'stable',
      investmentSize: 40000,
      timeHorizon: 'Short',
      lat: 52.5200,
      lng: 13.4050,
      climateRisk: 15,
      policyScore: 95,
      sdgAlignment: ['SDG 4', 'SDG 8']
    },
    {
      id: 5,
      name: 'Green Transportation',
      region: 'South America',
      sector: 'Transportation',
      impact: 'Environmental',
      roi: 14.1,
      esgScore: 82,
      risk: 'High',
      prediction: 'up',
      investmentSize: 100000,
      timeHorizon: 'Long',
      lat: -23.5505,
      lng: -46.6333,
      climateRisk: 40,
      policyScore: 70,
      sdgAlignment: ['SDG 11', 'SDG 13']
    },
    {
      id: 6,
      name: 'Renewable Infrastructure',
      region: 'Australia',
      sector: 'Infrastructure',
      impact: 'Environmental',
      roi: 11.7,
      esgScore: 86,
      risk: 'Medium',
      prediction: 'up',
      investmentSize: 150000,
      timeHorizon: 'Long',
      lat: -33.8688,
      lng: 151.2093,
      climateRisk: 30,
      policyScore: 85,
      sdgAlignment: ['SDG 7', 'SDG 9']
    }
  ];

  // Real-time data hooks (temporarily disabled to prevent infinite loops)
  const { data: marketTrends, loading: marketLoading } = useMarketTrends(false);
  const { analyzeInvestment, getChatResponse, loading: aiLoading } = useAIAnalysis();

  // Use useMemo to prevent infinite loops with investments dependency
  const stableInvestments = useMemo(() => investments, []);
  const { alerts: realTimeAlerts, loading: dashboardLoading } = useDashboardData(stableInvestments);

  const sampleAlerts: Alert[] = [
    {
      id: 1,
      type: 'opportunity',
      title: 'New Green Bond Opportunity',
      description: 'High-yield sustainable infrastructure bond available in Nordic region',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false,
      isBookmarked: false
    },
    {
      id: 2,
      type: 'policy',
      title: 'EU Taxonomy Update',
      description: 'New regulations affecting renewable energy classifications',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isRead: false,
      isBookmarked: false
    },
    {
      id: 3,
      type: 'climate',
      title: 'Climate Risk Alert',
      description: 'Increased flood risk in Southeast Asian agricultural projects',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: true,
      isBookmarked: true
    }
  ];

  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant' as const, content: 'Hi! I\'m EcoVest, your AI-powered sustainable investment advisor. I can help you analyze ESG opportunities, simulate portfolio risks, and find impactful investments. How can I assist you today?' }
  ]);

  // Enhanced chat handler with real AI
  const handleChatMessage = async (message: string) => {
    const newUserMessage = { role: 'user' as const, content: message };
    setChatMessages(prev => [...prev, newUserMessage]);

    try {
      // Add context about current portfolio and market conditions
      const contextMessage = `Current portfolio context: ${filteredInvestments.length} investments, average ESG score: ${Math.round(filteredInvestments.reduce((acc, inv) => acc + inv.esgScore, 0) / filteredInvestments.length || 0)}, market trends: ${marketTrends?.slice(0, 2).map(t => `${t.symbol}: ${t.changePercent}`).join(', ') || 'Loading...'}. User question: ${message}`;

      const response = await getChatResponse([
        ...chatMessages.slice(-5), // Keep last 5 messages for context
        { role: 'user', content: contextMessage }
      ]);

      const aiMessage = { role: 'assistant' as const, content: response };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { role: 'assistant' as const, content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.' };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // Initialize alerts with real-time data
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Combine sample alerts with real-time alerts
    const combinedAlerts = [
      ...sampleAlerts,
      ...(realTimeAlerts || [])
    ].slice(0, 20); // Limit to 20 most recent alerts

    setAlerts(combinedAlerts);
  }, [realTimeAlerts]);

  // Filter investments based on current filters
  const filteredInvestments = investments.filter(inv => {
    const matchesRegion = filters.regions.length === 0 || filters.regions.includes(inv.region);
    const matchesSector = filters.sectors.length === 0 || filters.sectors.includes(inv.sector);
    const matchesRisk = filters.riskLevels.length === 0 || filters.riskLevels.includes(inv.risk);
    const matchesESG = inv.esgScore >= filters.esgRange[0] && inv.esgScore <= filters.esgRange[1];
    const matchesInvestment = inv.investmentSize >= filters.investmentRange[0] && inv.investmentSize <= filters.investmentRange[1];
    const matchesTimeHorizon = filters.timeHorizon.length === 0 || filters.timeHorizon.includes(inv.timeHorizon);
    const matchesSearch = searchTerm === '' || inv.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesRegion && matchesSector && matchesRisk && matchesESG && matchesInvestment && matchesTimeHorizon && matchesSearch;
  });

  // Handle investment selection for modal
  const handleInvestmentSelect = async (investment: Investment) => {
    setSelectedInvestment(investment);
    setShowModal(true);
    setAiAnalysis('');

    // Get AI analysis for the selected investment
    try {
      const analysis = await analyzeInvestment(investment);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Failed to get AI analysis:', error);
      setAiAnalysis('AI analysis temporarily unavailable. Please try again later.');
    }
  };

  // Handle alert actions
  const handleAlertAction = (alertId: number, action: 'read' | 'bookmark' | 'dismiss') => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        switch (action) {
          case 'read':
            return { ...alert, isRead: true };
          case 'bookmark':
            return { ...alert, isBookmarked: !alert.isBookmarked };
          case 'dismiss':
            return { ...alert, isRead: true };
          default:
            return alert;
        }
      }
      return alert;
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-emerald-50">

      {/* Enhanced Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            investments={investments}
            isHorizontal={true}
          />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-8">
            {/* Global Investment Map */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    Global Investment Radar
                  </h2>
                  <p className="text-gray-600 mt-1">Discover sustainable opportunities worldwide</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 font-medium">Live Data</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Updated 2 min ago</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>High Risk, Low Return</span>
                  </div>
                </div>
              </div>
              <GlobalInvestmentMap
                investments={filteredInvestments}
                onInvestmentSelect={handleInvestmentSelect}
              />
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 shadow-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700 font-medium">Total Opportunities</p>
                    <p className="text-3xl font-bold text-emerald-900 mt-1">{filteredInvestments.length}</p>
                    <p className="text-xs text-emerald-600 mt-1">+12% from last month</p>
                  </div>
                  <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Avg ESG Score</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">
                      {Math.round(filteredInvestments.reduce((acc, inv) => acc + inv.esgScore, 0) / filteredInvestments.length || 0)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">Excellent rating</p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Avg Expected ROI</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">
                      {(filteredInvestments.reduce((acc, inv) => acc + inv.roi, 0) / filteredInvestments.length || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Above market average</p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* ESG vs ROI Scatter Plot */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    ESG Score vs Expected ROI
                  </h2>
                  <p className="text-gray-600 mt-1">Interactive analysis of sustainability and returns</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-700 font-medium text-sm">Interactive</span>
                </div>
              </div>
              <ESGROIGraph
                investments={filteredInvestments}
                onInvestmentSelect={handleInvestmentSelect}
              />
            </div>

            {/* Portfolio Analyzer and Risk Simulator Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PortfolioESGAnalyzer investments={filteredInvestments} />
              <ImpactRiskSimulator
                investments={filteredInvestments}
                onSimulationComplete={setSimulationResults}
              />
            </div>

            {/* Top Opportunities Table */}
            <TopOpportunitiesTable
              investments={filteredInvestments}
              searchTerm={searchTerm}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onInvestmentSelect={handleInvestmentSelect}
            />
          </div>

          {/* Enhanced Right Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Welcome Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Welcome Back!</h3>
                    <p className="text-emerald-100 text-sm">Ready to invest sustainably?</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 mt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-100">Portfolio Value</span>
                    <span className="font-bold">$2.4M</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-emerald-100">Today's Gain</span>
                    <span className="font-bold text-green-200">+$12,450</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Alerts Feed */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Market Alerts</h3>
                      <p className="text-blue-100 text-sm">Real-time opportunities</p>
                    </div>
                  </div>
                </div>
                <AlertsFeed
                  alerts={alerts}
                  onAlertAction={handleAlertAction}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Detail Modal */}
      {showModal && selectedInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{selectedInvestment.name}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Expected ROI</p>
                    <p className="text-2xl font-bold text-emerald-600">{selectedInvestment.roi}%</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">ESG Score</p>
                    <p className="text-2xl font-bold text-green-600">{selectedInvestment.esgScore}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Regional Analysis</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Climate Risk:</span>
                      <span className={`font-medium ${selectedInvestment.climateRisk < 30 ? 'text-green-600' :
                          selectedInvestment.climateRisk < 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {selectedInvestment.climateRisk}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Policy Score:</span>
                      <span className="font-medium text-blue-600">{selectedInvestment.policyScore}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">SDG Alignment</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedInvestment.sdgAlignment.map((sdg, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {sdg}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Analysis Section */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    EcoVest AI Analysis
                  </h3>
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      <span>Analyzing investment opportunity...</span>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap">
                        {aiAnalysis}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        AI analysis will appear here once loaded.
                      </p>
                    </div>
                  )}
                </div>

                {/* Real-time Data Section */}
                {selectedInvestment.realTimeData && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3">Real-time Insights</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedInvestment.realTimeData.weather && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">Climate Conditions</h4>
                          <div className="space-y-1 text-xs text-blue-700">
                            <div>Risk Score: {selectedInvestment.realTimeData.weather.riskScore}%</div>
                            <div>Temperature: {selectedInvestment.realTimeData.weather.current?.temperature}°C</div>
                            <div>Conditions: {selectedInvestment.realTimeData.weather.current?.description}</div>
                          </div>
                        </div>
                      )}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Market Status</h4>
                        <div className="space-y-1 text-xs text-green-700">
                          <div>Last Updated: {new Date().toLocaleTimeString()}</div>
                          <div>Status: Active Monitoring</div>
                          <div>Trend: {selectedInvestment.prediction === 'up' ? '↗️ Positive' : selectedInvestment.prediction === 'down' ? '↘️ Negative' : '→ Stable'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button className="flex-1 bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition-colors font-medium">
                    Add to Portfolio
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const analysis = await analyzeInvestment(selectedInvestment);
                        setAiAnalysis(analysis);
                      } catch (error) {
                        console.error('Analysis failed:', error);
                      }
                    }}
                    disabled={aiLoading}
                    className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                  >
                    {aiLoading ? 'Analyzing...' : 'Refresh Analysis'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Loading Overlay */}
      {(isLoading || dashboardLoading || marketLoading) && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/20 to-black/40 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 flex items-center gap-4 shadow-2xl border border-white/20 max-w-md">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-200 border-t-emerald-500"></div>
              <div className="absolute inset-0 rounded-full bg-emerald-100/20"></div>
            </div>
            <div>
              <div className="font-bold text-lg text-gray-900">Loading EcoVest</div>
              <div className="text-sm text-gray-600 mt-1">
                {dashboardLoading && '🔍 Analyzing investment opportunities...'}
                {marketLoading && '📈 Fetching market trends...'}
                {aiLoading && '🤖 Processing AI insights...'}
                {!dashboardLoading && !marketLoading && !aiLoading && '⚡ Preparing dashboard...'}
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-1 mt-3">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Status Bar */}
      <div className="fixed bottom-6 right-6 z-30">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 flex items-center gap-3 text-sm border border-white/20">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${dashboardLoading || marketLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
              }`}></div>
            <span className="font-medium text-gray-800">
              {dashboardLoading || marketLoading ? 'Syncing Data...' : 'Live & Active'}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}