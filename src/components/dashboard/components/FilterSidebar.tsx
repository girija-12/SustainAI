import { useState } from 'react';
import { Filter, ChevronDown, X, Sliders } from 'lucide-react';

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

interface FilterState {
  regions: string[];
  sectors: string[];
  riskLevels: string[];
  esgRange: [number, number];
  investmentRange: [number, number];
  timeHorizon: string[];
}

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  investments: Investment[];
  isHorizontal?: boolean;
}

export default function FilterSidebar({ filters, onFiltersChange, investments, isHorizontal = false }: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['regions', 'sectors']);

  // Extract unique values from investments
  const uniqueRegions = [...new Set(investments.map(inv => inv.region))];
  const uniqueSectors = [...new Set(investments.map(inv => inv.sector))];
  const riskLevels = ['Low', 'Medium', 'High'];
  const timeHorizons = ['Short', 'Long'];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleMultiSelect = (field: keyof FilterState, value: string) => {
    const currentValues = filters[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({
      ...filters,
      [field]: newValues
    });
  };

  const handleRangeChange = (field: 'esgRange' | 'investmentRange', index: 0 | 1, value: number) => {
    const currentRange = filters[field];
    const newRange: [number, number] = [...currentRange] as [number, number];
    newRange[index] = value;
    
    onFiltersChange({
      ...filters,
      [field]: newRange
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

  const FilterSection = ({ 
    title, 
    field, 
    options, 
    icon 
  }: { 
    title: string; 
    field: keyof FilterState; 
    options: string[]; 
    icon?: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.includes(field);
    const selectedValues = filters[field] as string[];

    return (
      <div className="border border-gray-200 rounded-lg bg-white">
        <button
          onClick={() => toggleSection(field)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-gray-900 text-sm">{title}</span>
            {selectedValues.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                {selectedValues.length}
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        
        {isExpanded && (
          <div className="px-3 pb-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const selected = selectedValues.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleMultiSelect(field, option)}
                    className={`text-sm px-3 py-1 rounded-full border transition-colors ${selected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const RangeSlider = ({ 
    title, 
    field, 
    min, 
    max, 
    step = 1, 
    prefix = '', 
    suffix = '',
    icon 
  }: {
    title: string;
    field: 'esgRange' | 'investmentRange';
    min: number;
    max: number;
    step?: number;
    prefix?: string;
    suffix?: string;
    icon?: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.includes(field);
    const [minVal, maxVal] = filters[field];
    const isActive = minVal > min || maxVal < max;

    return (
      <div className="border border-gray-200 rounded-lg bg-white">
        <button
          onClick={() => toggleSection(field)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-gray-900 text-sm">{title}</span>
            {isActive && (
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        
        {isExpanded && (
          <div className="px-3 pb-3 pt-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min</label>
                <input
                  type="number"
                  value={minVal}
                  onChange={(e) => handleRangeChange(field, 0, Number(e.target.value))}
                  min={min}
                  max={maxVal}
                  step={step}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max</label>
                <input
                  type="number"
                  value={maxVal}
                  onChange={(e) => handleRangeChange(field, 1, Number(e.target.value))}
                  min={minVal}
                  max={max}
                  step={step}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <div className="relative h-8">
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={minVal}
                  onChange={(e) => handleRangeChange(field, 0, Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={maxVal}
                  onChange={(e) => handleRangeChange(field, 1, Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb absolute top-0 left-0"
                />
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-600">
              <span>{prefix}{minVal.toLocaleString()}{suffix}</span>
              <span>{prefix}{maxVal.toLocaleString()}{suffix}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isHorizontal) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Filters</h2>
            {getActiveFilterCount() > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-sm px-2 py-1 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {/* Horizontal Filter Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Region Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Region</label>
              <div className="flex flex-wrap gap-2">
                {uniqueRegions.map(region => {
                  const selected = filters.regions.includes(region);
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => handleMultiSelect('regions', region)}
                      className={`text-sm px-3 py-1 rounded-full border ${selected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                    >
                      {region}
                    </button>
                  );
                })}
              </div>
            </div>

          {/* Sector Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sector</label>
            <div className="flex flex-wrap gap-2">
              {uniqueSectors.map(sector => {
                const selected = filters.sectors.includes(sector);
                return (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => handleMultiSelect('sectors', sector)}
                    className={`text-sm px-3 py-1 rounded-full border ${selected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                  >
                    {sector}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Risk Level Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Risk Level</label>
            <div className="flex flex-wrap gap-2">
              {riskLevels.map(risk => {
                const selected = filters.riskLevels.includes(risk);
                return (
                  <button
                    key={risk}
                    type="button"
                    onClick={() => handleMultiSelect('riskLevels', risk)}
                    className={`text-sm px-3 py-1 rounded-full border ${selected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                  >
                    {risk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Horizon Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Time Horizon</label>
            <div className="flex flex-wrap gap-2">
              {timeHorizons.map(horizon => {
                const selected = filters.timeHorizon.includes(horizon);
                return (
                  <button
                    key={horizon}
                    type="button"
                    onClick={() => handleMultiSelect('timeHorizon', horizon)}
                    className={`text-sm px-3 py-1 rounded-full border ${selected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                  >
                    {horizon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ESG Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">ESG Score</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={filters.esgRange[0]}
                onChange={(e) => handleRangeChange('esgRange', 0, Number(e.target.value))}
                min={0}
                max={100}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Min"
              />
              <input
                type="number"
                value={filters.esgRange[1]}
                onChange={(e) => handleRangeChange('esgRange', 1, Number(e.target.value))}
                min={0}
                max={100}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Investment Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Investment Size</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={filters.investmentRange[0]}
                onChange={(e) => handleRangeChange('investmentRange', 0, Number(e.target.value))}
                min={1000}
                max={1000000}
                step={1000}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Min"
              />
              <input
                type="number"
                value={filters.investmentRange[1]}
                onChange={(e) => handleRangeChange('investmentRange', 1, Number(e.target.value))}
                min={1000}
                max={1000000}
                step={1000}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        {/* Quick Filter Presets */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => onFiltersChange({
              ...filters,
              esgRange: [80, 100],
              riskLevels: ['Low']
            })}
            className="px-4 py-2 text-sm bg-green-50 text-green-800 rounded-lg hover:bg-green-100 transition-colors"
          >
            High ESG, Low Risk
          </button>
          <button
            onClick={() => onFiltersChange({
              ...filters,
              sectors: ['Energy', 'Infrastructure'],
              timeHorizon: ['Long']
            })}
            className="px-4 py-2 text-sm bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Clean Energy Focus
          </button>
          <button
            onClick={() => onFiltersChange({
              ...filters,
              regions: ['Africa', 'Asia'],
              sectors: ['Water', 'Agriculture']
            })}
            className="px-4 py-2 text-sm bg-purple-50 text-purple-800 rounded-lg hover:bg-purple-100 transition-colors"
          >
            Emerging Markets Impact
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {getActiveFilterCount() > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-sm px-2 py-1 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        {getActiveFilterCount() > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        <FilterSection
          title="Regions"
          field="regions"
          options={uniqueRegions}
          icon={<div className="w-4 h-4 bg-blue-500 rounded-full"></div>}
        />

        <FilterSection
          title="Sectors"
          field="sectors"
          options={uniqueSectors}
          icon={<div className="w-4 h-4 bg-green-500 rounded-full"></div>}
        />

        <FilterSection
          title="Risk Level"
          field="riskLevels"
          options={riskLevels}
          icon={<div className="w-4 h-4 bg-yellow-500 rounded-full"></div>}
        />

        <FilterSection
          title="Time Horizon"
          field="timeHorizon"
          options={timeHorizons}
          icon={<div className="w-4 h-4 bg-purple-500 rounded-full"></div>}
        />

        <RangeSlider
          title="ESG Score"
          field="esgRange"
          min={0}
          max={100}
          step={1}
          suffix=""
          icon={<Sliders className="w-4 h-4 text-green-600" />}
        />

        <RangeSlider
          title="Investment Size"
          field="investmentRange"
          min={1000}
          max={1000000}
          step={1000}
          prefix="$"
          suffix=""
          icon={<Sliders className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Quick Filter Presets */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Filters</h3>
        <div className="space-y-2">
          <button
            onClick={() => onFiltersChange({
              ...filters,
              esgRange: [80, 100],
              riskLevels: ['Low']
            })}
            className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-800 rounded-lg hover:bg-green-100 transition-colors"
          >
            High ESG, Low Risk
          </button>
          <button
            onClick={() => onFiltersChange({
              ...filters,
              sectors: ['Energy', 'Infrastructure'],
              timeHorizon: ['Long']
            })}
            className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Clean Energy Focus
          </button>
          <button
            onClick={() => onFiltersChange({
              ...filters,
              regions: ['Africa', 'Asia'],
              sectors: ['Water', 'Agriculture']
            })}
            className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-800 rounded-lg hover:bg-purple-100 transition-colors"
          >
            Emerging Markets Impact
          </button>
        </div>
      </div>

      {/* Filter Summary */}
      {getActiveFilterCount() > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Active Filters</h3>
          <div className="space-y-2">
            {filters.regions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.regions.map(region => (
                  <span key={region} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {region}
                    <button onClick={() => handleMultiSelect('regions', region)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {filters.sectors.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.sectors.map(sector => (
                  <span key={sector} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {sector}
                    <button onClick={() => handleMultiSelect('sectors', sector)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}