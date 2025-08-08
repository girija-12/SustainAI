import { useState } from 'react';
import ChatWidget from '../shared/ChatWidget';

export default function DisasterResilience() {
  const [selectedRisk, setSelectedRisk] = useState('all');
  
  const riskData = [
    { id: 1, location: 'Downtown Bridge', type: 'Structural', risk: 85, lat: 40.7128, lng: -74.0060 },
    { id: 2, location: 'City Hospital', type: 'Flood', risk: 62, lat: 40.7589, lng: -73.9851 },
    { id: 3, location: 'Power Plant', type: 'Seismic', risk: 78, lat: 40.6892, lng: -74.0445 },
    { id: 4, location: 'School District 5', type: 'Fire', risk: 45, lat: 40.7831, lng: -73.9712 },
  ];

  const improvements = [
    { priority: 'High', action: 'Reinforce Downtown Bridge supports', cost: '$2.5M', timeline: '6 months' },
    { priority: 'Medium', action: 'Install flood barriers at City Hospital', cost: '$800K', timeline: '3 months' },
    { priority: 'High', action: 'Seismic retrofitting for Power Plant', cost: '$1.8M', timeline: '8 months' },
    { priority: 'Low', action: 'Fire suppression upgrade for schools', cost: '$400K', timeline: '2 months' },
  ];

  const chatMessages = [
    { role: 'assistant' as const, content: 'Hello! I\'m ResiliScan, your disaster resilience analyst. I can assess infrastructure risks and provide improvement recommendations.' },
    { role: 'user' as const, content: 'What are the highest priority infrastructure risks in our city?' },
    { role: 'assistant' as const, content: 'Based on current data, I\'ve identified 3 high-priority risks: 1) Downtown Bridge (85% structural risk), 2) Power Plant (78% seismic risk), 3) City Hospital (62% flood risk). I recommend immediate attention to the bridge infrastructure.' }
  ];

  const riskTypes = ['all', 'Structural', 'Flood', 'Seismic', 'Fire'];
  const filteredRisks = selectedRisk === 'all' ? riskData : riskData.filter(item => item.type === selectedRisk);

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* AI Agent Card */}
      <div className="lg:col-span-1">
        <ChatWidget
          agentName="ResiliScan"
          agentDescription="AI-powered infrastructure risk assessment and disaster preparedness"
          messages={chatMessages}
          placeholder="Ask about infrastructure risks..."
          bgColor="from-orange-500 to-red-600"
        />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Risk Map Placeholder */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Infrastructure Risk Map</h3>
          <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-xl h-64 flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-600">Interactive Risk Overlay Map</p>
              <p className="text-sm text-gray-500">Showing {filteredRisks.length} risk locations</p>
            </div>
            
            {/* Risk Markers */}
            {filteredRisks.map((risk, index) => (
              <div
                key={risk.id}
                className={`absolute w-4 h-4 rounded-full animate-pulse ${
                  risk.risk >= 80 ? 'bg-red-500' :
                  risk.risk >= 60 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{
                  left: `${20 + index * 15}%`,
                  top: `${30 + index * 10}%`
                }}
                title={`${risk.location}: ${risk.risk}% risk`}
              ></div>
            ))}
          </div>
          
          {/* Risk Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            {riskTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedRisk(type)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  selectedRisk === type
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All Risks' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Scores */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Risk Assessment</h3>
          <div className="space-y-4">
            {filteredRisks.map((risk) => (
              <div key={risk.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <h4 className="font-medium">{risk.location}</h4>
                  <p className="text-sm text-gray-600">{risk.type} Risk</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        risk.risk >= 80 ? 'bg-red-500' :
                        risk.risk >= 60 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${risk.risk}%` }}
                    ></div>
                  </div>
                  <span className={`font-bold ${
                    risk.risk >= 80 ? 'text-red-600' :
                    risk.risk >= 60 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {risk.risk}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Suggestions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Recommended Improvements</h3>
          <div className="space-y-4">
            {improvements.map((improvement, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{improvement.action}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    improvement.priority === 'High' ? 'bg-red-100 text-red-800' :
                    improvement.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {improvement.priority} Priority
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Cost: {improvement.cost}</span>
                  <span>Timeline: {improvement.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
