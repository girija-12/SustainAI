// API service functions for real-time monitoring
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const AIRQUALITY_API_KEY = import.meta.env.VITE_AIRQUALITY_API_KEY;

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  description: string;
  city: string;
}

export interface AirQualityData {
  aqi: number;
  status: string;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
}

export interface DisasterAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  date: string;
  country: string;
  url: string;
}

// OpenWeatherMap API
export const fetchWeatherData = async (city: string = 'London'): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      description: data.weather[0].description,
      city: data.name
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Return fallback data
    return {
      temperature: 23,
      humidity: 65,
      pressure: 1013,
      windSpeed: 5.2,
      description: 'clear sky',
      city: city
    };
  }
};

// Air Quality API
export const fetchAirQualityData = async (city: string = 'London'): Promise<AirQualityData> => {
  try {
    const response = await fetch(
      `https://api.waqi.info/feed/${city}/?token=${AIRQUALITY_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Air Quality API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error('Air Quality API returned error status');
    }
    
    const aqi = data.data.aqi;
    let status = 'Good';
    if (aqi > 300) status = 'Hazardous';
    else if (aqi > 200) status = 'Very Unhealthy';
    else if (aqi > 150) status = 'Unhealthy';
    else if (aqi > 100) status = 'Unhealthy for Sensitive Groups';
    else if (aqi > 50) status = 'Moderate';
    
    return {
      aqi: aqi,
      status: status,
      pm25: data.data.iaqi?.pm25?.v || 0,
      pm10: data.data.iaqi?.pm10?.v || 0,
      o3: data.data.iaqi?.o3?.v || 0,
      no2: data.data.iaqi?.no2?.v || 0,
      so2: data.data.iaqi?.so2?.v || 0,
      co: data.data.iaqi?.co?.v || 0
    };
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    // Return fallback data
    return {
      aqi: 156,
      status: 'Unhealthy',
      pm25: 65,
      pm10: 85,
      o3: 45,
      no2: 32,
      so2: 12,
      co: 8
    };
  }
};

// ReliefWeb API for disaster alerts
export const fetchDisasterAlerts = async (limit: number = 5): Promise<DisasterAlert[]> => {
  try {
    const response = await fetch(
      `https://api.reliefweb.int/v1/reports?appname=sustainai&query[value]=disaster&query[operator]=AND&limit=${limit}&sort[]=date:desc&fields[include][]=title&fields[include][]=body&fields[include][]=date&fields[include][]=country&fields[include][]=disaster_type&fields[include][]=url_alias`
    );
    
    if (!response.ok) {
      throw new Error(`ReliefWeb API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.data.map((item: any, index: number) => {
      const severity = getSeverityFromContent(item.fields.title + ' ' + (item.fields.body || ''));
      
      return {
        id: `relief_${index}_${Date.now()}`,
        title: item.fields.title,
        description: item.fields.body ? item.fields.body.substring(0, 200) + '...' : 'No description available',
        severity: severity,
        type: item.fields.disaster_type?.[0]?.name || 'General',
        date: new Date(item.fields.date.created).toLocaleDateString(),
        country: item.fields.country?.[0]?.name || 'Global',
        url: `https://reliefweb.int${item.fields.url_alias}`
      };
    });
  } catch (error) {
    console.error('Error fetching disaster alerts:', error);
    // Return fallback data
    return [
      {
        id: 'fallback_1',
        title: 'Severe Weather Alert',
        description: 'Heavy rainfall and flooding expected in coastal regions...',
        severity: 'high',
        type: 'Weather',
        date: new Date().toLocaleDateString(),
        country: 'Global',
        url: '#'
      },
      {
        id: 'fallback_2',
        title: 'Air Quality Warning',
        description: 'Elevated pollution levels detected in urban areas...',
        severity: 'medium',
        type: 'Environmental',
        date: new Date().toLocaleDateString(),
        country: 'Global',
        url: '#'
      }
    ];
  }
};

// Helper function to determine severity from content
const getSeverityFromContent = (content: string): 'low' | 'medium' | 'high' | 'critical' => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('critical') || lowerContent.includes('emergency') || lowerContent.includes('severe')) {
    return 'critical';
  } else if (lowerContent.includes('high') || lowerContent.includes('urgent') || lowerContent.includes('warning')) {
    return 'high';
  } else if (lowerContent.includes('moderate') || lowerContent.includes('alert') || lowerContent.includes('caution')) {
    return 'medium';
  } else {
    return 'low';
  }
};

// Combined data fetching function
export const fetchAllMonitoringData = async (city: string = 'London') => {
  try {
    const [weatherData, airQualityData, disasterAlerts] = await Promise.all([
      fetchWeatherData(city),
      fetchAirQualityData(city),
      fetchDisasterAlerts(4)
    ]);
    
    return {
      weather: weatherData,
      airQuality: airQualityData,
      alerts: disasterAlerts
    };
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    throw error;
  }
};