import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different disaster types
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// API Endpoints
const USGS_QUAKES_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
const NWS_ALERTS_URL = 'https://api.weather.gov/alerts/active?status=actual';
const FLOOD_API_URL = 'https://environment.data.gov.uk/flood-monitoring/id/floods';
const WILDFIRE_API_URL = 'https://incidents.smoke.airfire.org/webservices/v1/incidents';
const CYCLONE_API_URL = 'https://www.nhc.noaa.gov/gtwo.php?basin=atl&fdays=2';
const REVERSE_GEOCODING_URL = 'https://nominatim.openstreetmap.org/reverse';

type DisasterType = 'Earthquake' | 'Flood' | 'Cyclone' | 'Wildfire' | 'Heatwave' | 'Severe Storm';

type RiskData = {
  id: string;
  location: string;
  type: DisasterType;
  risk: number;
  lat: number;
  lng: number;
  details?: string;
  severity?: string;
  urgency?: string;
  time?: string;
  radius?: number;
  country?: string;
  infrastructureImpact?: string[];
  resilienceRecommendations?: string[];
};

type InfrastructureData = {
  type: string;
  name: string;
  lat: number;
  lng: number;
  resilienceScore: number;
  vulnerabilities: string[];
};

const DISASTER_COLORS: Record<DisasterType, string> = {
  'Earthquake': '#ef4444',
  'Flood': '#3b82f6',
  'Cyclone': '#8b5cf6',
  'Wildfire': '#f97316',
  'Heatwave': '#dc2626',
  'Severe Storm': '#0ea5e9'
};

// Component to handle map center updates
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

