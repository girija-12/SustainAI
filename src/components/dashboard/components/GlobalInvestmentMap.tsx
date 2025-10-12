import { useEffect, useRef, useState } from 'react';
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from 'react-leaflet';

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

interface GlobalInvestmentMapProps {
  investments: Investment[];
  onInvestmentSelect: (investment: Investment) => Promise<void>;
}

export default function GlobalInvestmentMap({ investments, onInvestmentSelect }: GlobalInvestmentMapProps) {
  const mapRef = useRef<L.Map>(null);
  const [continentsGeoJson, setContinentsGeoJson] = useState<any | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // For now, we'll create a simplified world map visualization
  // In production, you would integrate with Leaflet or Mapbox
  const regions = [
    { name: 'North America', x: 20, y: 30, investments: investments.filter(inv => inv.region === 'North America') },
    { name: 'South America', x: 30, y: 60, investments: investments.filter(inv => inv.region === 'South America') },
    { name: 'Europe', x: 50, y: 25, investments: investments.filter(inv => inv.region === 'Europe') },
    { name: 'Africa', x: 52, y: 50, investments: investments.filter(inv => inv.region === 'Africa') },
    { name: 'Asia', x: 70, y: 35, investments: investments.filter(inv => inv.region === 'Asia') },
    { name: 'Australia', x: 80, y: 70, investments: investments.filter(inv => inv.region === 'Australia') },
  ];

  const getRegionColor = (regionInvestments: Investment[]) => {
    if (regionInvestments.length === 0) return 'bg-gray-300';
    
    const avgRisk = regionInvestments.reduce((acc, inv) => {
      const riskScore = inv.risk === 'Low' ? 1 : inv.risk === 'Medium' ? 2 : 3;
      return acc + riskScore;
    }, 0) / regionInvestments.length;
    
    const avgROI = regionInvestments.reduce((acc, inv) => acc + inv.roi, 0) / regionInvestments.length;
    
    // High ROI, Low Risk = Green
    if (avgROI > 12 && avgRisk < 2) return 'bg-green-500';
    // Medium performance = Yellow
    if (avgROI > 8 && avgRisk < 2.5) return 'bg-yellow-500';
    // High risk or low return = Red
    return 'bg-red-500';
  };

  const getRegionStats = (regionInvestments: Investment[]) => {
    if (regionInvestments.length === 0) return null;
    
    const avgROI = (regionInvestments.reduce((acc, inv) => acc + inv.roi, 0) / regionInvestments.length).toFixed(1);
    const avgESG = Math.round(regionInvestments.reduce((acc, inv) => acc + inv.esgScore, 0) / regionInvestments.length);
    const topProject = regionInvestments.reduce((max, inv) => inv.roi > max.roi ? inv : max);
    
    return { avgROI, avgESG, topProject, count: regionInvestments.length };
  };

  // Fetch continent GeoJSON (public dataset). This runs client-side and populates a GeoJSON layer.
  useEffect(() => {
    let cancelled = false;
    const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson';

    const load = async () => {
      setGeoLoading(true);
      setGeoError(null);
      try {
        const res = await fetch(GEOJSON_URL);
        if (!res.ok) throw new Error(`Failed to fetch GeoJSON: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setContinentsGeoJson(data);
      } catch (err: any) {
        console.error('Failed to load continents GeoJSON', err);
        if (!cancelled) setGeoError(String(err?.message || err));
      } finally {
        if (!cancelled) setGeoLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const continentStyle = (feature: any) => {
    const fill = 'rgba(200,200,200,0.2)';
    return {
      fillColor: fill,
      color: fill,
      weight: 1,
      fillOpacity: 0.25,
    };
  };

  // Helper component to recenter map when investments change
  function Recenter({ latlng }: { latlng: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
      if (!latlng) return;
      map.setView(latlng, 2, { animate: true });
    }, [latlng, map]);
    return null;
  }

  return (
    <div className="relative">
      <div className="w-full h-96 rounded-xl overflow-hidden border border-gray-200">
        {geoLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-blue-50">
            <div className="text-gray-600">Loading map...</div>
          </div>
        ) : continentsGeoJson ? (
          <MapContainer center={[20, 0]} zoom={2} style={{ height: '384px', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSON data={continentsGeoJson} style={continentStyle} />

            {investments.map((inv) => (
              <CircleMarker
                key={inv.id}
                center={[inv.lat, inv.lng]}
                radius={6}
                pathOptions={{ color: inv.risk === 'Low' ? '#10b981' : inv.risk === 'Medium' ? '#f59e0b' : '#ef4444', fillOpacity: 1 }}
                eventHandlers={{
                  click: async () => await onInvestmentSelect(inv)
                }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                  <div className="text-sm">
                    <div className="font-medium">{inv.name}</div>
                    <div className="text-xs text-gray-600">ROI: {inv.roi}% · ESG: {inv.esgScore}</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}

            {/* Optionally recenter when a top investment exists */}
            <Recenter latlng={investments.length > 0 ? [investments[0].lat, investments[0].lng] : null} />
          </MapContainer>
        ) : (
          // Fallback to original simplified SVG when GeoJSON fails
          <div className="relative w-full h-full bg-gradient-to-b from-blue-100 to-blue-50 rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center text-gray-600">Map unavailable: {geoError || 'Unknown error'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>High Impact, Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span>Moderate Performance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>High Risk / Low Return</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
          <span>No Opportunities</span>
        </div>
      </div>

      {/* Regional Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.filter(region => region.investments.length > 0).map((region, index) => {
          const stats = getRegionStats(region.investments);
          if (!stats) return null;

          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{region.name}</h4>
                <div className={`w-3 h-3 rounded-full ${getRegionColor(region.investments)}`}></div>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Projects:</span>
                  <span className="font-medium">{stats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg ROI:</span>
                  <span className="font-medium text-emerald-600">{stats.avgROI}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg ESG:</span>
                  <span className="font-medium text-green-600">{stats.avgESG}</span>
                </div>
              </div>
              
              <button 
                onClick={() => onInvestmentSelect(stats.topProject)}
                className="w-full mt-3 text-xs bg-gray-100 hover:bg-gray-200 py-2 rounded transition-colors"
              >
                View Top Project
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}