import { useEffect, useRef } from 'react';
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

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

interface GlobalInvestmentMapProps {
  investments: Investment[];
  onInvestmentSelect: (investment: Investment) => Promise<void>;
}

export default function GlobalInvestmentMap({ investments, onInvestmentSelect }: GlobalInvestmentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // For now, we'll create a simplified world map visualization
  // In production, you would integrate with Leaflet or Mapbox
  const regions = [
    { name: 'North America', x: 20, y: 30, investments: investments.filter(inv => inv.region === 'North America') },
    { name: 'South America', x: 30, y: 60, investments: investments.filter(inv => inv.region === 'South America') },
    { name: 'Europe', x: 50, y: 25, investments: investments.filter(inv => inv.region === 'Europe') },
    { name: 'Africa', x: 52, y: 50, investments: investments.filter(inv => inv.region === 'Africa') },
    { name: 'Asia', x: 70, y: 35, investments: investments.filter(inv => inv.region === 'Asia') },
    { name: 'Australia', x: 80, y: 70, investments: investments.filter(inv => inv.region === 'Australia') },
  ];

  const getRegionColor = (regionInvestments: Investment[]) => {
    if (regionInvestments.length === 0) return 'bg-gray-300';
    
    const avgRisk = regionInvestments.reduce((acc, inv) => {
      const riskScore = inv.risk === 'Low' ? 1 : inv.risk === 'Medium' ? 2 : 3;
      return acc + riskScore;
    }, 0) / regionInvestments.length;
    
    const avgROI = regionInvestments.reduce((acc, inv) => acc + inv.roi, 0) / regionInvestments.length;
    
    // High ROI, Low Risk = Green
    if (avgROI > 12 && avgRisk < 2) return 'bg-green-500';
    // Medium performance = Yellow
    if (avgROI > 8 && avgRisk < 2.5) return 'bg-yellow-500';
    // High risk or low return = Red
    return 'bg-red-500';
  };

  const getRegionStats = (regionInvestments: Investment[]) => {
    if (regionInvestments.length === 0) return null;
    
    const avgROI = (regionInvestments.reduce((acc, inv) => acc + inv.roi, 0) / regionInvestments.length).toFixed(1);
    const avgESG = Math.round(regionInvestments.reduce((acc, inv) => acc + inv.esgScore, 0) / regionInvestments.length);
    const topProject = regionInvestments.reduce((max, inv) => inv.roi > max.roi ? inv : max);
    
    return { avgROI, avgESG, topProject, count: regionInvestments.length };
  };

  return (
    <div className="relative">
      {/* Enhanced World Map */}
      <div 
        ref={mapRef}
        className="relative w-full h-96 bg-gradient-to-b from-blue-100 to-blue-50 rounded-xl overflow-hidden border border-gray-200"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 70% 35%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)
          `
        }}
      >
        {/* Ocean/Background with subtle pattern */}
        <div className="absolute inset-0 bg-blue-50 opacity-60"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
        
        {/* Enhanced World Map SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" floodColor="rgba(0,0,0,0.2)"/>
            </filter>
          </defs>
          
          {/* North America */}
          <path
            d="M 8 18 Q 12 12 18 15 Q 25 12 32 18 Q 35 22 33 28 Q 30 35 25 38 Q 20 40 15 38 Q 10 35 8 30 Q 6 25 8 18 Z"
            fill="rgba(34, 197, 94, 0.3)"
            stroke="rgba(34, 197, 94, 0.6)"
            strokeWidth="0.3"
            filter="url(#shadow)"
            className="hover:fill-opacity-50 transition-all duration-300 cursor-pointer"
          />
          
          {/* South America */}
          <path
            d="M 22 42 Q 28 38 32 45 Q 34 52 32 60 Q 30 68 26 72 Q 22 75 18 72 Q 16 68 18 62 Q 20 55 22 48 Q 24 45 22 42 Z"
            fill="rgba(245, 158, 11, 0.3)"
            stroke="rgba(245, 158, 11, 0.6)"
            strokeWidth="0.3"
            filter="url(#shadow)"
            className="hover:fill-opacity-50 transition-all duration-300 cursor-pointer"
          />
          
          {/* Europe */}
          <path
            d="M 42 12 Q 48 8 55 12 Q 58 15 56 20 Q 54 25 50 28 Q 46 30 42 28 Q 40 25 42 20 Q 44 15 42 12 Z"
            fill="rgba(59, 130, 246, 0.3)"
            stroke="rgba(59, 130, 246, 0.6)"
            strokeWidth="0.3"
            filter="url(#shadow)"
            className="hover:fill-opacity-50 transition-all duration-300 cursor-pointer"
          />
          
          {/* Africa */}
          <path
            d="M 45 32 Q 50 28 56 32 Q 60 38 58 48 Q 56 58 52 65 Q 48 68 44 65 Q 42 58 44 48 Q 46 38 45 32 Z"
            fill="rgba(168, 85, 247, 0.3)"
            stroke="rgba(168, 85, 247, 0.6)"
            strokeWidth="0.3"
            filter="url(#shadow)"
            className="hover:fill-opacity-50 transition-all duration-300 cursor-pointer"
          />
          
          {/* Asia */}
          <path
            d="M 62 15 Q 70 10 80 15 Q 88 18 90 25 Q 88 32 82 38 Q 75 42 68 38 Q 62 35 60 28 Q 58 22 62 15 Z"
            fill="rgba(239, 68, 68, 0.3)"
            stroke="rgba(239, 68, 68, 0.6)"
            strokeWidth="0.3"
            filter="url(#shadow)"
            className="hover:fill-opacity-50 transition-all duration-300 cursor-pointer"
          />
          
          {/* Australia */}
          <path
            d="M 72 62 Q 78 58 85 62 Q 88 65 86 70 Q 84 75 78 78 Q 72 75 70 70 Q 68 65 72 62 Z"
            fill="rgba(16, 185, 129, 0.3)"
            stroke="rgba(16, 185, 129, 0.6)"
            strokeWidth="0.3"
            filter="url(#shadow)"
            className="hover:fill-opacity-50 transition-all duration-300 cursor-pointer"
          />
          
          {/* Grid lines for reference */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>

        {/* Investment Markers */}
        {regions.map((region, index) => {
          const stats = getRegionStats(region.investments);
          if (!stats) return null;

          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${region.x}%`, top: `${region.y}%` }}
              onClick={() => stats.topProject && onInvestmentSelect(stats.topProject)}
            >
              {/* Marker */}
              <div className={`w-6 h-6 rounded-full ${getRegionColor(region.investments)} border-2 border-white shadow-lg animate-pulse`}>
                <div className="w-full h-full rounded-full bg-white bg-opacity-30"></div>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 min-w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45"></div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{region.name}</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Opportunities:</span>
                    <span className="font-medium">{stats.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg ROI:</span>
                    <span className="font-medium text-emerald-600">{stats.avgROI}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg ESG:</span>
                    <span className="font-medium text-green-600">{stats.avgESG}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Top Project:</p>
                  <p className="font-medium text-sm">{stats.topProject.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                      {stats.topProject.roi}% ROI
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      stats.topProject.risk === 'Low' ? 'bg-green-100 text-green-800' :
                      stats.topProject.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {stats.topProject.risk} Risk
                    </span>
                  </div>
                </div>
                
                <button className="w-full mt-3 bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>High Impact, Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span>Moderate Performance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>High Risk / Low Return</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
          <span>No Opportunities</span>
        </div>
      </div>

      {/* Regional Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.filter(region => region.investments.length > 0).map((region, index) => {
          const stats = getRegionStats(region.investments);
          if (!stats) return null;

          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{region.name}</h4>
                <div className={`w-3 h-3 rounded-full ${getRegionColor(region.investments)}`}></div>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Projects:</span>
                  <span className="font-medium">{stats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg ROI:</span>
                  <span className="font-medium text-emerald-600">{stats.avgROI}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg ESG:</span>
                  <span className="font-medium text-green-600">{stats.avgESG}</span>
                </div>
              </div>
              
              <button 
                onClick={() => onInvestmentSelect(stats.topProject)}
                className="w-full mt-3 text-xs bg-gray-100 hover:bg-gray-200 py-2 rounded transition-colors"
              >
                View Top Project
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}