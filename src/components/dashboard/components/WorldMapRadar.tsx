import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, Zap, Leaf, DollarSign, Globe, Activity } from 'lucide-react';

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

interface WorldMapRadarProps {
  investments: Investment[];
  onInvestmentSelect: (investment: Investment) => Promise<void>;
  className?: string;
}

const WorldMapRadar: React.FC<WorldMapRadarProps> = ({ 
  investments, 
  onInvestmentSelect,
  className = ""
}) => {
  const [hoveredInvestment, setHoveredInvestment] = useState<Investment | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Animation for radar sweep effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Convert lat/lng to SVG coordinates
  const projectToSVG = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return '#10B981'; // emerald-500
      case 'Medium': return '#F59E0B'; // amber-500
      case 'High': return '#EF4444'; // red-500
      default: return '#6B7280'; // gray-500
    }
  };

  const getSectorIcon = (sector: string) => {
    switch (sector) {
      case 'Energy': return Zap;
      case 'Technology': return Activity;
      case 'Agriculture': return Leaf;
      default: return DollarSign;
    }
  };

  return (
    <div className={`relative bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 rounded-2xl overflow-hidden ${className}`}>
      {/* Radar Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            </pattern>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(16,185,129,0.3)" />
              <stop offset="50%" stopColor="rgba(16,185,129,0.1)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0)" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Radar Sweep Animation */}
          <g transform="translate(500, 250)">
            <circle r="200" fill="url(#radarGradient)" opacity="0.5" />
            <circle r="150" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            <circle r="100" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            <circle r="50" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            
            {/* Animated Radar Sweep */}
            <line
              x1="0"
              y1="0"
              x2={200 * Math.cos((animationPhase * Math.PI) / 180)}
              y2={200 * Math.sin((animationPhase * Math.PI) / 180)}
              stroke="rgba(16,185,129,0.8)"
              strokeWidth="2"
              opacity="0.7"
            />
          </g>
        </svg>
      </div>

      {/* World Map Outline */}
      <svg 
        viewBox="0 0 1000 500" 
        className="w-full h-full absolute inset-0"
        style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.3))' }}
      >
        {/* Simplified World Map Paths */}
        <g fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1">
          {/* North America */}
          <path d="M 150 120 L 280 100 L 320 140 L 300 180 L 250 200 L 180 190 L 120 160 Z" />
          
          {/* South America */}
          <path d="M 250 220 L 280 240 L 290 320 L 270 380 L 240 360 L 230 280 Z" />
          
          {/* Europe */}
          <path d="M 450 100 L 520 90 L 540 120 L 520 140 L 480 130 L 440 120 Z" />
          
          {/* Africa */}
          <path d="M 480 160 L 520 150 L 540 200 L 530 280 L 500 320 L 470 300 L 460 220 Z" />
          
          {/* Asia */}
          <path d="M 550 80 L 750 70 L 800 120 L 780 180 L 720 200 L 650 160 L 580 140 Z" />
          
          {/* Australia */}
          <path d="M 720 280 L 780 270 L 800 300 L 780 320 L 740 310 Z" />
        </g>

        {/* Investment Points */}
        {investments.map((investment) => {
          const { x, y } = projectToSVG(investment.lat, investment.lng);
          const SectorIcon = getSectorIcon(investment.sector);
          
          return (
            <g key={investment.id}>
              {/* Pulsing Ring Animation */}
              <circle
                cx={x}
                cy={y}
                r="15"
                fill="none"
                stroke={getRiskColor(investment.risk)}
                strokeWidth="2"
                opacity="0.6"
              >
                <animate
                  attributeName="r"
                  values="15;25;15"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;0.2;0.6"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              
              {/* Investment Point */}
              <circle
                cx={x}
                cy={y}
                r="8"
                fill={getRiskColor(investment.risk)}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:r-10 transition-all"
                onMouseEnter={() => setHoveredInvestment(investment)}
                onMouseLeave={() => setHoveredInvestment(null)}
                onClick={async () => await onInvestmentSelect(investment)}
              />
              
              {/* ROI Indicator */}
              {investment.prediction === 'up' && (
                <g transform={`translate(${x + 12}, ${y - 12})`}>
                  <circle r="6" fill="rgba(16,185,129,0.9)" />
                  <path
                    d="M -2 2 L 0 -2 L 2 2 Z"
                    fill="white"
                    strokeWidth="0.5"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Investment Tooltip */}
      {hoveredInvestment && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/20 max-w-sm z-10">
          <div className="flex items-start gap-3">
            <div className={`w-3 h-3 rounded-full mt-1`} style={{ backgroundColor: getRiskColor(hoveredInvestment.risk) }}></div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">{hoveredInvestment.name}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected ROI:</span>
                  <span className="font-semibold text-emerald-600">{hoveredInvestment.roi}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ESG Score:</span>
                  <span className="font-semibold text-blue-600">{hoveredInvestment.esgScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Risk Level:</span>
                  <span className={`font-semibold ${
                    hoveredInvestment.risk === 'Low' ? 'text-green-600' :
                    hoveredInvestment.risk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {hoveredInvestment.risk}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Investment:</span>
                  <span className="font-semibold text-gray-900">
                    ${(hoveredInvestment.investmentSize / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>
              <button
                onClick={async () => await onInvestmentSelect(hoveredInvestment)}
                className="mt-3 w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-teal-700 transition-all"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/20">
        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600" />
          Investment Radar
        </h5>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-700">Low Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-700">Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-700">High Risk</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span className="text-gray-700">Growth Potential</span>
          </div>
        </div>
      </div>

      {/* Stats Overlay */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/20">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{investments.length}</div>
          <div className="text-sm text-gray-600">Active Opportunities</div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Avg ROI:</span>
            <span className="font-semibold text-emerald-600">
              {(investments.reduce((sum, inv) => sum + inv.roi, 0) / investments.length || 0).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Avg ESG:</span>
            <span className="font-semibold text-blue-600">
              {Math.round(investments.reduce((sum, inv) => sum + inv.esgScore, 0) / investments.length || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Scanning Animation Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent"
          style={{
            transform: `translateX(${(animationPhase / 360) * 100 - 50}%)`,
            width: '200%',
            transition: 'transform 0.05s linear'
          }}
        />
      </div>
    </div>
  );
};

export default WorldMapRadar;