import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

interface ESGROIGraphProps {
  investments: Investment[];
  onInvestmentSelect: (investment: Investment) => Promise<void>;
}

export default function ESGROIGraph({ investments, onInvestmentSelect }: ESGROIGraphProps) {
  // Transform data for scatter chart
  const chartData = investments.map(inv => ({
    x: inv.roi,
    y: inv.esgScore,
    z: inv.investmentSize / 1000, // Size for bubble
    name: inv.name,
    region: inv.region,
    sector: inv.sector,
    risk: inv.risk,
    investment: inv
  }));

  // Color mapping based on risk level
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return '#10B981'; // Green
      case 'Medium': return '#F59E0B'; // Yellow
      case 'High': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 min-w-64">
          <h3 className="font-semibold text-gray-900 mb-2">{data.name}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Expected ROI:</span>
              <span className="font-medium text-emerald-600">{data.x}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ESG Score:</span>
              <span className="font-medium text-green-600">{data.y}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Investment Size:</span>
              <span className="font-medium">${(data.z * 1000).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Risk Level:</span>
              <span className={`font-medium ${
                data.risk === 'Low' ? 'text-green-600' :
                data.risk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.risk}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Region:</span>
              <span className="font-medium">{data.region}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sector:</span>
              <span className="font-medium">{data.sector}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">Click to view details</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom dot component for scatter plot
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const radius = Math.max(4, Math.min(12, payload.z / 10)); // Dynamic size based on investment amount
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={getRiskColor(payload.risk)}
        fillOpacity={0.8}
        stroke="#fff"
        strokeWidth={2}
        className="cursor-pointer hover:fill-opacity-100 transition-all duration-200"
        onClick={async () => await onInvestmentSelect(payload.investment)}
      />
    );
  };

  // Quadrant analysis
  const avgROI = investments.reduce((sum, inv) => sum + inv.roi, 0) / investments.length;
  const avgESG = investments.reduce((sum, inv) => sum + inv.esgScore, 0) / investments.length;

  const getQuadrantLabel = (roi: number, esg: number) => {
    if (roi >= avgROI && esg >= avgESG) return 'High Impact Leaders';
    if (roi >= avgROI && esg < avgESG) return 'Financial Focus';
    if (roi < avgROI && esg >= avgESG) return 'Impact Focus';
    return 'Emerging Opportunities';
  };

  const quadrants = [
    { x: avgROI, y: avgESG, label: 'High Impact Leaders', color: 'text-green-600' },
    { x: avgROI, y: avgESG, label: 'Financial Focus', color: 'text-blue-600' },
    { x: avgROI, y: avgESG, label: 'Impact Focus', color: 'text-purple-600' },
    { x: avgROI, y: avgESG, label: 'Emerging Opportunities', color: 'text-orange-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            data={chartData}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="ROI"
              unit="%"
              domain={['dataMin - 1', 'dataMax + 1']}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="ESG Score"
              domain={['dataMin - 5', 'dataMax + 5']}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Average lines */}
            <line
              x1={0}
              y1={avgESG}
              x2="100%"
              y2={avgESG}
              stroke="#d1d5db"
              strokeDasharray="5,5"
              strokeWidth={1}
            />
            <line
              x1={avgROI}
              y1={0}
              x2={avgROI}
              y2="100%"
              stroke="#d1d5db"
              strokeDasharray="5,5"
              strokeWidth={1}
            />
            
            <Scatter
              name="Investments"
              data={chartData}
              shape={<CustomDot />}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Quadrant Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">High Impact Leaders</h3>
          <p className="text-sm text-green-700 mb-3">High ROI + High ESG Score</p>
          <div className="space-y-1">
            {investments
              .filter(inv => inv.roi >= avgROI && inv.esgScore >= avgESG)
              .slice(0, 3)
              .map(inv => (
                <div key={inv.id} className="text-xs text-green-600">
                  • {inv.name} ({inv.roi}% ROI, {inv.esgScore} ESG)
                </div>
              ))
            }
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Financial Focus</h3>
          <p className="text-sm text-blue-700 mb-3">High ROI + Lower ESG Score</p>
          <div className="space-y-1">
            {investments
              .filter(inv => inv.roi >= avgROI && inv.esgScore < avgESG)
              .slice(0, 3)
              .map(inv => (
                <div key={inv.id} className="text-xs text-blue-600">
                  • {inv.name} ({inv.roi}% ROI, {inv.esgScore} ESG)
                </div>
              ))
            }
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-purple-800 mb-2">Impact Focus</h3>
          <p className="text-sm text-purple-700 mb-3">Lower ROI + High ESG Score</p>
          <div className="space-y-1">
            {investments
              .filter(inv => inv.roi < avgROI && inv.esgScore >= avgESG)
              .slice(0, 3)
              .map(inv => (
                <div key={inv.id} className="text-xs text-purple-600">
                  • {inv.name} ({inv.roi}% ROI, {inv.esgScore} ESG)
                </div>
              ))
            }
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-semibold text-orange-800 mb-2">Emerging Opportunities</h3>
          <p className="text-sm text-orange-700 mb-3">Lower ROI + Lower ESG Score</p>
          <div className="space-y-1">
            {investments
              .filter(inv => inv.roi < avgROI && inv.esgScore < avgESG)
              .slice(0, 3)
              .map(inv => (
                <div key={inv.id} className="text-xs text-orange-600">
                  • {inv.name} ({inv.roi}% ROI, {inv.esgScore} ESG)
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span>Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>High Risk</span>
        </div>
        <div className="text-gray-600">
          • Bubble size = Investment amount
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Average ROI:</p>
            <p className="font-semibold text-emerald-600">{avgROI.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-600">Average ESG Score:</p>
            <p className="font-semibold text-green-600">{Math.round(avgESG)}</p>
          </div>
          <div>
            <p className="text-gray-600">Best Opportunity:</p>
            <p className="font-semibold text-blue-600">
              {investments.reduce((best, inv) => 
                (inv.roi + inv.esgScore) > (best.roi + best.esgScore) ? inv : best
              ).name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}