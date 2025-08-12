// Test script to verify API integrations
import { fetchAllMonitoringData } from './apiServices';

export const testApiIntegrations = async () => {
  console.log('Testing API integrations...');
  
  try {
    const data = await fetchAllMonitoringData('London');
    console.log('✅ API Test Results:');
    console.log('Weather Data:', data.weather);
    console.log('Air Quality Data:', data.airQuality);
    console.log('Disaster Alerts:', data.alerts.length, 'alerts found');
    return true;
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    return false;
  }
};

// Run test if this file is executed directly
if (import.meta.hot) {
  testApiIntegrations();
}