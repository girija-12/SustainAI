import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Leaf, Shield, Target, TrendingUp, Award } from 'lucide-react';

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
}

interface PortfolioESGAnalyzerProps {
  investments: Investment[];
}

export default function PortfolioESGAnalyzer({ investments }: PortfolioESGAnalyzerProps) {
  // Calculate ESG alignment score
  const calculateESGAlignment = () => {
    if (investments.length === 0) return 0;
    const avgESG = investments.reduce((sum, inv) => sum + inv.esgScore, 0) / investments.length;
    return Math.round(avgESG);
  };

  // Calculate climate risk exposure
  const calculateClimateRisk = () => {
    if (investments.length === 0) return 0;
    const avgClimateRisk = investments.reduce((sum, inv) => sum + inv.climateRisk, 0) / investments.length;
    return Math.round(avgClimateRisk);
  };

  // Calculate SDG alignment percentage
  const calculateSDGAlignment = () => {
    if (investments.length === 0) return 0;
    const totalSDGs = 17; // Total UN SDGs
    const uniqueSDGs = new Set();
    investments.forEach(inv => {
      inv.sdgAlignment.forEach(sdg => uniqueSDGs.add(sdg));
    });
    return Math.round((uniqueSDGs.size / totalSDGs) * 100);
  };

  // ESG breakdown by category
  const esgBreakdown = [
    { name: 'Environmental', value: 40, color: '#10B981' },
    { name: 'Social', value: 35, color: '#3B82F6' },
    { name: 'Governance', value: 25, color: '#8B5CF6' }
  ];

  // Risk distribution
  const riskDistribution = [
    { 
      name: 'Low Risk', 
      value: investments.filter(inv => inv.risk === 'Low').length,
      color: '#10B981'
    },
    { 
      name: 'Medium Risk', 
      value: investments.filter(inv => inv.risk === 'Medium').length,
      color: '#F59E0B'
    },
    { 
      name: 'High Risk', 
      value: investments.filter(inv => inv.risk === 'High').length,
      color: '#EF4444'
    }
  ];

  // Sector allocation
  const sectorAllocation = investments.reduce((acc, inv) => {
    acc[inv.sector] = (acc[inv.sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sectorData = Object.entries(sectorAllocation).map(([sector, count], index) => ({
    name: sector,
    value: count,
    color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6]
  }));

  // Performance metrics
  const performanceMetrics = [
    {
      name: 'Q1',
      esg: 75,
      roi: 8.5,
      risk: 25
    },
    {
      name: 'Q2',
      esg: 78,
      roi: 9.2,
      risk: 22
    },
    {
      name: 'Q3',
      esg: 82,
      roi: 10.1,
      risk: 20
    },
    {
      name: 'Q4',
      esg: calculateESGAlignment(),
      roi: investments.reduce((sum, inv) => sum + inv.roi, 0) / investments.length || 0,
      risk: calculateClimateRisk()
    }
  ];

  // Generate recommendations
  const generateRecommendations = () => {
    const recommendations = [];
    const esgScore = calculateESGAlignment();
    const climateRisk = calculateClimateRisk();
    const sdgAlignment = calculateSDGAlignment();

    if (esgScore < 70) {
      recommendations.push({
        type: 'improvement',
        title: 'Enhance ESG Portfolio',
        description: 'Consider increasing allocation to high-ESG rated investments to improve overall score.',
        priority: 'high'
      });
    }

    if (climateRisk > 40) {
      recommendations.push({
        type: 'risk',
        title: 'Reduce Climate Risk',
        description: 'Diversify into climate-resilient sectors to reduce portfolio exposure.',
        priority: 'medium'
      });
    }

    if (sdgAlignment < 50) {
      recommendations.push({
        type: 'impact',
        title: 'Broaden SDG Impact',
        description: 'Expand investments across more UN Sustainable Development Goals.',
        priority: 'low'
      });
    }

    const lowRiskCount = investments.filter(inv => inv.risk === 'Low').length;
    if (lowRiskCount / investments.length < 0.4) {
      recommendations.push({
        type: 'balance',
        title: 'Balance Risk Profile',
        description: 'Consider increasing allocation to lower-risk sustainable investments.',
        priority: 'medium'
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const RadialGauge = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => {
    const percentage = (value / max) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900">{value}</span>
          </div>
        </div>
        <span className="text-sm text-gray-600 mt-2 text-center">{label}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Leaf className="w-5 h-5 text-emerald-600" />
        <h2 className="text-xl font-semibold text-gray-900">Portfolio ESG Analyzer</h2>
      </div>

      {/* Key Metrics Gauges */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <RadialGauge
          value={calculateESGAlignment()}
          max={100}
          color="#10B981"
          label="ESG Alignment Score"
        />
        <RadialGauge
          value={100 - calculateClimateRisk()}
          max={100}
          color="#3B82F6"
          label="Climate Resilience"
        />
        <RadialGauge
          value={calculateSDGAlignment()}
          max={100}
          color="#8B5CF6"
          label="SDG Alignment %"
        />
      </div>

      {/* ESG Breakdown Pie Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ESG Category Breakdown</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={esgBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {esgBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          {esgBreakdown.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm text-gray-600">{item.name} ({item.value}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Trend */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ESG Performance Trend</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="esg" fill="#10B981" name="ESG Score" />
              <Bar dataKey="roi" fill="#3B82F6" name="ROI %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
        <div className="space-y-3">
          {riskDistribution.map((risk, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-16 text-sm text-gray-600">{risk.name}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-1000"
                  style={{
                    backgroundColor: risk.color,
                    width: `${(risk.value / investments.length) * 100}%`
                  }}
                ></div>
              </div>
              <div className="w-8 text-sm text-gray-600">{risk.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          Recommendations
        </h3>
        <div className="space-y-3">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high'
                    ? 'bg-red-50 border-red-500'
                    : rec.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {rec.type === 'improvement' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                    {rec.type === 'risk' && <Shield className="w-4 h-4 text-red-600" />}
                    {rec.type === 'impact' && <Target className="w-4 h-4 text-blue-600" />}
                    {rec.type === 'balance' && <Leaf className="w-4 h-4 text-yellow-600" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Excellent Portfolio Balance!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your portfolio demonstrates strong ESG alignment and balanced risk distribution.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}