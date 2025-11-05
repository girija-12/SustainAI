import { Filter, X } from 'lucide-react';
import Select, { components } from 'react-select';
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

export default function FilterSidebar({
  filters,
  onFiltersChange,
  investments,
  isHorizontal = false,
}: FilterSidebarProps) {
  const riskLevels = ['Low', 'Medium', 'High'];
  const timeHorizons = ['Short', 'Long'];

  const uniqueRegions = [...new Set(investments.map(inv => inv.region))];
  const uniqueSectors = [...new Set(investments.map(inv => inv.sector))];

  const handleSelectChange = (field: keyof FilterState, selected: any) => {
    onFiltersChange({
      ...filters,
      [field]: selected ? selected.map((s: any) => s.value) : [],
    });
  };

  const handleRangeChange = (field: 'esgRange' | 'investmentRange', index: 0 | 1, value: number) => {
    const currentRange = filters[field];
    const newRange: [number, number] = [...currentRange] as [number, number];
    newRange[index] = value;
    onFiltersChange({ ...filters, [field]: newRange });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      regions: [],
      sectors: [],
      riskLevels: [],
      esgRange: [0, 100],
      investmentRange: [1000, 1000000],
      timeHorizon: [],
    });
  };

  const clearFilterValue = (field: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: (filters[field] as string[]).filter(v => v !== value),
    });
  };

  const getActiveFilterCount = () =>
    filters.regions.length +
    filters.sectors.length +
    filters.riskLevels.length +
    filters.timeHorizon.length +
    (filters.esgRange[0] > 0 || filters.esgRange[1] < 100 ? 1 : 0) +
    (filters.investmentRange[0] > 1000 || filters.investmentRange[1] < 1000000 ? 1 : 0);

  // 💅 Compact react-select styling
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: '0.375rem',
      borderColor: '#d1d5db',
      minHeight: '1.875rem',
      height: '1.875rem',
      fontSize: '0.85rem',
      boxShadow: 'none',
      '&:hover': { borderColor: '#10b981' },
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: '0 0.25rem',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: '#d1fae5',
      color: '#065f46',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#065f46',
      fontSize: '0.75rem',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#047857',
      ':hover': { backgroundColor: '#a7f3d0', color: '#064e3b' },
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999, // ✅ Fixes dropdown hidden issue
    }),
    menu: (base: any) => ({
      ...base,
      zIndex: 9999,
      fontSize: '0.85rem',
    }),
  };

  if (!isHorizontal) return null;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base font-semibold text-gray-900">Filters</h2>
          {getActiveFilterCount() > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        {getActiveFilterCount() > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      {/* 🔹 Compact Horizontal Filter Layout */}
      <div className="flex flex-wrap gap-4">
        {/* Regions */}
        <div className="min-w-[150px] flex-shrink-0">
          <label className="block text-[0.7rem] text-gray-500 mb-1">Regions</label>
          <Select
            isMulti
            menuPortalTarget={document.body}
            options={uniqueRegions.map(r => ({ value: r, label: r }))}
            value={filters.regions.map(r => ({ value: r, label: r }))}
            onChange={(selected) => handleSelectChange('regions', selected)}
            placeholder="Select..."
            components={{
              MultiValue: () => null,
              MultiValueContainer: () => null,
            }}
          />
        </div>

        {/* Sectors */}
        <div className="min-w-[150px] flex-shrink-0">
          <label className="block text-[0.7rem] text-gray-500 mb-1">Sectors</label>
          <Select
            isMulti
            menuPortalTarget={document.body}
            options={uniqueSectors.map(s => ({ value: s, label: s }))}
            value={filters.sectors.map(s => ({ value: s, label: s }))}
            onChange={(selected) => handleSelectChange('sectors', selected)}
            placeholder="Select..."
            components={{
              MultiValue: () => null,
              MultiValueContainer: () => null,
            }}
          />
        </div>

        {/* Risk Levels */}
        <div className="min-w-[130px] flex-shrink-0">
          <label className="block text-[0.7rem] text-gray-500 mb-1">Risk</label>
          <Select
            isMulti
            menuPortalTarget={document.body}
            options={riskLevels.map(r => ({ value: r, label: r }))}
            value={filters.riskLevels.map(r => ({ value: r, label: r }))}
            onChange={(selected) => handleSelectChange('riskLevels', selected)}
            placeholder="Select..."
            components={{
              MultiValue: () => null,
              MultiValueContainer: () => null,
            }}
          />
        </div>

        {/* Time Horizon */}
        <div className="min-w-[130px] flex-shrink-0">
          <label className="block text-[0.7rem] text-gray-500 mb-1">Time Horizon</label>
          <Select
            isMulti
            menuPortalTarget={document.body}
            options={timeHorizons.map(t => ({ value: t, label: t }))}
            value={filters.timeHorizon.map(t => ({ value: t, label: t }))}
            onChange={(selected) => handleSelectChange('timeHorizon', selected)}
            placeholder="Select..."
            components={{
              MultiValue: () => null,
              MultiValueContainer: () => null,
            }}
          />
        </div>

        {/* ESG Score */}
        <div className="min-w-[150px] flex-shrink-0">
          <label className="block text-[0.7rem] text-gray-500 mb-1">ESG</label>
          <div className="flex gap-1">
            <input
              type="number"
              value={filters.esgRange[0]}
              onChange={(e) => handleRangeChange('esgRange', 0, Number(e.target.value))}
              className="w-1/2 px-1.5 py-1 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
              min={0}
              max={100}
              placeholder="Min"
            />
            <input
              type="number"
              value={filters.esgRange[1]}
              onChange={(e) => handleRangeChange('esgRange', 1, Number(e.target.value))}
              className="w-1/2 px-1.5 py-1 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
              min={0}
              max={100}
              placeholder="Max"
            />
          </div>
        </div>

        {/* Investment Range */}
        <div className="min-w-[170px] flex-shrink-0">
          <label className="block text-[0.7rem] text-gray-500 mb-1">Investment ($)</label>
          <div className="flex gap-1">
            <input
              type="number"
              value={filters.investmentRange[0]}
              onChange={(e) => handleRangeChange('investmentRange', 0, Number(e.target.value))}
              className="w-1/2 px-1.5 py-1 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
              min={1000}
              max={1000000}
              step={1000}
              placeholder="Min"
            />
            <input
              type="number"
              value={filters.investmentRange[1]}
              onChange={(e) => handleRangeChange('investmentRange', 1, Number(e.target.value))}
              className="w-1/2 px-1.5 py-1 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
              min={1000}
              max={1000000}
              step={1000}
              placeholder="Max"
            />
          </div>
        </div>
      </div>
      {/* 🔸 Selected Filters Row (Separate Row Below) */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-nowrap overflow-x-auto gap-2 mt-3 pt-2 border-t border-gray-100 pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {/* Regions */}
          {filters.regions.map(region => (
            <span
              key={`region-${region}`}
              className="flex items-center bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full flex-shrink-0"
            >
              {region}
              <button
                onClick={() => clearFilterValue('regions', region)}
                className="ml-1 text-emerald-700 hover:text-emerald-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Sectors */}
          {filters.sectors.map(sector => (
            <span
              key={`sector-${sector}`}
              className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex-shrink-0"
            >
              {sector}
              <button
                onClick={() => clearFilterValue('sectors', sector)}
                className="ml-1 text-blue-700 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Risk Levels */}
          {filters.riskLevels.map(risk => (
            <span
              key={`risk-${risk}`}
              className="flex items-center bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex-shrink-0"
            >
              {risk}
              <button
                onClick={() => clearFilterValue('riskLevels', risk)}
                className="ml-1 text-amber-700 hover:text-amber-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Time Horizon */}
          {filters.timeHorizon.map(time => (
            <span
              key={`time-${time}`}
              className="flex items-center bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex-shrink-0"
            >
              {time}
              <button
                onClick={() => clearFilterValue('timeHorizon', time)}
                className="ml-1 text-purple-700 hover:text-purple-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* ESG Range */}
          {(filters.esgRange[0] > 0 || filters.esgRange[1] < 100) && (
            <span className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex-shrink-0">
              ESG: {filters.esgRange[0]} - {filters.esgRange[1]}
              <button
                onClick={() => onFiltersChange({ ...filters, esgRange: [0, 100] })}
                className="ml-1 text-gray-600 hover:text-gray-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Investment Range */}
          {(filters.investmentRange[0] > 1000 || filters.investmentRange[1] < 1000000) && (
            <span className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex-shrink-0">
              Investment: ${filters.investmentRange[0].toLocaleString()} - ${filters.investmentRange[1].toLocaleString()}
              <button
                onClick={() => onFiltersChange({ ...filters, investmentRange: [1000, 1000000] })}
                className="ml-1 text-gray-600 hover:text-gray-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}