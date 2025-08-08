import { useState } from 'react';
import ChatWidget from '../shared/ChatWidget';

export default function WellbeingMeasurement() {
  const [currentMood, setCurrentMood] = useState(7);
  const [currentStress, setCurrentStress] = useState(4);
  const [currentEnergy, setCurrentEnergy] = useState(6);
  const [currentSleep, setCurrentSleep] = useState(8);

  const wellbeingData = [
    { date: '2024-01-01', mood: 7, stress: 3, energy: 8, sleep: 7 },
    { date: '2024-01-02', mood: 8, stress: 2, energy: 9, sleep: 8 },
    { date: '2024-01-03', mood: 6, stress: 5, energy: 6, sleep: 6 },
    { date: '2024-01-04', mood: 9, stress: 2, energy: 8, sleep: 9 },
    { date: '2024-01-05', mood: 7, stress: 4, energy: 7, sleep: 7 },
    { date: '2024-01-06', mood: 8, stress: 3, energy: 8, sleep: 8 },
    { date: '2024-01-07', mood: 7, stress: 4, energy: 6, sleep: 8 },
  ];

  const chatMessages = [
    { role: 'assistant' as const, content: 'Hi! I\'m WellbeingPulse, your personal wellness companion. How are you feeling today?' },
    { role: 'user' as const, content: 'I\'ve been feeling stressed lately with work' },
    { role: 'assistant' as const, content: 'I understand. Based on your recent check-ins, I notice your stress levels have increased. I recommend trying the 4-7-8 breathing technique and scheduling short breaks every 2 hours. Would you like me to set up wellness reminders?' }
  ];

  const overallScore = Math.round((currentMood + (10 - currentStress) + currentEnergy + currentSleep) / 4 * 10);

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* AI Agent Card */}
      <div className="lg:col-span-1">
        <ChatWidget
          agentName="WellbeingPulse"
          agentDescription="Your AI wellness coach for mental and physical health"
          messages={chatMessages}
          placeholder="Share how you're feeling..."
          bgColor="from-blue-500 to-cyan-600"
        />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Wellbeing Score Ring */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Overall Wellbeing Score</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                <circle 
                  cx="64" cy="64" r="56" 
                  stroke="#3b82f6" strokeWidth="12" fill="none"
                  strokeDasharray={`${overallScore * 3.51} 351`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">{overallScore}</span>
                <span className="text-sm text-gray-600">/ 100</span>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-600 mt-4">
            {overallScore >= 80 ? 'Excellent wellbeing!' : 
             overallScore >= 60 ? 'Good progress, keep it up!' : 
             'Let\'s work on improving your wellness'}
          </p>
        </div>

        {/* Daily Check-in */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Daily Check-in</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mood (1-10): {currentMood}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={currentMood}
                onChange={(e) => setCurrentMood(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stress Level (1-10): {currentStress}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={currentStress}
                onChange={(e) => setCurrentStress(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-red"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy Level (1-10): {currentEnergy}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={currentEnergy}
                onChange={(e) => setCurrentEnergy(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sleep Quality (1-10): {currentSleep}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={currentSleep}
                onChange={(e) => setCurrentSleep(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
              />
            </div>
            
            <button className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors">
              Save Check-in
            </button>
          </div>
        </div>

        {/* Emotion Trends */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">7-Day Wellness Trends</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {wellbeingData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full space-y-1">
                  <div 
                    className="w-full bg-blue-400 rounded-sm"
                    style={{ height: `${data.mood * 8}px` }}
                    title={`Mood: ${data.mood}`}
                  ></div>
                  <div 
                    className="w-full bg-red-400 rounded-sm"
                    style={{ height: `${data.stress * 8}px` }}
                    title={`Stress: ${data.stress}`}
                  ></div>
                  <div 
                    className="w-full bg-green-400 rounded-sm"
                    style={{ height: `${data.energy * 8}px` }}
                    title={`Energy: ${data.energy}`}
                  ></div>
                  <div 
                    className="w-full bg-purple-400 rounded-sm"
                    style={{ height: `${data.sleep * 8}px` }}
                    title={`Sleep: ${data.sleep}`}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span>Mood</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span>Stress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span>Energy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-400 rounded"></div>
              <span>Sleep</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
