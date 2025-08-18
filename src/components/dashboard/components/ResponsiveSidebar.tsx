import React, { useState } from 'react';
import { 
  MessageCircle, 
  Bell, 
  X, 
  Menu, 
  Sparkles, 
  TrendingUp, 
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Minimize2,
  Maximize2
} from 'lucide-react';
import ChatWidget from '../../shared/ChatWidget';
import AlertsFeed from './AlertsFeed';

interface ResponsiveSidebarProps {
  chatMessages: Array<{role: 'user' | 'assistant', content: string}>;
  onChatMessage: (message: string) => void;
  alerts: any[];
  onAlertAction: (alertId: number, action: 'read' | 'bookmark' | 'dismiss') => void;
  aiLoading: boolean;
}

const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({
  chatMessages,
  onChatMessage,
  alerts,
  onAlertAction,
  aiLoading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'alerts' | 'portfolio'>('chat');
  const [isMinimized, setIsMinimized] = useState(false);

  const tabs = [
    { id: 'chat', label: 'AI Assistant', icon: MessageCircle, count: 0 },
    { id: 'alerts', label: 'Alerts', icon: Bell, count: alerts.filter(a => !a.isRead).length },
    { id: 'portfolio', label: 'Portfolio', icon: TrendingUp, count: 0 }
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 right-4 z-50 bg-emerald-500 text-white p-3 rounded-full shadow-lg hover:bg-emerald-600 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Container */}
      <div className={`
        fixed lg:sticky top-0 right-0 h-screen z-40 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        ${isMinimized ? 'w-16' : 'w-80 lg:w-96'}
      `}>
        {/* Backdrop for mobile */}
        {isOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Sidebar Content */}
        <div className="h-full bg-white/95 backdrop-blur-sm shadow-2xl border-l border-white/20 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 flex items-center justify-between">
            {!isMinimized && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">EcoVest Hub</h3>
                  <p className="text-emerald-100 text-xs">Your investment companion</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMinimize}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                {isMinimized ? 
                  <Maximize2 className="w-4 h-4 text-white" /> : 
                  <Minimize2 className="w-4 h-4 text-white" />
                }
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized ? (
            <>
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 bg-white/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-emerald-600 bg-emerald-50 border-b-2 border-emerald-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'chat' && (
                  <div className="h-full">
                    <ChatWidget
                      agentName="EcoVest AI"
                      agentDescription="Your sustainable investment advisor"
                      messages={chatMessages}
                      onSendMessage={onChatMessage}
                      placeholder="Ask about ESG opportunities..."
                      bgColor="from-emerald-500 to-teal-600"
                      isLoading={aiLoading}
                    />
                  </div>
                )}

                {activeTab === 'alerts' && (
                  <div className="h-full overflow-y-auto">
                    <AlertsFeed 
                      alerts={alerts}
                      onAlertAction={onAlertAction}
                    />
                  </div>
                )}

                {activeTab === 'portfolio' && (
                  <div className="p-4 space-y-4">
                    {/* Portfolio Summary */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                      <h4 className="font-semibold text-emerald-900 mb-3">Portfolio Overview</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-700 text-sm">Total Value</span>
                          <span className="font-bold text-emerald-900">$2,450,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-700 text-sm">Today's Change</span>
                          <span className="font-bold text-green-600">+$12,450 (+0.51%)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-700 text-sm">ESG Score</span>
                          <span className="font-bold text-emerald-900">87/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Quick Actions</h4>
                      <button className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-600 transition-colors">
                        Add Investment
                      </button>
                      <button className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                        Rebalance Portfolio
                      </button>
                      <button className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-600 transition-colors">
                        Generate Report
                      </button>
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Recent Activity</h4>
                      <div className="space-y-2">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium">Solar Energy Fund</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">+2.3% today</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium">Clean Water Initiative</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">New investment added</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm font-medium">ESG Report</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Generated successfully</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Minimized View */
            <div className="flex-1 flex flex-col items-center py-4 space-y-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsMinimized(false);
                  }}
                  className={`p-3 rounded-lg transition-colors relative ${
                    activeTab === tab.id
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ResponsiveSidebar;