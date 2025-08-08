import { useState } from 'react';
import SustainableConsumption from './dashboard/SustainableConsumption';
import FinancialIntegrity from './dashboard/FinancialIntegrity';
import WellbeingMeasurement from './dashboard/WellbeingMeasurement';
import DisasterResilience from './dashboard/DisasterResilience';
import InvestmentPrediction from './dashboard/InvestmentPrediction';
import RealTimeMonitoring from './dashboard/RealTimeMonitoring';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('consumption');

  const tabs = [
    { id: 'consumption', label: 'Sustainable Consumption', icon: '🌱' },
    { id: 'finance', label: 'Financial Integrity', icon: '💚' },
    { id: 'wellbeing', label: 'Wellbeing Measurement', icon: '📊' },
    { id: 'disaster', label: 'Disaster Resilience', icon: '🏗️' },
    { id: 'investment', label: 'Investment Prediction', icon: '📈' },
    { id: 'monitoring', label: 'Real-Time Monitoring', icon: '🚨' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'consumption':
        return <SustainableConsumption />;
      case 'finance':
        return <FinancialIntegrity />;
      case 'wellbeing':
        return <WellbeingMeasurement />;
      case 'disaster':
        return <DisasterResilience />;
      case 'investment':
        return <InvestmentPrediction />;
      case 'monitoring':
        return <RealTimeMonitoring />;
      default:
        return <SustainableConsumption />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 bg-white rounded-2xl p-2 shadow-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {renderTabContent()}
      </div>
    </div>
  );
}
