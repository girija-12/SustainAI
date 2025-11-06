// API Service for real-time data integration
const API_KEYS = {
  WEATHER: import.meta.env.VITE_OPENWEATHER_API_KEY || '0bd84edc72a25d08efa9ec05c698ec80',
  FINANCIAL: import.meta.env.VITE_FINANCIAL_API_KEY || 'KZVDXAKNAWP4AR37',
  OPENAI: import.meta.env.VITE_ECOVEST_OPENAI_API_KEY || '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',
  NEWS: import.meta.env.VITE_NEWS_API_KEY || '9864287ccc1145058a2548d0ff763db2',
  OPENAI_PRODUCT: import.meta.env.VITE_OPENAI_API_KEY || '',
  GEMINI: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_GEMINI_API_KEY || ''
};

// Weather API Service
export class WeatherService {
  private static baseUrl = 'https://api.openweathermap.org/data/2.5';

  static async getCurrentWeather(lat: number, lon: number) {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${API_KEYS.WEATHER}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        visibility: data.visibility,
        cloudiness: data.clouds.all
      };
    } catch (error) {
      console.error('Weather API error:', error);
      return null;
    }
  }

  static async getClimateRiskData(lat: number, lon: number) {
    try {
      // Get current weather and forecast for climate risk assessment
      const [current, forecast] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.getForecast(lat, lon)
      ]);

      if (!current || !forecast) return null;

      // Calculate climate risk based on weather patterns
      const extremeTemp = Math.abs(current.temperature) > 35 || current.temperature < -10;
      const highHumidity = current.humidity > 80;
      const lowVisibility = current.visibility < 5000;
      const highWindSpeed = current.windSpeed > 15;

      const riskFactors = [extremeTemp, highHumidity, lowVisibility, highWindSpeed];
      const riskScore = (riskFactors.filter(Boolean).length / riskFactors.length) * 100;

      return {
        riskScore: Math.round(riskScore),
        factors: {
          temperature: extremeTemp,
          humidity: highHumidity,
          visibility: lowVisibility,
          windSpeed: highWindSpeed
        },
        current,
        forecast: forecast.slice(0, 5) // Next 5 days
      };
    } catch (error) {
      console.error('Climate risk calculation error:', error);
      return null;
    }
  }

  private static async getForecast(lat: number, lon: number) {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEYS.WEATHER}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.list.map((item: any) => ({
        date: new Date(item.dt * 1000),
        temperature: item.main.temp,
        description: item.weather[0].description,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed
      }));
    } catch (error) {
      console.error('Forecast API error:', error);
      return [];
    }
  }
}

// Financial Data Service
export class FinancialService {
  private static baseUrl = 'https://www.alphavantage.co/query';

  static async getESGData(symbol: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEYS.FINANCIAL}`
      );
      
      if (!response.ok) {
        throw new Error(`Financial API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Calculate ESG score based on available financial metrics
      const esgScore = this.calculateESGScore(data);
      
