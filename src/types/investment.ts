// Investment Types for ESG Dashboard
export interface Investment {
  id: number;
  name: string;
  symbol?: string;
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
  currentPrice?: number;
  marketCap?: number;
  peRatio?: number;
  beta?: number;
  dividendYield?: number;
  description?: string;
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

export interface FilterState {
  regions: string[];
  sectors: string[];
  riskLevels: string[];
  impactTypes: string[];
  esgScoreRange: [number, number];
  roiRange: [number, number];
  investmentSizeRange: [number, number];
  timeHorizons: string[];
}

export interface ESGCompany {
  symbol: string;
  category: string;
  region: string;
  esgBonus: number;
}