import React, { useState } from 'react';
import { 
  Filter, 
  X, 
  ChevronDown, 
  MapPin, 
  Building2, 
  Shield, 
  DollarSign, 
  Clock, 
  Leaf,
  Zap,
  Search
} from 'lucide-react';

interface FilterState {
  regions: string[];
  sectors: string[];
  riskLevels: string[];
  esgRange: [number, number];
  investmentRange: [number, number];
  timeHorizon: string[];
}

interface SmartFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  investments: any[];
  totalCount: number;
  filteredCount: number;
}

const SmartFilters: React.FC<SmartFiltersProps> = ({
  filters,
  onFiltersChange,
  investments,
  totalCount,
  filteredCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const regions = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Australia'];
  const sectors = ['Energy', 'Technology', 'Healthcare', 'Finance', 'Agriculture', 'Transportation', 'Infrastructure', 'Water'];
  const riskLevels = ['Low', 'Medium', 'High'];
  const timeHorizons = ['Short', 'Long'];

  const quickFilters = [
    { 
      name: 'High ESG', 
      icon: Leaf, 
      color: 'emerald',
      action: () => onFiltersChange({ ...filters, esgRange: [80, 100] })
    },
    { 
      name: 'Low Risk', 
      icon: Shield, 
      color: 'blue',
      action: () => onFiltersChange({ ...filters, riskLevels: ['Low'] })
    },
    { 
      name: 'Clean Energy', 
      icon: Zap, 
      color: 'yellow',
      action: () => onFiltersChange({ ...filters, sectors: ['Energy'] })
    },
    { 
      name: 'Tech Innovation', 
      icon: Building2, 
      color: 'purple',
      action: () => onFiltersChange({ ...filters, sectors: ['Technology'] })
    }
  ];

  const handleToggleFilter = (filterType: string, value: string) => {
    const currentValues = filters[filterType as keyof FilterState] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({
      ...filters,
      [filterType]: newValues
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      regions: [],
      sectors: [],
      riskLevels: [],
      esgRange: [0, 100],
      investmentRange: [1000, 1000000],
      timeHorizon: []
    });
  };

  const getActiveFilterCount = () => {
    return filters.regions.length + 
           filters.sectors.length + 
           filters.riskLevels.length + 
           filters.timeHorizon.length +
           (filters.esgRange[0] > 0 || filters.esgRange[1] < 100 ? 1 : 0) +
           (filters.investmentRange[0] > 1000 || filters.investmentRange[1] < 1000000 ? 1 : 0);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Smart Filters</h3>
              <p className="text-emerald-100 text-sm">Find your perfect sustainable investment</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 rounded-lg px-4 py-2">
              <div className="text-white font-bold text-lg">{filteredCount}</div>
              <div className="text-emerald-100 text-xs">of {totalCount} opportunities</div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ChevronDown className={`w-5 h-5 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          {quickFilters.map((filter) => (
            <button
              key={filter.name}
              onClick={filter.action}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors group"
            >
              <filter.icon className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">{filter.name}</span>
            </button>
          ))}
          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg px-3 py-2 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Clear All ({getActiveFilterCount()})</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Region Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold text-gray-900">Geographic Regions</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => handleToggleFilter('regions', region)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.regions.includes(region)
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Sector Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Industry Sectors</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {sectors.map((sector) => (
                <button
                  key={sector}
                  onClick={() => handleToggleFilter('sectors', sector)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.sectors.includes(sector)
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Level Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Risk Tolerance</h4>
            </div>
            <div className="flex gap-2">
              {riskLevels.map((risk) => (
                <button
                  key={risk}
                  onClick={() => handleToggleFilter('riskLevels', risk)}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                    filters.riskLevels.includes(risk)
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {risk} Risk
                </button>
              ))}
            </div>
          </div>

          {/* ESG Score Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">ESG Score Range</h4>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.esgRange[0]}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    esgRange: [parseInt(e.target.value), filters.esgRange[1]]
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>
              <div className="flex items-center gap-2 min-w-[120px]">
                <span className="text-sm font-medium text-gray-700">{filters.esgRange[0]}</span>
                <span className="text-gray-400">-</span>
                <span className="text-sm font-medium text-gray-700">{filters.esgRange[1]}</span>
              </div>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.esgRange[1]}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    esgRange: [filters.esgRange[0], parseInt(e.target.value)]
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>
            </div>
          </div>

          {/* Investment Size Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-gray-900">Investment Size</h4>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="range"
                  min="1000"
                  max="1000000"
                  step="10000"
                  value={filters.investmentRange[0]}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    investmentRange: [parseInt(e.target.value), filters.investmentRange[1]]
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>
              <div className="flex items-center gap-2 min-w-[160px]">
                <span className="text-sm font-medium text-gray-700">
                  ${(filters.investmentRange[0] / 1000).toFixed(0)}K
                </span>
                <span className="text-gray-400">-</span>
                <span className="text-sm font-medium text-gray-700">
                  ${(filters.investmentRange[1] / 1000).toFixed(0)}K
                </span>
              </div>
              <div className="flex-1">
                <input
                  type="range"
                  min="1000"
                  max="1000000"
                  step="10000"
                  value={filters.investmentRange[1]}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    investmentRange: [filters.investmentRange[0], parseInt(e.target.value)]
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>
            </div>
          </div>

          {/* Time Horizon */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">Investment Timeline</h4>
            </div>
            <div className="flex gap-2">
              {timeHorizons.map((horizon) => (
                <button
                  key={horizon}
                  onClick={() => handleToggleFilter('timeHorizon', horizon)}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                    filters.timeHorizon.includes(horizon)
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {horizon} Term
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {getActiveFilterCount() > 0 && (
        <div className="bg-gray-50 p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.regions.map((region) => (
                <span key={region} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-xs">
                  {region}
                  <button onClick={() => handleToggleFilter('regions', region)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filters.sectors.map((sector) => (
                <span key={sector} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                  {sector}
                  <button onClick={() => handleToggleFilter('sectors', sector)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filters.riskLevels.map((risk) => (
                <span key={risk} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs">
                  {risk} Risk
                  <button onClick={() => handleToggleFilter('riskLevels', risk)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartFilters;