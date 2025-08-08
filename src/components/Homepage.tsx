import { useState, useEffect } from 'react';

interface HomepageProps {
  setCurrentView: (view: 'home' | 'dashboard' | 'demo') => void;
}

export default function Homepage({ setCurrentView }: HomepageProps) {
  const [animatedStats, setAnimatedStats] = useState({
    sustainability: 0,
    wellbeing: 0,
    fraud: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats({
        sustainability: 87,
        wellbeing: 92,
        fraud: 99.2
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const services = [
    {
      icon: '🌱',
      title: 'Sustainable Consumption',
      description: 'AI-powered recommendations for eco-friendly products and lifestyle choices'
    },
    {
      icon: '💚',
      title: 'Ethical Finance',
      description: 'Fraud detection and ethical investment analysis for financial integrity'
    },
    {
      icon: '📊',
      title: 'Wellbeing Analytics',
      description: 'Comprehensive wellness tracking and mental health insights'
    },
    {
      icon: '🏗️',
      title: 'Disaster Resilience',
      description: 'Infrastructure risk assessment and disaster preparedness planning'
    },
    {
      icon: '📈',
      title: 'Investment Prediction',
      description: 'Sustainable investment opportunities with impact forecasting'
    },
    {
      icon: '🚨',
      title: 'Real-time Alerts',
      description: 'Live monitoring and instant notifications for critical events'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-600 via-blue-600 to-green-500 bg-clip-text text-transparent animate-fade-in">
            AI for Sustainability and Wellbeing
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 animate-fade-in-delay">
            Empowering governments, NGOs, and smart cities with intelligent solutions for a sustainable future
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-2">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Explore Dashboard
            </button>
            <button 
              onClick={() => setCurrentView('demo')}
              className="px-8 py-4 bg-white text-green-600 font-semibold rounded-xl border-2 border-green-600 hover:bg-green-50 transform hover:scale-105 transition-all duration-300"
            >
              Try Demo
            </button>
            <button className="px-8 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transform hover:scale-105 transition-all duration-300">
              Get Insights
            </button>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 bg-white/50 rounded-3xl mb-16 backdrop-blur-sm">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Live Dashboard Preview</h2>
          <p className="text-gray-600">Real-time insights powered by AI</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto px-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white transform hover:scale-105 transition-all duration-300">
            <div className="text-4xl font-bold mb-2">
              {animatedStats.sustainability}%
            </div>
            <div className="text-green-100">Sustainability Score</div>
            <div className="mt-4 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-2000 ease-out"
                style={{ width: `${animatedStats.sustainability}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white transform hover:scale-105 transition-all duration-300">
            <div className="text-4xl font-bold mb-2">
              {animatedStats.wellbeing}%
            </div>
            <div className="text-blue-100">Wellbeing Index</div>
            <div className="mt-4 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-2000 ease-out"
                style={{ width: `${animatedStats.wellbeing}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white transform hover:scale-105 transition-all duration-300">
            <div className="text-4xl font-bold mb-2">
              {animatedStats.fraud}%
            </div>
            <div className="text-purple-100">Fraud Detection</div>
            <div className="mt-4 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-2000 ease-out"
                style={{ width: `${animatedStats.fraud}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Services</h2>
          <p className="text-gray-600">Comprehensive solutions for sustainable development</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Impact?</h2>
          <p className="text-xl mb-8 text-green-100">Join thousands of organizations using SustainAI for positive change</p>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-300"
          >
            Start Your Journey
          </button>
        </div>
      </section>
    </div>
  );
}
