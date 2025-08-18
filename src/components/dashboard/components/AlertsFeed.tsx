import { useState } from 'react';
import { Bell, BookmarkPlus, X, Clock, TrendingUp, AlertTriangle, FileText, Bookmark } from 'lucide-react';

interface Alert {
  id: number;
  type: 'opportunity' | 'policy' | 'climate';
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  isBookmarked: boolean;
}

interface AlertsFeedProps {
  alerts: Alert[];
  onAlertAction: (alertId: number, action: 'read' | 'bookmark' | 'dismiss') => void;
}

export default function AlertsFeed({ alerts, onAlertAction }: AlertsFeedProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'bookmarked'>('all');

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'policy':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'climate':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-50 border-green-200';
      case 'policy':
        return 'bg-blue-50 border-blue-200';
      case 'climate':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'unread':
        return !alert.isRead;
      case 'bookmarked':
        return alert.isBookmarked;
      default:
        return true;
    }
  });

  const unreadCount = alerts.filter(alert => !alert.isRead).length;
  const bookmarkedCount = alerts.filter(alert => alert.isBookmarked).length;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900">Real-time Alerts</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'unread'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('bookmarked')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'bookmarked'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bookmarked ({bookmarkedCount})
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredAlerts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !alert.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${
                          !alert.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {alert.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {alert.description}
                        </p>
                      </div>
                      
                      {!alert.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(alert.timestamp)}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.type === 'opportunity' ? 'bg-green-100 text-green-800' :
                          alert.type === 'policy' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {alert.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onAlertAction(alert.id, 'bookmark')}
                          className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                            alert.isBookmarked ? 'text-yellow-500' : 'text-gray-400'
                          }`}
                          title={alert.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                        >
                          {alert.isBookmarked ? (
                            <Bookmark className="w-4 h-4 fill-current" />
                          ) : (
                            <BookmarkPlus className="w-4 h-4" />
                          )}
                        </button>
                        
                        {!alert.isRead && (
                          <button
                            onClick={() => onAlertAction(alert.id, 'read')}
                            className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-400"
                            title="Mark as read"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {filter === 'unread' ? 'No unread alerts' :
               filter === 'bookmarked' ? 'No bookmarked alerts' :
               'No alerts'}
            </h3>
            <p className="text-sm text-gray-500">
              {filter === 'all' 
                ? 'New alerts will appear here when available'
                : `Switch to "All" to see ${filter === 'unread' ? 'all' : 'other'} alerts`
              }
            </p>
          </div>
        )}
      </div>

      {/* Alert Types Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Alert Types</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-gray-600">New Opportunities</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-blue-500" />
            <span className="text-gray-600">Policy Changes</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-gray-600">Climate Alerts</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {unreadCount > 0 && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              alerts.filter(alert => !alert.isRead).forEach(alert => {
                onAlertAction(alert.id, 'read');
              });
            }}
            className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}