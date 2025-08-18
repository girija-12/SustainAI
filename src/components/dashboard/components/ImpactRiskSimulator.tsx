import { useState } from 'react';
import { Play, RotateCcw, TrendingUp, TrendingDown, AlertTriangle, Leaf, Shield } from 'lucide-react';

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

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  impact: {
    roi: number; // percentage change
    esg: number; // percentage change
    risk: number; // percentage change
  };
}

interface SimulationResult {
  scenario: string;
  portfolioRiskDelta: number;
  esgOpportunityGain: number;
  suggestedRebalancing: string[];
  affectedInvestments: number;
  newAvgROI: number;
  newAvgESG: number;
}

interface ImpactRiskSimulatorProps {
  investments: Investment[];
  onSimulationComplete: (results: SimulationResult) => void;
}

export default function ImpactRiskSimulator({ investments, onSimulationComplete }: ImpactRiskSimulatorProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);

  const scenarios: SimulationScenario[] = [
    {
      id: 'climate_change',
      name: 'Climate Change Acceleration',
      description: 'Increased extreme weather events and regulatory pressure',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      impact: { roi: -5, esg: 10, risk: 15 }
    },
    {
      id: 'policy_shift',
      name: 'Green Policy Expansion',
      description: 'New government incentives for sustainable investments',
      icon: <Shield className="w-5 h-5 text-green-500" />,
      impact: { roi: 8, esg: 5, risk: -10 }
    },
    {
      id: 'tech_breakthrough',
      name: 'Clean Tech Breakthrough',
      description: 'Major advancement in renewable energy technology',
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      impact: { roi: 12, esg: 8, risk: -5 }
    },
    {
      id: 'market_volatility',
      name: 'Market Volatility Increase',
      description: 'Economic uncertainty affecting all investments',
      icon: <TrendingDown className="w-5 h-5 text-orange-500" />,
      impact: { roi: -8, esg: 0, risk: 20 }
    },
    {
      id: 'esg_mandate',
      name: 'ESG Reporting Mandate',
      description: 'Mandatory ESG disclosure requirements',
      icon: <Leaf className="w-5 h-5 text-emerald-500" />,
      impact: { roi: 3, esg: 15, risk: 5 }
    },
    {
      id: 'supply_chain',
      name: 'Supply Chain Disruption',
      description: 'Global supply chain issues affecting operations',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      impact: { roi: -10, esg: -5, risk: 25 }
    }
  ];

  const handleScenarioToggle = (scenarioId: string) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const runSimulation = async () => {
    if (selectedScenarios.length === 0) return;

    setIsSimulating(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate combined impact of selected scenarios
    const combinedImpact = selectedScenarios.reduce((acc, scenarioId) => {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (scenario) {
        acc.roi += scenario.impact.roi;
        acc.esg += scenario.impact.esg;
        acc.risk += scenario.impact.risk;
      }
      return acc;
    }, { roi: 0, esg: 0, risk: 0 });

    // Calculate current portfolio metrics
    const currentAvgROI = investments.reduce((sum, inv) => sum + inv.roi, 0) / investments.length;
    const currentAvgESG = investments.reduce((sum, inv) => sum + inv.esgScore, 0) / investments.length;
    
    // Apply scenario impacts
    const newAvgROI = currentAvgROI * (1 + combinedImpact.roi / 100);
    const newAvgESG = Math.min(100, currentAvgESG * (1 + combinedImpact.esg / 100));
    
    // Calculate risk delta
    const portfolioRiskDelta = combinedImpact.risk;
    
    // Calculate ESG opportunity gain
    const esgOpportunityGain = newAvgESG - currentAvgESG;
    
    // Generate rebalancing suggestions
    const suggestedRebalancing = [];
    if (combinedImpact.roi < -5) {
      suggestedRebalancing.push('Reduce exposure to high-risk sectors');
      suggestedRebalancing.push('Increase allocation to defensive ESG assets');
    }
    if (combinedImpact.esg > 10) {
      suggestedRebalancing.push('Capitalize on ESG premium opportunities');
      suggestedRebalancing.push('Consider green bonds and sustainability-linked loans');
    }
    if (combinedImpact.risk > 15) {
      suggestedRebalancing.push('Diversify across regions to reduce concentration risk');
      suggestedRebalancing.push('Implement hedging strategies for climate-sensitive assets');
    }

    const results: SimulationResult = {
      scenario: selectedScenarios.map(id => scenarios.find(s => s.id === id)?.name).join(', '),
      portfolioRiskDelta,
      esgOpportunityGain,
      suggestedRebalancing,
      affectedInvestments: Math.floor(investments.length * 0.7), // Assume 70% affected
      newAvgROI,
      newAvgESG
    };

    setSimulationResults(results);
    onSimulationComplete(results);
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    setSelectedScenarios([]);
    setSimulationResults(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-900">Impact & Risk Simulator</h2>
        </div>
        {simulationResults && (
          <button
            onClick={resetSimulation}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {!simulationResults ? (
        <>
          {/* Scenario Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Select Simulation Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scenarios.map((scenario) => (
                <label
                  key={scenario.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedScenarios.includes(scenario.id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedScenarios.includes(scenario.id)}
                    onChange={() => handleScenarioToggle(scenario.id)}
                    className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {scenario.icon}
                      <span className="font-medium text-gray-900">{scenario.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{scenario.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className={`${scenario.impact.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ROI: {scenario.impact.roi > 0 ? '+' : ''}{scenario.impact.roi}%
                      </span>
                      <span className={`${scenario.impact.esg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ESG: {scenario.impact.esg > 0 ? '+' : ''}{scenario.impact.esg}%
                      </span>
                      <span className={`${scenario.impact.risk <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Risk: {scenario.impact.risk > 0 ? '+' : ''}{scenario.impact.risk}%
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Run Simulation Button */}
          <button
            onClick={runSimulation}
            disabled={selectedScenarios.length === 0 || isSimulating}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSimulating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running Simulation...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Simulation ({selectedScenarios.length} scenario{selectedScenarios.length !== 1 ? 's' : ''})
              </>
            )}
          </button>
        </>
      ) : (
        /* Simulation Results */
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Simulation: {simulationResults.scenario}</h3>
            <p className="text-sm text-gray-600">
              Analyzed impact on {simulationResults.affectedInvestments} investments
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Portfolio Risk Delta</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {simulationResults.portfolioRiskDelta > 0 ? '+' : ''}{simulationResults.portfolioRiskDelta.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">ESG Opportunity Gain</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {simulationResults.esgOpportunityGain > 0 ? '+' : ''}{simulationResults.esgOpportunityGain.toFixed(1)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">New Avg ROI</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {simulationResults.newAvgROI.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Before/After Comparison */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Portfolio Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Before Simulation</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Avg ROI:</span>
                    <span>{(investments.reduce((sum, inv) => sum + inv.roi, 0) / investments.length).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg ESG:</span>
                    <span>{Math.round(investments.reduce((sum, inv) => sum + inv.esgScore, 0) / investments.length)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">After Simulation</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Avg ROI:</span>
                    <span className={simulationResults.newAvgROI > (investments.reduce((sum, inv) => sum + inv.roi, 0) / investments.length) ? 'text-green-600' : 'text-red-600'}>
                      {simulationResults.newAvgROI.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg ESG:</span>
                    <span className={simulationResults.newAvgESG > (investments.reduce((sum, inv) => sum + inv.esgScore, 0) / investments.length) ? 'text-green-600' : 'text-red-600'}>
                      {Math.round(simulationResults.newAvgESG)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rebalancing Suggestions */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Suggested Rebalancing</h3>
            <div className="space-y-2">
              {simulationResults.suggestedRebalancing.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-blue-800">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex-1 bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition-colors">
              Apply Recommendations
            </button>
            <button 
              onClick={resetSimulation}
              className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Run New Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}