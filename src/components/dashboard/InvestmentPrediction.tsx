import { useState } from 'react';
import ChatWidget from '../shared/ChatWidget';

export default function InvestmentPrediction() {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedImpact, setSelectedImpact] = useState('all');
  
  const investments = [
    { id: 1, name: 'Solar Energy Fund', region: 'North America', impact: 'Environmental', roi: 12.5, risk: 'Low', prediction: 'up' },
    { id: 2, name: 'Clean Water Initiative', region: 'Africa', impact: 'Social', roi: 8.3, risk: 'Medium', prediction: 'up' },
    { id: 3, name: 'Sustainable Agriculture', region: 'Asia', impact: 'Environmental', roi: 15.2, risk: 'Medium', prediction: 'up' },
    { id: 4, name: 'Education Technology', region: 'Europe', impact: 'Social', roi: 10.8, risk: 'Low', prediction: 'stable' },
    { id: 5, name: 'Green Transportation', region: 'South America', impact: 'Environmental', roi: 14.1, risk: 'High', prediction: 'up' },
  ];

  const predictionData = [
    { month: 'Jan', value: 100 },
    { month: 'Feb', value: 105 },
    { month: 'Mar', value: 108 },
    { month: 'Apr', value: 112 },
    { month: 'May', value: 118 },
    { month: 'Jun', value: 125 },
  ];

  const chatMessages = [
    { role: 'assistant' as const, content: 'Hi! I\'m EcoVest, your sustainable investment advisor. I can help you find impactful investment opportunities.' },
    { role: 'user' as const, content: 'I want to invest $50k in environmental projects with good returns' },
    { role: 'assistant' as const, content: 'Great choice! Based on your criteria, I recommend: 1) Sustainable Agriculture Fund (15.2% ROI, medium risk), 2) Green Transportation (14.1% ROI, higher risk but strong growth), 3) Solar Energy Fund (12.5% ROI, low risk). Would you like detailed analysis on any of these?' }
  ];

  const regions = ['all', 'North America', 'Europe', 'Asia', 'Africa', 'South America'];
  const impacts = ['all', 'Environmental', 'Social'];

  const filteredInvestments = investments.filter(inv => 
    (selectedRegion === 'all' || inv.region === selectedRegion) &&
    (selectedImpact === 'all' || inv.impact === selectedImpact)
  );

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* AI Agent Card */}
      <div className="lg:col-span-1">
        <ChatWidget
          agentName="EcoVest"
          agentDescription="AI financial advisor for sustainable and impactful investments"
          messages={chatMessages}
          placeholder="Ask about investment opportunities..."
          bgColor="from-emerald-500 to-teal-600"
        />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Prediction Graph */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Portfolio Performance Prediction</h3>
          <div className="h-64 flex items-end justify-between gap-4">
            {predictionData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t-lg transition-all duration-1000"
                  style={{ height: `${(data.value - 90) * 8}px` }}
                ></div>
                <p className="text-sm text-gray-600 mt-2">{data.month}</p>
                <p className="text-xs text-emerald-600 font-medium">{data.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-emerald-50 rounded-xl">
            <p className="text-emerald-800 font-medium">📈 Projected 6-month growth: +25%</p>
            <p className="text-sm text-emerald-600">Based on current market trends and sustainability factors</p>
          </div>
        </div>

        {/* Filter Cards */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Investment Filters</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <div className="flex flex-wrap gap-2">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      selectedRegion === region
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {region === 'all' ? 'All Regions' : region}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Impact Type</label>
              <div className="flex flex-wrap gap-2">
                {impacts.map((impact) => (
                  <button
                    key={impact}
                    onClick={() => setSelectedImpact(impact)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      selectedImpact === impact
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {impact === 'all' ? 'All Impact Types' : impact}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Investment Opportunities */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Recommended Investments</h3>
          <div className="space-y-4">
            {filteredInvestments.map((investment) => (
              <div key={investment.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{investment.name}</h4>
                    <p className="text-sm text-gray-600">{investment.region} • {investment.impact} Impact</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className={`text-lg ${
                        investment.prediction === 'up' ? 'text-green-500' : 'text-gray-500'
                      }`}>
                        {investment.prediction === 'up' ? '📈' : '📊'}
                      </span>
                      <span className="font-bold text-emerald-600">{investment.roi}%</span>
                    </div>
                    <p className="text-sm text-gray-500">Expected ROI</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    investment.risk === 'Low' ? 'bg-green-100 text-green-800' :
                    investment.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {investment.risk} Risk
                  </span>
                  
                  <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