      return {
        symbol,
        marketCap: data.MarketCapitalization,
        peRatio: data.PERatio,
        dividendYield: data.DividendYield,
        profitMargin: data.ProfitMargin,
        returnOnEquity: data.ReturnOnEquityTTM,
        esgScore,
        sector: data.Sector,
        industry: data.Industry,
        description: data.Description
      };
    } catch (error) {
      console.error('Financial API error:', error);
      return null;
    }
  }

  static async getMarketTrends() {
    try {
      // Get data for major ESG-related ETFs and indices
      const symbols = ['ESGU', 'ESGD', 'VSGX', 'ICLN', 'PBW'];
      const promises = symbols.map(symbol => this.getStockData(symbol));
      const results = await Promise.all(promises);
      
      return results.filter(Boolean).map(data => ({
        symbol: data!.symbol,
        price: data!.price,
        change: data!.change,
        changePercent: data!.changePercent,
        volume: data!.volume
      }));
    } catch (error) {
      console.error('Market trends error:', error);
      return [];
    }
  }

  private static async getStockData(symbol: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEYS.FINANCIAL}`
      );
      
      if (!response.ok) {
        throw new Error(`Stock API error: ${response.status}`);
      }
      
      const data = await response.json();
      const quote = data['Global Quote'];
      
      if (!quote) return null;
      
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'],
        volume: parseInt(quote['06. volume'])
      };
    } catch (error) {
      console.error('Stock data error:', error);
      return null;
    }
  }

  private static calculateESGScore(data: any): number {
    // Simple ESG scoring algorithm based on financial metrics
    let score = 50; // Base score
    
    // Environmental factors (based on sector and efficiency metrics)
    if (data.Sector === 'Technology' || data.Sector === 'Utilities') score += 10;
    if (data.Sector === 'Energy' && data.Industry?.includes('Renewable')) score += 15;
    if (data.Sector === 'Materials' || data.Sector === 'Industrials') score -= 5;
    
    // Social factors (based on employee and customer metrics)
    const profitMargin = parseFloat(data.ProfitMargin) || 0;
    if (profitMargin > 0.15) score += 5; // Good profitability suggests good management
    if (profitMargin < 0.05) score -= 5;
    
    // Governance factors (based on financial health)
    const roe = parseFloat(data.ReturnOnEquityTTM) || 0;
    if (roe > 0.15) score += 10;
    if (roe < 0.05) score -= 10;
    
    const peRatio = parseFloat(data.PERatio) || 0;
    if (peRatio > 0 && peRatio < 25) score += 5; // Reasonable valuation
    
    return Math.max(0, Math.min(100, score));
  }
}

// News Service
export class NewsService {
  private static baseUrl = 'https://newsapi.org/v2';

  static async getESGNews(page = 1, pageSize = 10) {
    try {
      const keywords = 'ESG OR "sustainable investing" OR "green finance" OR "climate change" OR "renewable energy"';
      const response = await fetch(
        `${this.baseUrl}/everything?q=${encodeURIComponent(keywords)}&sortBy=publishedAt&page=${page}&pageSize=${pageSize}&apiKey=${API_KEYS.NEWS}`
      );
      
      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.articles.map((article: any) => ({
        id: article.url,
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt),
        imageUrl: article.urlToImage,
        category: this.categorizeNews(article.title + ' ' + article.description)
      }));
    } catch (error) {
      console.error('News API error:', error);
      return [];
    }
  }

  static async getPolicyUpdates() {
    try {
      const keywords = '"climate policy" OR "environmental regulation" OR "carbon tax" OR "green bonds"';
      const response = await fetch(
        `${this.baseUrl}/everything?q=${encodeURIComponent(keywords)}&sortBy=publishedAt&pageSize=20&apiKey=${API_KEYS.NEWS}`
      );
      
      if (!response.ok) {
        throw new Error(`Policy news API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.articles.map((article: any) => ({
        id: article.url,
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt),
        impact: this.assessPolicyImpact(article.title + ' ' + article.description)
      }));
    } catch (error) {
      console.error('Policy news API error:', error);
      return [];
    }
  }

  private static categorizeNews(content: string): 'opportunity' | 'policy' | 'climate' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('policy') || lowerContent.includes('regulation') || lowerContent.includes('law')) {
      return 'policy';
    }
    
    if (lowerContent.includes('climate') || lowerContent.includes('weather') || lowerContent.includes('disaster')) {
      return 'climate';
    }
    
    return 'opportunity';
  }

  private static assessPolicyImpact(content: string): 'high' | 'medium' | 'low' {
    const lowerContent = content.toLowerCase();
    const highImpactKeywords = ['ban', 'mandate', 'tax', 'subsidy', 'billion', 'trillion'];
    const mediumImpactKeywords = ['incentive', 'target', 'goal', 'plan', 'initiative'];
    
    if (highImpactKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'high';
    }
    
    if (mediumImpactKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }
}

// Open Food Facts Service for product sustainability data
export class OpenFoodFactsService {
  private static baseUrl = 'https://world.openfoodfacts.org/api/v2';

