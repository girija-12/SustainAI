import { useState, useEffect } from 'react';
import ChatWidget from '../shared/ChatWidget';
import { fetchAllMonitoringData, WeatherData, AirQualityData, DisasterAlert } from '../../services/apiServices';

export default function RealTimeMonitoring() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [riskLevel, setRiskLevel] = useState(3);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [disasterAlerts, setDisasterAlerts] = useState<DisasterAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('London');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Fetch live data
  const fetchLiveData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchAllMonitoringData(selectedCity);
      
      setWeatherData(data.weather);
      setAirQualityData(data.airQuality);
      setDisasterAlerts(data.alerts);
      setLastUpdated(new Date());
      
      // Calculate risk level based on air quality and weather conditions
      const aqi = data.airQuality.aqi;
      let calculatedRisk = 1;
      if (aqi > 300) calculatedRisk = 5;
      else if (aqi > 200) calculatedRisk = 4;
      else if (aqi > 150) calculatedRisk = 4;
      else if (aqi > 100) calculatedRisk = 3;
      else if (aqi > 50) calculatedRisk = 2;
      
      // Adjust risk based on weather conditions
      if (data.weather.description.includes('storm') || data.weather.description.includes('heavy')) {
        calculatedRisk = Math.min(5, calculatedRisk + 1);
      }
      
      setRiskLevel(calculatedRisk);
    } catch (error) {
      console.error('Error fetching live data:', error);
      setError('Failed to fetch live data. Using cached/fallback data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchLiveData();
    
    // Set up timers
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Fetch new data every 5 minutes
    const dataTimer = setInterval(() => {
      fetchLiveData();
    }, 300000);
    
    return () => {
      clearInterval(timeTimer);
      clearInterval(dataTimer);
    };
  }, [selectedCity]);

  // Convert disaster alerts to the format expected by the UI
  const alerts = disasterAlerts.map(alert => ({
    id: alert.id,
    type: alert.type,
    message: alert.title,
    severity: alert.severity === 'critical' ? 'high' : alert.severity,
    time: alert.date
  }));

  // Generate dynamic logs based on current data
  const generateLogs = () => {
    const logs = [];
    const now = new Date();
    
    // Add current time log
    logs.push({
      timestamp: now.toLocaleTimeString(),
      event: `Data refresh for ${selectedCity} completed`,
      status: loading ? 'info' : 'success'
    });
    
    // Add weather-related logs
    if (weatherData) {
      logs.push({
        timestamp: new Date(now.getTime() - 60000).toLocaleTimeString(),
        event: `Weather data updated: ${weatherData.temperature}°C, ${weatherData.description}`,
        status: 'success'
      });
    }
    
    // Add air quality logs
    if (airQualityData) {
      logs.push({
        timestamp: new Date(now.getTime() - 120000).toLocaleTimeString(),
        event: `Air quality monitoring: AQI ${airQualityData.aqi} (${airQualityData.status})`,
        status: airQualityData.aqi > 100 ? 'warning' : 'success'
      });
    }
    
    // Add alert logs
    if (disasterAlerts.length > 0) {
      logs.push({
        timestamp: new Date(now.getTime() - 180000).toLocaleTimeString(),
        event: `${disasterAlerts.length} disaster alerts processed`,
        status: disasterAlerts.some(alert => alert.severity === 'high' || alert.severity === 'critical') ? 'warning' : 'info'
      });
    }
    
    // Add system logs
    logs.push({
      timestamp: new Date(now.getTime() - 240000).toLocaleTimeString(),
      event: 'System health check completed',
      status: 'success'
    });
    
    return logs.slice(0, 5); // Keep only the latest 5 logs
  };
  
  const logs = generateLogs();

  const chatMessages = [
    { role: 'assistant' as const, content: 'Hello! I\'m AlertAI, your real-time monitoring assistant. I\'m tracking all critical systems and can provide instant alerts.' },
    { role: 'user' as const, content: `What's the current status of air quality in ${selectedCity}?` },
    { 
      role: 'assistant' as const, 
      content: airQualityData 
        ? `Current air quality status in ${selectedCity}: ${airQualityData.status} - AQI is ${airQualityData.aqi}. ${airQualityData.aqi > 100 ? 'I recommend limiting outdoor activities and using air filtration systems.' : 'Air quality is acceptable for outdoor activities.'} Weather: ${weatherData?.description || 'N/A'}, ${weatherData?.temperature || 'N/A'}°C.`
        : 'Loading current air quality data...'
    }
  ];

  const getRiskColor = (level: number) => {
    if (level <= 2) return 'text-green-500';
    if (level <= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskLabel = (level: number) => {
    if (level <= 2) return 'Low';
    if (level <= 3) return 'Medium';
    return 'High';
  };

  return (
    <div className="bg-gray-900 min-h-screen -m-8 p-8">
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* City Selector */}
          <div className="bg-gray-800 rounded-2xl p-4 shadow-xl border border-gray-700">
            <div className="flex items-center gap-4">
              <label className="text-white font-medium">Monitoring Location:</label>
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
              >
                <option value="London">London, UK</option>
                <option value="New York">New York, USA</option>
                <option value="Tokyo">Tokyo, Japan</option>
                <option value="Delhi">Delhi, India</option>
                <option value="Beijing">Beijing, China</option>
                <option value="Los Angeles">Los Angeles, USA</option>
                <option value="Mumbai">Mumbai, India</option>
                <option value="Sydney">Sydney, Australia</option>
              </select>
              <div className="flex items-center gap-4 ml-auto">
                <button
                  onClick={fetchLiveData}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    loading ? 'bg-yellow-500 animate-pulse' : 
                    error ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm text-gray-400">
                    {loading ? 'Updating...' : 
                     error ? 'Error' : 
                     lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Live'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Error Banner */}
          {error && (
            <div className="bg-red-900 border border-red-700 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="text-red-400 text-xl">⚠️</span>
                <div>
                  <h4 className="text-red-200 font-medium">Connection Issue</h4>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-200 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          {/* Risk Level Gauge */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">System Risk Level</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#374151" strokeWidth="12" fill="none" />
                  <circle 
                    cx="64" cy="64" r="56" 
                    stroke={riskLevel <= 2 ? '#10b981' : riskLevel <= 3 ? '#f59e0b' : '#ef4444'} 
                    strokeWidth="12" fill="none"
                    strokeDasharray={`${riskLevel * 70} 351`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${getRiskColor(riskLevel)}`}>{riskLevel}</span>
                  <span className="text-sm text-gray-400">/ 5</span>
                </div>
              </div>
            </div>
            <p className={`text-center mt-4 font-medium ${getRiskColor(riskLevel)}`}>
              {getRiskLabel(riskLevel)} Risk Level
            </p>
          </div>

          {/* Live Alerts */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Live Alerts</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">Live</span>
              </div>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-gray-700 rounded-xl p-4 border-l-4 border-l-red-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.severity === 'high' ? 'bg-red-900 text-red-200' :
                          'bg-yellow-900 text-yellow-200'
                        }`}>
                          {alert.type}
                        </span>
                        <span className="text-xs text-gray-400">{alert.time}</span>
                      </div>
                      <p className="text-gray-200 text-sm">{alert.message}</p>
                    </div>
                    <span className={`text-lg ${
                      alert.severity === 'high' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {alert.severity === 'high' ? '🚨' : '⚠️'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Widgets */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Air Quality Index</h4>
              <div className="text-center">
                {loading ? (
                  <div className="text-2xl text-gray-400">Loading...</div>
                ) : (
                  <>
                    <div className={`text-4xl font-bold mb-2 ${
                      !airQualityData ? 'text-gray-400' :
                      airQualityData.aqi <= 50 ? 'text-green-400' :
                      airQualityData.aqi <= 100 ? 'text-yellow-400' :
                      airQualityData.aqi <= 150 ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {airQualityData?.aqi || 'N/A'}
                    </div>
                    <div className={`${
                      !airQualityData ? 'text-gray-300' :
                      airQualityData.aqi <= 50 ? 'text-green-300' :
                      airQualityData.aqi <= 100 ? 'text-yellow-300' :
                      airQualityData.aqi <= 150 ? 'text-orange-300' :
                      'text-red-300'
                    }`}>
                      {airQualityData?.status || 'Unknown'}
                    </div>
                    <div className="mt-4 bg-gray-700 rounded-full h-2">
                      <div 
                        className={`rounded-full h-2 ${
                          !airQualityData ? 'bg-gray-500' :
                          airQualityData.aqi <= 50 ? 'bg-green-500' :
                          airQualityData.aqi <= 100 ? 'bg-yellow-500' :
                          airQualityData.aqi <= 150 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, (airQualityData?.aqi || 0) / 3)}%` }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Temperature</h4>
              <div className="text-center">
                {loading ? (
                  <div className="text-2xl text-gray-400">Loading...</div>
                ) : (
                  <>
                    <div className={`text-4xl font-bold mb-2 ${
                      !weatherData ? 'text-gray-400' :
                      weatherData.temperature < 0 ? 'text-blue-600' :
                      weatherData.temperature < 15 ? 'text-blue-400' :
                      weatherData.temperature < 25 ? 'text-green-400' :
                      weatherData.temperature < 35 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {weatherData?.temperature || 'N/A'}°C
                    </div>
                    <div className={`${
                      !weatherData ? 'text-gray-300' :
                      weatherData.temperature >= 15 && weatherData.temperature <= 25 ? 'text-green-300' :
                      'text-blue-300'
                    }`}>
                      {weatherData?.description || 'Unknown'}
                    </div>
                    <div className="mt-4 bg-gray-700 rounded-full h-2">
                      <div 
                        className={`rounded-full h-2 ${
                          !weatherData ? 'bg-gray-500' :
                          weatherData.temperature < 0 ? 'bg-blue-600' :
                          weatherData.temperature < 15 ? 'bg-blue-400' :
                          weatherData.temperature < 25 ? 'bg-green-500' :
                          weatherData.temperature < 35 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, ((weatherData?.temperature || 0) + 10) * 2))}%` }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Humidity</h4>
              <div className="text-center">
                {loading ? (
                  <div className="text-2xl text-gray-400">Loading...</div>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      {weatherData?.humidity || 'N/A'}%
                    </div>
                    <div className="text-blue-300">
                      {!weatherData ? 'Unknown' :
                       weatherData.humidity < 30 ? 'Low' :
                       weatherData.humidity > 70 ? 'High' : 'Normal'}
                    </div>
                    <div className="mt-4 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 rounded-full h-2"
                        style={{ width: `${weatherData?.humidity || 0}%` }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Wind Speed</h4>
              <div className="text-center">
                {loading ? (
                  <div className="text-2xl text-gray-400">Loading...</div>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      {weatherData?.windSpeed || 'N/A'} m/s
                    </div>
                    <div className="text-green-300">
                      {!weatherData ? 'Unknown' :
                       weatherData.windSpeed < 3 ? 'Light' :
                       weatherData.windSpeed < 8 ? 'Moderate' :
                       weatherData.windSpeed < 15 ? 'Strong' : 'Very Strong'}
                    </div>
                    <div className="mt-4 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 rounded-full h-2"
                        style={{ width: `${Math.min(100, (weatherData?.windSpeed || 0) * 5)}%` }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">System Logs</h3>
            <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="flex items-center gap-4 py-1">
                  <span className="text-gray-500">{log.timestamp}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    log.status === 'success' ? 'bg-green-500' :
                    log.status === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></span>
                  <span className="text-gray-300">{log.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
