import { useState } from 'react';
import { ChevronUp, ChevronDown, Search, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

interface TopOpportunitiesTableProps {
  investments: Investment[];
  searchTerm: string;
  sortBy: 'roi' | 'esgScore' | 'risk';
  onSortChange: (sortBy: 'roi' | 'esgScore' | 'risk') => void;
  onInvestmentSelect: (investment: Investment) => void;
}

export default function TopOpportunitiesTable({ 
  investments, 
  searchTerm, 
  sortBy, 
  onSortChange, 
  onInvestmentSelect 
}: TopOpportunitiesTableProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and sort investments
  const filteredInvestments = investments
    .filter(inv => 
      inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.sector.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'roi':
          aValue = a.roi;
          bValue = b.roi;
          break;
        case 'esgScore':
          aValue = a.esgScore;
          bValue = b.esgScore;
          break;
        case 'risk':
          aValue = a.risk === 'Low' ? 1 : a.risk === 'Medium' ? 2 : 3;
          bValue = b.risk === 'Low' ? 1 : b.risk === 'Medium' ? 2 : 3;
          break;
        default:
          aValue = a.roi;
          bValue = b.roi;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredInvestments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvestments = filteredInvestments.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column: 'roi' | 'esgScore' | 'risk') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ column }: { column: 'roi' | 'esgScore' | 'risk' }) => {
    if (sortBy !== column) return <ChevronUp className="w-4 h-4 text-gray-400" />;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-emerald-600" /> : 
      <ChevronDown className="w-4 h-4 text-emerald-600" />;
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Top Investment Opportunities</h2>
          <div className="text-sm text-gray-600">
            {filteredInvestments.length} opportunities found
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, region, or sector..."
              value={searchTerm}
              readOnly
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'roi' | 'esgScore' | 'risk')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="roi">Expected ROI</option>
              <option value="esgScore">ESG Score</option>
              <option value="risk">Risk Level</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('esgScore')}
              >
                <div className="flex items-center gap-1">
                  ESG Score
                  <SortIcon column="esgScore" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('roi')}
              >
                <div className="flex items-center gap-1">
                  Expected ROI
                  <SortIcon column="roi" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Region
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('risk')}
              >
                <div className="flex items-center gap-1">
                  Risk Level
                  <SortIcon column="risk" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prediction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedInvestments.map((investment, index) => (
              <tr 
                key={investment.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onInvestmentSelect(investment)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{investment.name}</div>
                    <div className="text-sm text-gray-500">{investment.sector} • {investment.impact}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {investment.sdgAlignment.slice(0, 2).map((sdg, idx) => (
                        <span key={idx} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {sdg}
                        </span>
                      ))}
                      {investment.sdgAlignment.length > 2 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{investment.sdgAlignment.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{investment.esgScore}</div>
                    <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${investment.esgScore}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-emerald-600">{investment.roi}%</div>
                  <div className="text-xs text-gray-500">{investment.timeHorizon} term</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{investment.region}</div>
                  <div className="text-xs text-gray-500">
                    Climate Risk: {investment.climateRisk}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskBadgeColor(investment.risk)}`}>
                    {investment.risk}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {getPredictionIcon(investment.prediction)}
                    <span className="text-sm text-gray-600 capitalize">{investment.prediction}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInvestmentSelect(investment);
                    }}
                    className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1"
                  >
                    View Details
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredInvestments.length)} of {filteredInvestments.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-emerald-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      currentPage === totalPages
                        ? 'bg-emerald-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredInvestments.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-500 mb-2">No investments found</div>
          <div className="text-sm text-gray-400">Try adjusting your search or filters</div>
        </div>
      )}
    </div>
  );
}