export default function GlobalDisasterDashboard() {
  const [selectedRisk, setSelectedRisk] = useState<DisasterType | 'all'>('all');
  const [riskData, setRiskData] = useState<RiskData[]>([]);
  const [infrastructureData, setInfrastructureData] = useState<InfrastructureData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeAlert, setActiveAlert] = useState<RiskData | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number, name?: string } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showResiliencePanel, setShowResiliencePanel] = useState(false);
  const [selectedInfrastructure, setSelectedInfrastructure] = useState<InfrastructureData | null>(null);

  // Get user's current location and reverse geocode to get location name
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          try {
            // Reverse geocode to get location name
            const response = await fetch(
              `${REVERSE_GEOCODING_URL}?lat=${location.lat}&lon=${location.lng}&format=json`
            );
            const data = await response.json();
            
            setUserLocation({
              ...location,
              name: data.display_name || `${data.address?.city || data.address?.town || data.address?.village || 'Unknown location'}`
            });

            // Set map center to user location
            setMapCenter([location.lat, location.lng]);
            setZoomLevel(8);

            // Fetch infrastructure data for the area
            fetchInfrastructureData(location.lat, location.lng);
          } catch (error) {
            console.error("Reverse geocoding error:", error);
            setUserLocation({
              ...location,
              name: "Your current location"
            });
          }
          
          setLocationError(null);
        },
        (error) => {
          setLocationError(error.message);
          console.error("Geolocation error:", error);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  // Fetch all disaster data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [quakes, weatherAlerts, floods, wildfires, cyclones] = await Promise.all([
          fetchQuakes(),
          fetchWeatherAlerts(),
          fetchFloods(),
          fetchWildfires(),
          fetchCyclones()
        ]);

        const allDisasters = [
          ...quakes,
          ...weatherAlerts,
          ...floods,
          ...wildfires,
          ...cyclones
        ].filter(d => d);

        // Enhance disaster data with infrastructure impact analysis
        const enhancedDisasters = await enhanceWithImpactAnalysis(allDisasters);
        setRiskData(enhancedDisasters);
        
        if (enhancedDisasters.length > 0) {
          setActiveAlert(
            enhancedDisasters.reduce((prev, current) => 
              (prev.risk > current.risk) ? prev : current
            )
          );
        } else {
          setActiveAlert(null);
        }

      } catch (error) {
        console.error("Data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch infrastructure data for a given location
  const fetchInfrastructureData = async (lat: number, lng: number) => {
    try {
      // Mock infrastructure data - in real implementation, use actual infrastructure APIs
      const mockInfrastructure: InfrastructureData[] = [
        {
          type: 'Hospital',
          name: 'City General Hospital',
          lat: lat + 0.01,
          lng: lng + 0.01,
          resilienceScore: 65,
          vulnerabilities: ['Flood risk', 'Aging electrical systems']
        },
        {
          type: 'Power Plant',
          name: 'Regional Power Station',
          lat: lat - 0.02,
          lng: lng - 0.01,
          resilienceScore: 45,
          vulnerabilities: ['Earthquake vulnerability', 'Single point of failure']
        },
        {
          type: 'Bridge',
          name: 'Main River Crossing',
          lat: lat + 0.015,
          lng: lng - 0.005,
          resilienceScore: 30,
          vulnerabilities: ['Flood risk', 'Structural fatigue']
        },
        {
          type: 'School',
          name: 'Central Public School',
          lat: lat - 0.005,
          lng: lng + 0.02,
          resilienceScore: 55,
          vulnerabilities: ['Limited emergency resources', 'Aging building']
        },
        {
          type: 'Water Treatment',
          name: 'Municipal Water Plant',
          lat: lat + 0.025,
          lng: lng - 0.015,
          resilienceScore: 70,
          vulnerabilities: ['Power dependency', 'Limited backup capacity']
        }
      ];

      setInfrastructureData(mockInfrastructure);
    } catch (error) {
      console.error('Infrastructure data fetch error:', error);
    }
  };

  // AI-powered analysis to enhance disaster data with infrastructure impact
  const enhanceWithImpactAnalysis = async (disasters: RiskData[]): Promise<RiskData[]> => {
    return disasters.map(disaster => {
      let infrastructureImpact: string[] = [];
      let resilienceRecommendations: string[] = [];

      switch(disaster.type) {
        case 'Earthquake':
          infrastructureImpact = [
            'Potential damage to unreinforced masonry buildings',
            'Risk to bridges and elevated structures',
            'Possible utility disruptions'
          ];
          resilienceRecommendations = [
            'Retrofit critical buildings with seismic upgrades',
            'Implement early warning systems',
            'Diversify utility supply routes'
          ];
          break;
        case 'Flood':
          infrastructureImpact = [
            'Road and bridge closures likely',
            'Basement flooding in urban areas',
            'Water treatment plant vulnerabilities'
          ];
          resilienceRecommendations = [
            'Elevate critical infrastructure',
            'Implement green infrastructure for water absorption',
            'Create flood barriers and drainage improvements'
          ];
          break;
        case 'Wildfire':
          infrastructureImpact = [
            'Power line vulnerability',
            'Communication tower risks',
            'Water system pressure issues'
          ];
          resilienceRecommendations = [
            'Create defensible space around infrastructure',
            'Underground critical utilities',
            'Harden structures with fire-resistant materials'
          ];
          break;
        case 'Cyclone':
          infrastructureImpact = [
            'Roof and structural damage to buildings',
            'Power outage risks',
            'Transportation network disruptions'
          ];
          resilienceRecommendations = [
            'Reinforce building structures',
            'Install backup power systems',
            'Strengthen communication networks'
          ];
          break;
        default:
          infrastructureImpact = ['Potential impact on local infrastructure'];
          resilienceRecommendations = ['Review infrastructure resilience plans'];
      }

      return {
        ...disaster,
        infrastructureImpact,
        resilienceRecommendations
      };
    });
  };

  // API Fetch Functions for different disaster types
  const fetchQuakes = async (): Promise<RiskData[]> => {
    try {
      const res = await fetch(USGS_QUAKES_URL);
      const data = await res.json();
      
      return data.features.map((quake: any) => ({
        id: `quake-${quake.id}`,
        location: quake.properties.place,
        type: 'Earthquake',
        risk: Math.min(Math.round(quake.properties.mag * 20), 100),
        lat: quake.geometry.coordinates[1],
        lng: quake.geometry.coordinates[0],
        time: new Date(quake.properties.time).toLocaleString(),
        details: `Magnitude ${quake.properties.mag} Earthquake`,
        country: quake.properties.place.split(', ').pop()
      }));
    } catch (error) {
      console.error('Earthquake fetch error:', error);
      return [];
    }
  };

  const fetchWeatherAlerts = async (): Promise<RiskData[]> => {
    try {
      const res = await fetch(NWS_ALERTS_URL);
      const data = await res.json();
      
      return data.features?.map((alert: any) => {
        const props = alert.properties;
        let disasterType: DisasterType = 'Severe Storm';
        
        // Classify alert type
        if (props.event.includes('Flood')) disasterType = 'Flood';
        else if (props.event.includes('Hurricane') || props.event.includes('Tornado')) disasterType = 'Cyclone';
        else if (props.event.includes('Heat')) disasterType = 'Heatwave';
        else if (props.event.includes('Fire')) disasterType = 'Wildfire';

        // Get coordinates from polygon if available
        let lat = 0, lng = 0;
        if (alert.geometry?.coordinates) {
          const coords = alert.geometry.coordinates[0][0]; // First polygon point
          lng = coords[0];
          lat = coords[1];
        }

        return {
          id: `alert-${alert.id}`,
          location: props.areaDesc || 'Weather Alert Area',
          type: disasterType,
          risk: calculateDisasterRisk(props, disasterType),
          lat,
          lng,
          severity: props.severity,
          urgency: props.urgency,
          details: props.headline || props.event,
          time: new Date(props.effective).toLocaleString(),
          radius: props.area?.match(/\d+/)?.[0] ? parseInt(props.area.match(/\d+/)[0]) : undefined,
          country: props.areaDesc?.split(', ').pop()
        };
      }) || [];
    } catch (error) {
      console.error('Weather alert fetch error:', error);
      return [];
    }
  };

  const fetchFloods = async (): Promise<RiskData[]> => {
    try {
      const res = await fetch(FLOOD_API_URL);
      const data = await res.json();
      
      return data.items?.map((flood: any) => ({
        id: `flood-${flood.id}`,
        location: flood.description || 'Flood Area',
        type: 'Flood',
        risk: flood.severity === 'Severe' ? 80 : 
              flood.severity === 'Moderate' ? 60 : 40,
        lat: flood.lat || 0,
        lng: flood.long || 0,
        time: new Date(flood.timeRaised).toLocaleString() || 'Recent',
        details: `Flood Warning: ${flood.severity} level`,
        severity: flood.severity,
        country: flood.description?.split(', ').pop()
      })) || [];
    } catch (error) {
      console.error('Flood data fetch error:', error);
      return [];
    }
  };

  const fetchWildfires = async (): Promise<RiskData[]> => {
    try {
      const res = await fetch(WILDFIRE_API_URL);
      const data = await res.json();
      
      return data.incidents?.map((fire: any) => ({
        id: `fire-${fire.id}`,
        location: fire.name || 'Wildfire Area',
        type: 'Wildfire',
        risk: fire.size > 1000 ? 85 : 
              fire.size > 500 ? 70 : 55,
        lat: fire.latitude,
        lng: fire.longitude,
        time: new Date(fire.updatedAt).toLocaleString(),
        details: `Wildfire: ${fire.size} acres affected`,
        radius: Math.sqrt(fire.size) * 0.2, // Approximate radius in km
        country: fire.state || fire.country
      })) || [];
    } catch (error) {
      console.error('Wildfire data fetch error:', error);
      return [];
    }
  };

  const fetchCyclones = async (): Promise<RiskData[]> => {
    try {
      const res = await fetch(CYCLONE_API_URL);
      const text = await res.text();
      const parser = new DOMParser();
      const html = parser.parseFromString(text, 'text/html');
      
      // This is a simplified parser - in production you'd want a more robust solution
      const cycloneItems = Array.from(html.querySelectorAll('.cyclone'));
      
      return cycloneItems.map((item, index) => ({
        id: `cyclone-${index}`,
        location: item.querySelector('h3')?.textContent || 'Cyclone Area',
        type: 'Cyclone',
        risk: 75, // Base risk for cyclones
        lat: parseFloat(item.getAttribute('data-lat') || '0'),
        lng: parseFloat(item.getAttribute('data-lng') || '0'),
        time: 'Current',
        details: 'Active Cyclone',
        radius: 300, // Approximate radius in km
        country: item.querySelector('.location')?.textContent || ''
      }));
    } catch (error) {
      console.error('Cyclone data fetch error:', error);
      return [];
    }
  };

  // Helper Functions
  const calculateDisasterRisk = (properties: any, type: DisasterType): number => {
    const severityMap: Record<string, number> = {
      'Extreme': 90,
      'Severe': 75,
      'Moderate': 60,
      'Minor': 40,
      'Unknown': 30
    };
    
    let risk = severityMap[properties.severity] || 50;
    
    // Type-specific risk adjustments
    switch(type) {
      case 'Cyclone':
        risk = Math.min(risk + 15, 95);
        break;
      case 'Flood':
        risk = Math.min(risk + 10, 90);
        break;
      case 'Wildfire':
        risk = Math.min(risk + (properties.urgency === 'Immediate' ? 20 : 10), 95);
        break;
      case 'Heatwave':
        risk = Math.min(risk + 5, 85);
        break;
    }
    
    return risk;
  };

  // Center map on user location
  const centerOnUserLocation = () => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setZoomLevel(8);
    }
  };

  // Filter risks based on selection
  const filteredRisks = selectedRisk === 'all' 
    ? riskData 
    : riskData.filter(item => item.type === selectedRisk);

  const disasterTypes: DisasterType[] = ['Earthquake', 'Flood', 'Cyclone', 'Wildfire', 'Heatwave', 'Severe Storm'];

  // Get resilience recommendations for a specific location
  const getLocationResilienceRecommendations = (lat: number, lng: number): string[] => {
    const nearbyDisasters = riskData.filter(disaster => {
      const distance = Math.sqrt(
        Math.pow(disaster.lat - lat, 2) + Math.pow(disaster.lng - lng, 2)
      );
      return distance < 5; // Within ~5 degrees (simplified)
    });

    const recommendations = new Set<string>();
    
    nearbyDisasters.forEach(disaster => {
      if (disaster.resilienceRecommendations) {
        disaster.resilienceRecommendations.forEach(rec => recommendations.add(rec));
      }
    });

    return Array.from(recommendations);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h1 className="text-3xl font-bold">SustainAI: Disaster Resilient Infrastructure Solutions</h1>
          <p className="text-gray-600">AI-driven assessment and recommendations for disaster-resilient infrastructure</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Current Location Panel */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Your Location</h3>
              {userLocation ? (
                <div className="space-y-2">
                  <p className="font-medium">{userLocation.name}</p>
                  <button
                    onClick={centerOnUserLocation}
                    className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Center Map on My Location
                  </button>
                  <button
                    onClick={() => {
                      setShowResiliencePanel(true);
                      setSelectedInfrastructure(null);
                    }}
                    className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Get Resilience Recommendations
                  </button>
                </div>
              ) : locationError ? (
                <p className="text-red-500">{locationError}</p>
              ) : (
                <p>Detecting your location...</p>
              )}
            </div>

            {/* Disaster Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Filter Disasters</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedRisk('all')}
                  className={`w-full text-left px-4 py-2 rounded-lg ${
                    selectedRisk === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100'
                  }`}
                >
                  All Disasters
                </button>
                {disasterTypes.map(type => (
                  <button 
                    key={type}
                    onClick={() => setSelectedRisk(type)}
                    className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 ${
                      selectedRisk === type ? 'text-white' : 'bg-gray-100'
                    }`}
                    style={{ 
                      backgroundColor: selectedRisk === type ? DISASTER_COLORS[type] : undefined 
                    }}
                  >
                    <span>
                      {type === 'Earthquake' ? '🌋' : 
                       type === 'Flood' ? '🌊' :
                       type === 'Cyclone' ? '🌀' :
                       type === 'Wildfire' ? '🔥' :
                       type === 'Heatwave' ? '☀️' : '⚠️'}
                    </span>
                    {type}
                    <span className="ml-auto bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                      {riskData.filter(d => d.type === type).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Panel */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Global Stats</h3>
              <div className="space-y-3">
                {disasterTypes.map(type => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: DISASTER_COLORS[type] }}
                      ></div>
                      <span>{type}</span>
                    </div>
                    <span className="font-medium">
                      {riskData.filter(d => d.type === type).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Global Map */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Global Disaster Map</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setZoomLevel(Math.min(zoomLevel + 1, 10))}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setZoomLevel(Math.max(zoomLevel - 1, 1))}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  {userLocation && (
                    <button 
                      onClick={centerOnUserLocation}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 flex items-center gap-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">My Location</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="h-[500px] rounded-xl overflow-hidden relative bg-gray-100">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <MapContainer
                    center={mapCenter}
                    zoom={zoomLevel}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <MapUpdater center={mapCenter} zoom={zoomLevel} />
                    
                    <LayersControl position="topright">
                      <LayersControl.BaseLayer checked name="OpenStreetMap">
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="Satellite">
                        <TileLayer
                          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                          subdomains={['mt1','mt2','mt3']}
                          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
                        />
                      </LayersControl.BaseLayer>
                    </LayersControl>

                    {/* User location marker */}
                    {userLocation && (
                      <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={new L.DivIcon({
                          html: `<div style="background-color: #4f46e5; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                          className: 'user-location-marker',
                          iconSize: [16, 16],
                          iconAnchor: [8, 8],
                        })}
                      >
                        <Popup>
                          <div className="text-sm">
                            <strong>Your Location</strong><br />
                            {userLocation.name}
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Infrastructure markers */}
                    {infrastructureData.map((infra) => {
                      const resilienceColor = infra.resilienceScore > 70 ? '#10b981' : 
                                           infra.resilienceScore > 40 ? '#f59e0b' : '#ef4444';
                      
                      return (
                        <Marker
                          key={`infra-${infra.name}`}
                          position={[infra.lat, infra.lng]}
                          icon={new L.DivIcon({
                            html: `
                              <div style="
                                background-color: ${resilienceColor}; 
                                width: 24px; 
                                height: 24px; 
                                border-radius: 50%; 
                                border: 3px solid white; 
                                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                color: white;
                                font-size: 10px;
                              ">
                                ${infra.type.charAt(0)}
                              </div>
                            `,
                            className: 'infrastructure-marker',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12],
                          })}
                          eventHandlers={{
                            click: () => {
                              setSelectedInfrastructure(infra);
                              setShowResiliencePanel(true);
                            },
                          }}
                        >
                          <Popup>
                            <div className="text-sm">
                              <strong>{infra.name}</strong><br />
                              Type: {infra.type}<br />
                              Resilience Score: {infra.resilienceScore}/100<br />
                              <button 
                                className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                onClick={() => {
                                  setSelectedInfrastructure(infra);
                                  setShowResiliencePanel(true);
                                }}
                              >
                                View Details
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                    {/* Disaster markers */}
                    {filteredRisks.map((risk) => (
                      <Marker
                        key={risk.id}
                        position={[risk.lat, risk.lng]}
                        icon={createCustomIcon(DISASTER_COLORS[risk.type])}
                        eventHandlers={{
                          click: () => setActiveAlert(risk),
                        }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <strong style={{ color: DISASTER_COLORS[risk.type] }}>
                              {risk.type}
                            </strong><br />
                            Location: {risk.location}<br />
                            Risk Level: {risk.risk}%<br />
                            Time: {risk.time}<br />
                            {risk.details && <div>Details: {risk.details}</div>}
                            <button 
                              className="mt-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                              onClick={() => {
                                setActiveAlert(risk);
                                setShowResiliencePanel(true);
                              }}
                            >
                              Resilience Tips
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Disaster radius circles */}
                    {filteredRisks.map((risk) => {
                      if (!risk.radius) return null;
                      
                      return (
                        <Circle
                          key={`circle-${risk.id}`}
                          center={[risk.lat, risk.lng]}
                          radius={risk.radius * 1000} // Convert km to meters
                          pathOptions={{
                            fillColor: DISASTER_COLORS[risk.type],
                            fillOpacity: 0.1,
                            color: DISASTER_COLORS[risk.type],
                            opacity: 0.5,
                            weight: 1,
                          }}
                        />
                      );
                    })}
                  </MapContainer>
                )}
              </div>
            </div>

            {/* Active Alert */}
            {activeAlert && (
              <div className={`p-4 rounded-xl border-l-4`}
                style={{
                  backgroundColor: `${DISASTER_COLORS[activeAlert.type]}20`,
                  borderColor: DISASTER_COLORS[activeAlert.type]
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: DISASTER_COLORS[activeAlert.type] }}>
                        {activeAlert.type.toUpperCase()}
                      </span>
                      {activeAlert.severity && (
                        <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                          {activeAlert.severity}
                        </span>
                      )}
                      {activeAlert.country && (
                        <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                          {activeAlert.country}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold mt-1">{activeAlert.details}</h4>
                    <p className="text-sm mt-1">
                      {activeAlert.location} • {activeAlert.time}
                    </p>
                    
                    {/* Infrastructure Impact Section */}
                    {activeAlert.infrastructureImpact && (
                      <div className="mt-3">
                        <h5 className="font-semibold text-sm">Potential Infrastructure Impact:</h5>
                        <ul className="list-disc list-inside text-sm">
                          {activeAlert.infrastructureImpact.map((impact, i) => (
                            <li key={i}>{impact}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={() => setActiveAlert(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => {
                        setShowResiliencePanel(true);
                        setSelectedInfrastructure(null);
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Resilience Tips
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Resilience Recommendations Panel */}
            {showResiliencePanel && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-green-500">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">
                    {selectedInfrastructure 
                      ? `${selectedInfrastructure.name} Resilience Assessment`
                      : "Infrastructure Resilience Recommendations"}
                  </h3>
                  <button 
                    onClick={() => setShowResiliencePanel(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {selectedInfrastructure ? (
                  <div>
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Resilience Score</h4>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="h-4 rounded-full" 
                          style={{ 
                            width: `${selectedInfrastructure.resilienceScore}%`,
                            backgroundColor: selectedInfrastructure.resilienceScore > 70 ? '#10b981' : 
                                           selectedInfrastructure.resilienceScore > 40 ? '#f59e0b' : '#ef4444'
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Identified Vulnerabilities</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedInfrastructure.vulnerabilities.map((vuln, i) => (
                          <li key={i} className="text-red-600">{vuln}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Recommended Improvements</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {getLocationResilienceRecommendations(
                          selectedInfrastructure.lat, 
                          selectedInfrastructure.lng
                        ).map((rec, i) => (
                          <li key={i} className="text-green-600">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium mb-2">Based on nearby disaster risks, we recommend:</h4>
                    <ul className="list-disc list-inside space-y-2">
                      {userLocation ? (
                        getLocationResilienceRecommendations(
                          userLocation.lat, 
                          userLocation.lng
                        ).map((rec, i) => (
                          <li key={i} className="text-green-600">{rec}</li>
                        ))
                      ) : (
                        <li>Enable location services to get specific recommendations</li>
                      )}
                    </ul>

                    {infrastructureData.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Nearby Critical Infrastructure</h4>
                        <div className="space-y-3">
                          {infrastructureData.map((infra) => (
                            <div 
                              key={infra.name}
                              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => setSelectedInfrastructure(infra)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h5 className="font-medium">{infra.name}</h5>
                                  <p className="text-sm text-gray-600">{infra.type}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    infra.resilienceScore > 70 ? 'bg-green-100 text-green-800' :
                                    infra.resilienceScore > 40 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {infra.resilienceScore}/100
                                  </span>
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Disaster List */}
            {!showResiliencePanel && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4">
                  {selectedRisk === 'all' ? 'All Active Disasters' : `Active ${selectedRisk}s`}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filteredRisks.length} found)
                  </span>
                </h3>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                  </div>
                ) : filteredRisks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No {selectedRisk === 'all' ? '' : selectedRisk.toLowerCase()} disasters currently active
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {filteredRisks.map((risk) => (
                      <div 
                        key={risk.id} 
                        className={`p-4 rounded-lg border transition-colors hover:shadow-md`}
                        style={{
                          borderLeftColor: DISASTER_COLORS[risk.type],
                          borderLeftWidth: '4px'
                        }}
                        onClick={() => setActiveAlert(risk)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              <span style={{ color: DISASTER_COLORS[risk.type] }}>
                                {risk.type === 'Earthquake' ? '🌋' : 
                                 risk.type === 'Flood' ? '🌊' :
                                 risk.type === 'Cyclone' ? '🌀' :
                                 risk.type === 'Wildfire' ? '🔥' :
                                 risk.type === 'Heatwave' ? '☀️' : '⚠️'}
                              </span>
                              {risk.location}
                              {risk.country && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                                  {risk.country}
                                </span>
                              )}
                            </h4>
                            <div className="text-sm text-gray-600 mt-1">
                              {risk.type} • {risk.time}
                            </div>
                            {risk.details && (
                              <p className="text-sm mt-1">{risk.details}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500`}
                                style={{ 
                                  width: `${risk.risk}%`,
                                  backgroundColor: DISASTER_COLORS[risk.type]
                                }}
                              ></div>
                            </div>
                            <span className={`font-bold`}
                              style={{ color: DISASTER_COLORS[risk.type] }}
                            >
                              {risk.risk}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}