import { useState, useEffect } from 'react';
import ChatWidget from '../shared/ChatWidget';

export default function RealTimeMonitoring() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [riskLevel, setRiskLevel] = useState(3);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Simulate changing risk level
      setRiskLevel(Math.floor(Math.random() * 5) + 1);
    }, 5000);
    
    return () => clearInterval(timer);
  }, []);

  const alerts = [
    { id: 1, type: 'Environmental', message: 'Air quality index exceeds safe levels in downtown area', severity: 'high', time: '2 min ago' },
    { id: 2, type: 'Infrastructure', message: 'Traffic congestion detected on Highway 101', severity: 'medium', time: '5 min ago' },
    { id: 3, type: 'Weather', message: 'Heavy rainfall warning issued for next 3 hours', severity: 'medium', time: '8 min ago' },
    { id: 4, type: 'Security', message: 'Unusual activity detected in financial district', severity: 'high', time: '12 min ago' },
  ];

  const logs = [
    { timestamp: '14:32:15', event: 'System health check completed', status: 'success' },
    { timestamp: '14:31:42', event: 'Data sync with weather stations', status: 'success' },
    { timestamp: '14:30:18', event: 'Alert threshold updated for air quality', status: 'info' },
    { timestamp: '14:29:55', event: 'New sensor data received from downtown', status: 'success' },
    { timestamp: '14:28:33', event: 'Connection timeout to sensor #247', status: 'warning' },
  ];

  const chatMessages = [
    { role: 'assistant' as const, content: 'Hello! I\'m AlertAI, your real-time monitoring assistant. I\'m tracking all critical systems and can provide instant alerts.' },
    { role: 'user' as const, content: 'What\'s the current status of air quality in the city?' },
    { role: 'assistant' as const, content: 'Current air quality status: ALERT - AQI is 156 (Unhealthy) in downtown area. I recommend issuing public health advisory and activating air filtration systems in public buildings. Wind patterns suggest improvement in 4-6 hours.' }
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
        {/* AI Agent Card */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🚨</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">AlertAI</h3>
                <p className="text-gray-400 text-sm">Real-time monitoring and alert system</p>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-xl p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {chatMessages.map((message, index) => (
                  <div key={index} className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-3 rounded-lg max-w-xs ${
                      message.role === 'user' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-600 text-gray-100'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4">
              <input
                type="text"
                placeholder="Ask about system status..."
                className="w-full bg-gray-700 text-white p-3 rounded-xl border border-gray-600 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
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
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Air Quality Index</h4>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-400 mb-2">156</div>
                <div className="text-red-300">Unhealthy</div>
                <div className="mt-4 bg-gray-700 rounded-full h-2">
                  <div className="bg-red-500 rounded-full h-2" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Temperature</h4>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">23°C</div>
                <div className="text-blue-300">Optimal</div>
                <div className="mt-4 bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 rounded-full h-2" style={{ width: '65%' }}></div>
                </div>
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