  static async searchProduct(productName: string) {
    try {
      // Clean product name for search
      const searchQuery = encodeURIComponent(productName.trim().toLowerCase());
      const response = await fetch(
        `${this.baseUrl}/search?search_terms=${searchQuery}&page_size=5&fields=product_name,ecoscore_grade,ecoscore_score,packaging_tags,labels_tags,image_url,code`
      );

      if (!response.ok) {
        throw new Error(`Open Food Facts API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.products || data.products.length === 0) {
        return null;
      }

      // Return the best match (first product)
      const product = data.products[0];
      return {
        name: product.product_name || productName,
        ecoscore: {
          grade: product.ecoscore_grade || 'unknown',
          score: product.ecoscore_score || null
        },
        packaging: product.packaging_tags || [],
        labels: product.labels_tags || [],
        imageUrl: product.image_url || null,
        barcode: product.code || null
      };
    } catch (error) {
      console.error('Open Food Facts API error:', error);
      return null;
    }
  }

  static async getBetterAlternatives(productName: string, category: string) {
    try {
      // Search for similar products in the same category
      const searchQuery = encodeURIComponent(`${category} ${productName}`);
      const response = await fetch(
        `${this.baseUrl}/search?search_terms=${searchQuery}&page_size=10&fields=product_name,ecoscore_grade,ecoscore_score,packaging_tags,labels_tags,image_url,code&sort_by=ecoscore_score`
      );

      if (!response.ok) {
        throw new Error(`Open Food Facts API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.products || data.products.length === 0) {
        return [];
      }

      // Filter products with better ecoscore (A or B grades) and return top 3-5
      const alternatives = data.products
        .filter((p: any) => {
          const grade = p.ecoscore_grade?.toUpperCase();
          return grade && (grade === 'A' || grade === 'B');
        })
        .slice(0, 5)
        .map((p: any) => ({
          name: p.product_name || 'Unknown',
          ecoscore: {
            grade: p.ecoscore_grade || 'unknown',
            score: p.ecoscore_score || null
          },
          packaging: p.packaging_tags || [],
          labels: p.labels_tags || [],
          imageUrl: p.image_url || null,
          barcode: p.code || null
        }));

      return alternatives;
    } catch (error) {
      console.error('Open Food Facts alternatives error:', error);
      return [];
    }
  }
}

// OpenAI Service for EcoVest AI
export class AIService {
  private static baseUrl = 'https://api.openai.com/v1';
  private static geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  // Gemini API call
  private static async getGeminiCompletion(messages: Array<{role: string, content: string}>) {
    try {
      const apiKey = API_KEYS.GEMINI;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const systemPrompt = `You are EcoVest, an AI advisor specializing in sustainable and ESG investments. 
You provide expert analysis on environmental, social, and governance factors in investment decisions.
Always consider climate risks, policy impacts, and long-term sustainability in your recommendations.
Be concise but informative, and always prioritize factual, data-driven insights.`;

      // Extract user message (last message should be user)
      const userMessage = messages.find(m => m.role === 'user') || messages[messages.length - 1];
      const userContent = userMessage?.content || '';
      
      // Combine system prompt with user message
      const fullPrompt = `${systemPrompt}\n\n${userContent}`;

      // Use gemini-1.5-flash (faster) or try gemini-1.5-pro if needed
      const model = 'gemini-1.5-flash';
      const url = `${this.geminiBaseUrl}/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }
      
      throw new Error('Invalid response format from Gemini API');
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  // Helper to check if a key is a valid OpenAI key (starts with sk-)
  private static isValidOpenAIKey(key: string | undefined): boolean {
    if (!key) return false;
    // OpenAI keys start with "sk-"
    return key.trim().startsWith('sk-');
  }

  // Helper to check if a key is a valid Gemini key (starts with AIza)
  private static isValidGeminiKey(key: string | undefined): boolean {
    if (!key) return false;
    // Gemini keys start with "AIza"
    return key.trim().startsWith('AIza');
  }

  // OpenAI API call
  private static async getOpenAICompletion(messages: Array<{role: string, content: string}>, useProductKey = false) {
    try {
      let apiKey: string | undefined;
      
      if (useProductKey) {
        apiKey = API_KEYS.OPENAI_PRODUCT;
        // If product key is set but looks like Gemini key, don't use it
        if (apiKey && this.isValidGeminiKey(apiKey)) {
          apiKey = undefined;
        }
      }
      
      // If no valid product key, try main OpenAI key
      if (!apiKey || !this.isValidOpenAIKey(apiKey)) {
        apiKey = API_KEYS.OPENAI;
      }
      
      // Final check - make sure it's a valid OpenAI key
      if (!apiKey || !this.isValidOpenAIKey(apiKey)) {
        throw new Error('OpenAI API key not configured or invalid');
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Using gpt-3.5-turbo as it's more accessible than gpt-4
          messages: [
            {
              role: 'system',
              content: `You are EcoVest, an AI advisor specializing in sustainable and ESG investments. 
              You provide expert analysis on environmental, social, and governance factors in investment decisions.
              Always consider climate risks, policy impacts, and long-term sustainability in your recommendations.
              Be concise but informative, and always prioritize factual, data-driven insights.`
            },
            ...messages
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  // Main method that tries Gemini first, then falls back to OpenAI
  static async getChatCompletion(messages: Array<{role: string, content: string}>, useProductKey = false) {
    // Try Gemini first if API key is available and valid
    if (API_KEYS.GEMINI && this.isValidGeminiKey(API_KEYS.GEMINI)) {
      try {
        return await this.getGeminiCompletion(messages);
      } catch (geminiError) {
        console.warn('Gemini API failed, falling back to OpenAI:', geminiError);
        // Continue to OpenAI fallback
      }
    }

    // Fallback to OpenAI if Gemini failed or wasn't available
    const hasValidOpenAIKey = useProductKey 
      ? this.isValidOpenAIKey(API_KEYS.OPENAI_PRODUCT) 
      : this.isValidOpenAIKey(API_KEYS.OPENAI);
    
    if (hasValidOpenAIKey) {
      try {
        return await this.getOpenAICompletion(messages, useProductKey);
      } catch (openAiError) {
        console.error('OpenAI API also failed:', openAiError);
        // If both APIs fail, return error message
        return 'I apologize, but I\'m currently unable to process your request. Both Gemini and OpenAI APIs failed. Please check your API keys and try again later.';
      }
    }

    // If neither API has a valid key configured
    if (!API_KEYS.GEMINI && !hasValidOpenAIKey) {
      return 'I apologize, but I\'m currently unable to process your request. Please ensure you have a valid API key configured (VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY).';
    }

    // If Gemini key exists but is invalid, and no OpenAI key
    if (API_KEYS.GEMINI && !this.isValidGeminiKey(API_KEYS.GEMINI) && !hasValidOpenAIKey) {
      return 'I apologize, but I\'m currently unable to process your request. The Gemini API key appears to be invalid. Please check your VITE_GEMINI_API_KEY or configure VITE_OPENAI_API_KEY.';
    }

    // Final fallback
    return 'I apologize, but I\'m currently unable to process your request. Please try again later.';
  }

  static async analyzeInvestmentOpportunity(investment: any) {
    const prompt = `Analyze this sustainable investment opportunity:
    
    Name: ${investment.name}
    Sector: ${investment.sector}
    Region: ${investment.region}
    Expected ROI: ${investment.roi}%
    ESG Score: ${investment.esgScore}
    Risk Level: ${investment.risk}
    Climate Risk: ${investment.climateRisk}%
    
    Provide a brief analysis covering:
    1. Key strengths and opportunities
    2. Potential risks and concerns
    3. ESG impact assessment
    4. Investment recommendation (1-3 sentences)`;

    return this.getChatCompletion([{ role: 'user', content: prompt }]);
  }

  static async generatePortfolioRecommendations(investments: any[]) {
    const portfolioSummary = {
      totalInvestments: investments.length,
      avgESG: investments.reduce((sum, inv) => sum + inv.esgScore, 0) / investments.length,
      avgROI: investments.reduce((sum, inv) => sum + inv.roi, 0) / investments.length,
      sectors: [...new Set(investments.map(inv => inv.sector))],
      regions: [...new Set(investments.map(inv => inv.region))]
    };

    const prompt = `Analyze this sustainable investment portfolio and provide recommendations:
    
    Portfolio Summary:
    - Total Investments: ${portfolioSummary.totalInvestments}
    - Average ESG Score: ${portfolioSummary.avgESG.toFixed(1)}
    - Average Expected ROI: ${portfolioSummary.avgROI.toFixed(1)}%
    - Sectors: ${portfolioSummary.sectors.join(', ')}
    - Regions: ${portfolioSummary.regions.join(', ')}
    
    Provide 3-4 specific recommendations for portfolio optimization focusing on:
    1. Diversification opportunities
    2. ESG improvement potential
    3. Risk management
    4. Emerging opportunities`;

    return this.getChatCompletion([{ role: 'user', content: prompt }]);
  }

  static async generateGreenerAlternatives(productName: string, category: string, currentProductData: any, alternatives: any[]) {
    try {
      const currentEcoscore = currentProductData?.ecoscore?.grade || 'unknown';
      const currentPackaging = currentProductData?.packaging?.join(', ') || 'unknown';
      const currentLabels = currentProductData?.labels?.join(', ') || 'none';

      const alternativesSummary = alternatives.map((alt, idx) => 
        `${idx + 1}. ${alt.name} (Eco-Score: ${alt.ecoscore?.grade || 'N/A'}, Packaging: ${alt.packaging?.join(', ') || 'N/A'}, Labels: ${alt.labels?.join(', ') || 'N/A'})`
      ).join('\n');

      const prompt = `You are a sustainability expert helping consumers make greener purchasing decisions.

Current Product: ${productName}
Category: ${category}
Current Eco-Score: ${currentEcoscore}
Current Packaging: ${currentPackaging}
Current Labels: ${currentLabels}

Available Greener Alternatives:
${alternativesSummary}

Generate a human-readable recommendation (2-3 paragraphs) that:
1. Explains why these alternatives are more sustainable
2. Compares Eco-Scores, packaging materials, and certification labels
3. Provides specific, actionable advice on choosing the best alternative
4. Highlights the environmental benefits (CO2 reduction, plastic reduction, water savings)

Format your response as clear, friendly advice that empowers the consumer to make informed choices.`;

      return this.getChatCompletion([{ role: 'user', content: prompt }], true);
    } catch (error) {
      console.error('Error generating greener alternatives:', error);
      return 'Unable to generate recommendations at this time. Please try again later.';
    }
  }

  static async generateProductRecommendations(purchases: Array<{product: string, category: string}>) {
    try {
      const productList = purchases.map((p, idx) => 
        `${idx + 1}. ${p.product} (${p.category})`
      ).join('\n');

      const prompt = `Analyze this list of recent purchases and provide personalized sustainability recommendations:

Purchases:
${productList}

Generate comprehensive, actionable recommendations (3-4 paragraphs) that:
1. Identify patterns in the user's purchasing habits
2. Suggest specific greener alternatives for key products
3. Provide tips for reducing environmental impact in their shopping
4. Highlight categories where they could make the biggest sustainability improvements

Be specific, practical, and encouraging. Focus on realistic changes that fit different lifestyles.`;

      return this.getChatCompletion([{ role: 'user', content: prompt }], true);
    } catch (error) {
      console.error('Error generating product recommendations:', error);
      return 'Unable to generate recommendations at this time. Please try again later.';
    }
  }
}

// Utility function to combine all real-time data
export async function getEnhancedInvestmentData(investment: any) {
  try {
    const [weatherData, financialData, newsData] = await Promise.all([
      WeatherService.getClimateRiskData(investment.lat, investment.lng),
      FinancialService.getESGData(investment.symbol || 'SPY'), // Fallback to S&P 500
      NewsService.getESGNews(1, 5)
    ]);

    return {
      ...investment,
      realTimeData: {
        weather: weatherData,
        financial: financialData,
        news: newsData,
        lastUpdated: new Date()
      }
    };
  } catch (error) {
    console.error('Error fetching enhanced investment data:', error);
    return investment;
  }
}