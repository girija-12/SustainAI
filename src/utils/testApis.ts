// Test script to verify API integrations
import { WeatherService, FinancialService, NewsService, AIService } from '../services/apiService';

export async function testAPIIntegrations() {
  console.log('🧪 Testing API Integrations...');
  
  try {
    // Test Weather API
    console.log('🌤️ Testing Weather API...');
    const weatherData = await WeatherService.getCurrentWeather(40.7128, -74.0060); // NYC
    console.log('Weather API:', weatherData ? '✅ Success' : '❌ Failed');
    
    // Test Climate Risk
    const climateRisk = await WeatherService.getClimateRiskData(40.7128, -74.0060);
    console.log('Climate Risk API:', climateRisk ? '✅ Success' : '❌ Failed');
    
    // Test Financial API
    console.log('📈 Testing Financial API...');
    const marketTrends = await FinancialService.getMarketTrends();
    console.log('Market Trends API:', marketTrends.length > 0 ? '✅ Success' : '❌ Failed');
    
    // Test ESG Data
    const esgData = await FinancialService.getESGData('AAPL');
    console.log('ESG Data API:', esgData ? '✅ Success' : '❌ Failed');
    
    // Test News API
    console.log('📰 Testing News API...');
    const news = await NewsService.getESGNews(1, 5);
    console.log('ESG News API:', news.length > 0 ? '✅ Success' : '❌ Failed');
    
    const policyNews = await NewsService.getPolicyUpdates();
    console.log('Policy News API:', policyNews.length > 0 ? '✅ Success' : '❌ Failed');
    
    // Test AI API (simple test)
    console.log('🤖 Testing AI API...');
    const aiResponse = await AIService.getChatCompletion([
      { role: 'user', content: 'What is ESG investing?' }
    ]);
    console.log('AI Chat API:', aiResponse.length > 10 ? '✅ Success' : '❌ Failed');
    
    console.log('🎉 API Integration Test Complete!');
    
    return {
      weather: !!weatherData,
      climateRisk: !!climateRisk,
      marketTrends: marketTrends.length > 0,
      esgData: !!esgData,
      news: news.length > 0,
      policyNews: policyNews.length > 0,
      ai: aiResponse.length > 10
    };
    
  } catch (error) {
    console.error('❌ API Test Error:', error);
    return null;
  }
}

// Test individual APIs
export async function testWeatherAPI() {
  try {
    const data = await WeatherService.getCurrentWeather(40.7128, -74.0060);
    console.log('Weather Test Result:', data);
    return data;
  } catch (error) {
    console.error('Weather API Error:', error);
    return null;
  }
}

export async function testFinancialAPI() {
  try {
    const data = await FinancialService.getMarketTrends();
    console.log('Financial Test Result:', data);
    return data;
  } catch (error) {
    console.error('Financial API Error:', error);
    return null;
  }
}

export async function testNewsAPI() {
  try {
    const data = await NewsService.getESGNews(1, 3);
    console.log('News Test Result:', data);
    return data;
  } catch (error) {
    console.error('News API Error:', error);
    return null;
  }
}

export async function testAIAPI() {
  try {
    const data = await AIService.getChatCompletion([
      { role: 'user', content: 'Hello, can you help with ESG investing?' }
    ]);
    console.log('AI Test Result:', data);
    return data;
  } catch (error) {
    console.error('AI API Error:', error);
    return null;
  }
}