import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// Type definitions
interface WellbeingDataPoint {
  date: string;
  mood: number;
  stress: number;
  energy: number;
  sleep: number;
}

interface MenstrualCycleData {
  cycleDay: number;
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  nextPeriod: string;
  cycleLength: number;
}

export default function WellbeingMeasurement() {
  // State for current check-in
  const [currentMood, setCurrentMood] = useState(7);
  const [currentStress, setCurrentStress] = useState(4);
  const [currentEnergy, setCurrentEnergy] = useState(6);
  const [currentSleep, setCurrentSleep] = useState(8);
  const [checkinNotes, setCheckinNotes] = useState('');

  // State for menstrual tracking
  const [cycleStart, setCycleStart] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [menstrualFlow, setMenstrualFlow] = useState('');
  const [menstrualPain, setMenstrualPain] = useState(1);
  const [cycleLength, setCycleLength] = useState(28);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // State for eco habits
  const [ecoHabits, setEcoHabits] = useState({
    reusableProducts: false,
    plantBasedMeals: false,
    timeInNature: false,
  });

  // State for voice check-in
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState('');

  // Backend queries and mutations
  const userSettings = useQuery(api.sustainai.getUserSettings);
  const wellbeingTrends = useQuery(api.sustainai.getWellbeingTrends, { days: 7 });
  const menstrualLogs = useQuery(api.sustainai.getMenstrualLogs, { limit: 10 });
  const ecoHabitsData = useQuery(api.sustainai.getEcoHabits, { days: 30 });
  const recommendations = useQuery(api.sustainai.getRecommendations, { activeOnly: true });
  // const menstrualInsights = useQuery(api.sustainai.getMenstrualInsights, { days: 90 });

  const addWellbeingCheckin = useMutation(api.sustainai.addWellbeingCheckin);
  const saveEcoHabits = useMutation(api.sustainai.saveEcoHabits);
  const addMenstrualLog = useMutation(api.sustainai.addMenstrualLog);
  const updateUserSettings = useMutation(api.sustainai.updateUserSettings);
  const saveVoiceCheckin = useMutation(api.sustainai.saveVoiceCheckin);
  const generateNutritionRecommendations = useMutation(api.sustainai.generateNutritionRecommendations);
  const nutritionPlan = useQuery(api.sustainai.getNutritionPlan, {});

  const selectedLanguage = userSettings?.language || 'en';

  // Use real data from backend or fallback to sample data
  const wellbeingData: WellbeingDataPoint[] = (wellbeingTrends && 'trends' in wellbeingTrends && Array.isArray(wellbeingTrends.trends)) 
    ? wellbeingTrends.trends.slice(0, 7).reverse().map((item: any) => ({
        date: new Date(item.timestamp).toISOString().split('T')[0],
        mood: item.mood,
        stress: item.stress,
        energy: item.energy,
        sleep: item.sleep
      }))
    : [
        { date: '2024-01-01', mood: 7, stress: 3, energy: 8, sleep: 7 },
        { date: '2024-01-02', mood: 8, stress: 2, energy: 9, sleep: 8 },
        { date: '2024-01-03', mood: 6, stress: 5, energy: 6, sleep: 6 },
        { date: '2024-01-04', mood: 9, stress: 2, energy: 8, sleep: 9 },
        { date: '2024-01-05', mood: 7, stress: 4, energy: 7, sleep: 7 },
        { date: '2024-01-06', mood: 8, stress: 3, energy: 8, sleep: 8 },
        { date: '2024-01-07', mood: 7, stress: 4, energy: 6, sleep: 8 },
      ];

  // Calculate menstrual cycle information
  const calculateCycleInfo = (): MenstrualCycleData | null => {
    if (!cycleStart) return null;
    
    const startDate = new Date(cycleStart);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = (daysDiff % cycleLength) + 1;
    
    let phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
    if (cycleDay <= 5) phase = 'menstrual';
    else if (cycleDay <= 13) phase = 'follicular';
    else if (cycleDay <= 15) phase = 'ovulation';
    else phase = 'luteal';
    
    const nextPeriodDate = new Date(startDate);
    nextPeriodDate.setDate(startDate.getDate() + cycleLength);
    
    return {
      cycleDay,
      phase,
      nextPeriod: nextPeriodDate.toISOString().split('T')[0],
      cycleLength
    };
  };

  const cycleInfo = calculateCycleInfo();

  const overallScore = Math.round((currentMood + (10 - currentStress) + currentEnergy + currentSleep) / 4 * 10);

  // Loading states
  const isLoading = userSettings === undefined || wellbeingTrends === undefined;

  // Handler functions
  const handleWellbeingSubmit = async () => {
    try {
      await addWellbeingCheckin({
        mood: currentMood,
        stress: currentStress,
        energy: currentEnergy,
        sleep: currentSleep,
        notes: checkinNotes || undefined,
      });

      // Generate nutrition recommendations based on wellness data
      await generateNutritionRecommendations({
        mood: currentMood,
        stress: currentStress,
        energy: currentEnergy,
        sleep: currentSleep,
      });

      setCheckinNotes('');
      alert('Wellbeing check-in saved successfully! Nutrition recommendations updated.');
    } catch (error) {
      console.error('Error saving check-in:', error);
      alert('Failed to save check-in. Please try again.');
    }
  };

  const handleEcoHabitsSubmit = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await saveEcoHabits({
        date: today,
        ...ecoHabits,
      });
      alert('Eco habits saved successfully!');
    } catch (error) {
      console.error('Error saving eco habits:', error);
      alert('Failed to save eco habits. Please try again.');
    }
  };

  const handleMenstrualSubmit = async () => {
    if (!cycleStart.trim()) {
      alert('Please select a cycle start date');
      return;
    }
    
    try {
      await addMenstrualLog({
        cycleStartDate: cycleStart,
        symptoms: selectedSymptoms.join(', ') + (symptoms ? ', ' + symptoms : ''),
        flow: menstrualFlow || undefined,
        mood: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
        pain: menstrualPain,
      });
      
      // Reset form
      setCycleStart('');
      setSymptoms('');
      setMenstrualFlow('');
      setMenstrualPain(1);
      setSelectedSymptoms([]);
      
      alert('Menstrual log saved successfully!');
    } catch (error) {
      console.error('Error saving menstrual log:', error);
      alert('Failed to save menstrual log. Please try again.');
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleLanguageChange = async (language: string) => {
    try {
      await updateUserSettings({ language });
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  const handleVoiceCheckin = async () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = selectedLanguage === 'en' ? 'en-US' : 
                          selectedLanguage === 'hi' ? 'hi-IN' :
                          selectedLanguage === 'ta' ? 'ta-IN' :
                          selectedLanguage === 'te' ? 'te-IN' : 'en-US';
        
        recognition.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoiceTranscription(transcript);
          
          try {
            await saveVoiceCheckin({ transcription: transcript });
            alert('Voice check-in saved successfully!');
          } catch (error) {
            console.error('Error saving voice check-in:', error);
            alert('Failed to save voice check-in. Please try again.');
          }
          
          setIsRecording(false);
        };
        
        recognition.onerror = () => {
          setIsRecording(false);
          alert('Voice recognition failed. Please try again.');
        };
        
        recognition.start();
      } else {
        alert('Voice recognition is not supported in your browser.');
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <span className="ml-3 text-gray-600">Loading your wellness dashboard...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Women's Wellness Dashboard</h1>
          <p className="text-pink-100">Track your menstrual health, wellness, and get personalized insights</p>
        </div>

        {/* Menstrual Cycle Overview */}
        {cycleInfo && (
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-pink-800 mb-4">🌸 Your Cycle Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-pink-600">{cycleInfo.cycleDay}</div>
                <div className="text-sm text-gray-600">Day of Cycle</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-lg font-semibold text-purple-600 capitalize">{cycleInfo.phase}</div>
                <div className="text-sm text-gray-600">Current Phase</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-sm font-medium text-gray-800">{cycleInfo.nextPeriod}</div>
                <div className="text-sm text-gray-600">Next Period</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-indigo-600">{cycleInfo.cycleLength}</div>
                <div className="text-sm text-gray-600">Cycle Length</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menstrual Health Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Active Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">🎯 Your Wellness Recommendations</h4>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((rec: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                      <h5 className="font-medium text-gray-800 text-sm">{rec.title}</h5>
                      <p className="text-gray-600 text-xs mt-1">{rec.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.priority >= 4 ? 'bg-red-100 text-red-700' :
                          rec.priority >= 3 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          Priority: {rec.priority}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                
                <div className="space-y-3">
                  <textarea
                    value={checkinNotes}
                    onChange={(e) => setCheckinNotes(e.target.value)}
                    placeholder="Any additional notes about how you're feeling..."
                    className="w-full border rounded-lg p-3 text-sm"
                    rows={2}
                  />
                  <button 
                    onClick={handleWellbeingSubmit}
                    className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  >
                    Save Check-in
                  </button>
                </div>
              </div>
            </div>

            {/* 🌿 Sustainability Tracker */}
            <div className="bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-emerald-800 mb-4">Eco-Wellness Habits</h3>
              <p className="text-sm text-emerald-700 mb-6">
                Small steps make a big impact. Track your mindful and sustainable choices today.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Reusable Products */}
                <div className="bg-white rounded-xl p-4 shadow-md flex flex-col items-center">
                  <div className="w-12 h-12 mb-2 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">♻️</span>
                  </div>
                  <label className="text-sm font-medium text-gray-700 mb-2 text-center">
                    Used Reusable Products
                  </label>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-green-500"
                    checked={ecoHabits.reusableProducts}
                    onChange={(e) => setEcoHabits(prev => ({ ...prev, reusableProducts: e.target.checked }))}
                  />
                </div>

                {/* Plant-Based Meals */}
                <div className="bg-white rounded-xl p-4 shadow-md flex flex-col items-center">
                  <div className="w-12 h-12 mb-2 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🌱</span>
                  </div>
                  <label className="text-sm font-medium text-gray-700 mb-2 text-center">
                    Ate Plant-Based Meals
                  </label>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-green-500"
                    checked={ecoHabits.plantBasedMeals}
                    onChange={(e) => setEcoHabits(prev => ({ ...prev, plantBasedMeals: e.target.checked }))}
                  />
                </div>

                {/* Time in Nature */}
                <div className="bg-white rounded-xl p-4 shadow-md flex flex-col items-center">
                  <div className="w-12 h-12 mb-2 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🌳</span>
                  </div>
                  <label className="text-sm font-medium text-gray-700 mb-2 text-center">
                    Spent Time in Nature
                  </label>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-green-500"
                    checked={ecoHabits.timeInNature}
                    onChange={(e) => setEcoHabits(prev => ({ ...prev, timeInNature: e.target.checked }))}
                  />
                </div>
              </div>

              <button 
                onClick={handleEcoHabitsSubmit}
                className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
              >
                🌱 Save My Eco Habits
              </button>

              <p className="mt-4 text-center text-emerald-700 text-sm italic">
                "Every mindful choice is a seed for a better tomorrow."
              </p>
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

            {/* Enhanced Menstrual Health Section */}
            <div className="space-y-6">
              {/* Comprehensive Menstrual Health Tracker */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 shadow-lg">
                <h3 className="text-2xl font-semibold mb-6 text-pink-800">🌸 Comprehensive Menstrual Health Tracker</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Cycle Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Cycle Information</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Period Start Date</label>
                      <input
                        type="date"
                        value={cycleStart}
                        onChange={(e) => setCycleStart(e.target.value)}
                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Average Cycle Length: {cycleLength} days
                      </label>
                      <input
                        type="range"
                        min="21"
                        max="35"
                        value={cycleLength}
                        onChange={(e) => setCycleLength(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>21 days</span>
                        <span>35 days</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Flow Intensity</label>
                      <select
                        value={menstrualFlow}
                        onChange={(e) => setMenstrualFlow(e.target.value)}
                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="">Select flow intensity</option>
                        <option value="spotting">Spotting</option>
                        <option value="light">Light</option>
                        <option value="medium">Medium</option>
                        <option value="heavy">Heavy</option>
                        <option value="very-heavy">Very Heavy</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pain Level (1-10): {menstrualPain}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={menstrualPain}
                        onChange={(e) => setMenstrualPain(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>No pain</span>
                        <span>Severe</span>
                      </div>
                    </div>
                  </div>

                  {/* Symptoms and Mood */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Symptoms & Mood</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Common Symptoms (select all that apply)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Cramps', 'Headache', 'Bloating', 'Breast tenderness', 'Mood swings', 'Fatigue', 'Nausea', 'Back pain', 'Acne', 'Food cravings', 'Insomnia', 'Anxiety'].map((symptom) => (
                          <label key={symptom} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedSymptoms.includes(symptom)}
                              onChange={() => toggleSymptom(symptom)}
                              className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                            />
                            <span>{symptom}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    

                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                      <textarea
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Any other symptoms, observations, or notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>



                {/* Save Button */}
                <div className="mt-6">
                  <button
                    onClick={handleMenstrualSubmit}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl hover:from-pink-600 hover:to-rose-600 transition-colors font-semibold"
                  >
                    💾 Save Menstrual Health Entry
                  </button>
                </div>
                
                {/* Recent Entries */}
                {menstrualLogs && menstrualLogs.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-pink-200">
                    <h4 className="text-lg font-semibold mb-4 text-pink-800">📊 Recent Entries</h4>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {menstrualLogs.slice(0, 5).map((log: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-pink-100">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-gray-800">{log.cycleStartDate}</div>
                            <div className="text-xs text-pink-600 bg-pink-100 px-2 py-1 rounded-full">
                              Day {log.cycleDay || 'N/A'}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {log.flow && <div>Flow: <span className="font-medium">{log.flow}</span></div>}
                            {log.pain && <div>Pain: <span className="font-medium">{log.pain}/10</span></div>}
                            {log.mood && log.mood.length > 0 && <div>Mood: <span className="font-medium">{log.mood.join(', ')}</span></div>}
                          </div>
                          {log.symptoms && (
                            <div className="text-gray-700 text-xs mt-2 bg-gray-50 rounded p-2">{log.symptoms}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Women's Health Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voice Check-In */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">🎙️ Voice Check-In</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {isRecording ? 'Listening... Speak now!' : 'Tap to speak your mood or health concerns.'}
                  </p>
                  
                  {voiceTranscription && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">Last transcription:</p>
                      <p className="text-sm font-medium">{voiceTranscription}</p>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleVoiceCheckin}
                    className={`w-full py-3 rounded-xl font-medium transition-colors ${
                      isRecording 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-indigo-500 text-white hover:bg-indigo-600'
                    }`}
                  >
                    {isRecording ? '🔴 Stop Recording' : '🎤 Start Voice Check-In'}
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Voice recognition works in: English, Hindi, Tamil, Telugu
                  </p>
                </div>

                {/* Language Toggle */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">🌐 Language Settings</h3>
                  <p className="text-sm text-gray-600 mb-3">Choose your preferred language for the interface</p>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full border rounded-lg p-3 text-sm"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
                    <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
                    <option value="te">🇮🇳 తెలుగు (Telugu)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Language changes will apply to voice recognition and AI responses
                  </p>
                </div>

                {/* Women's Safety Resources */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">🚨 Women's Safety & Support</h3>
                  <p className="text-sm text-gray-600 mb-4">Access helplines, legal aid, and emergency contacts.</p>
                  <button className="w-full bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition-colors">
                    View Resources
                  </button>
                </div>

                {/* Fertility Tracking */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">🤱 Fertility Insights</h3>
                  <p className="text-sm text-gray-600 mb-4">Track ovulation and fertility windows based on your cycle data.</p>
                  {cycleInfo && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Current Phase:</span> {cycleInfo.phase}
                      </div>
                      {cycleInfo.phase === 'ovulation' && (
                        <div className="bg-green-100 text-green-800 p-2 rounded text-sm">
                          🌟 You're in your fertile window!
                        </div>
                      )}
                      {cycleInfo.phase === 'follicular' && cycleInfo.cycleDay > 10 && (
                        <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-sm">
                          ⚡ Approaching fertile window
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Personalized Nutrition Recommendations */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-orange-800">🥗 Personalized Nutrition Recommendations</h3>
              <p className="text-sm text-orange-700 mb-4">
                Based on your wellness data, here are tailored nutrition suggestions to support your health goals.
              </p>
              
              {/* Nutrition Analysis Based on Wellness Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Energy & Mood Support */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">⚡</span>
                    </div>
                    <h4 className="font-semibold text-gray-800">Energy & Mood Support</h4>
                  </div>
                  {currentEnergy < 6 || currentMood < 6 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 mb-2">Your energy/mood could use a boost:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Complex carbs: Oats, quinoa, sweet potatoes</li>
                        <li>• B-vitamins: Leafy greens, eggs, nuts</li>
                        <li>• Omega-3s: Salmon, walnuts, chia seeds</li>
                        <li>• Dark chocolate (70%+ cacao) for mood</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-green-700 mb-2">Great energy levels! Maintain with:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Balanced meals every 3-4 hours</li>
                        <li>• Protein with each meal</li>
                        <li>• Stay hydrated (8-10 glasses water)</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Stress Management */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">🧘</span>
                    </div>
                    <h4 className="font-semibold text-gray-800">Stress Management</h4>
                  </div>
                  {currentStress > 6 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 mb-2">High stress detected. Try these calming foods:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Magnesium-rich: Spinach, almonds, avocado</li>
                        <li>• Herbal teas: Chamomile, lavender, green tea</li>
                        <li>• Probiotics: Yogurt, kefir, fermented foods</li>
                        <li>• Limit caffeine after 2 PM</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-green-700 mb-2">Stress levels look good! Maintain with:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Regular meal timing</li>
                        <li>• Antioxidant-rich berries</li>
                        <li>• Mindful eating practices</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Sleep Quality Support */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">😴</span>
                    </div>
                    <h4 className="font-semibold text-gray-800">Sleep Quality</h4>
                  </div>
                  {currentSleep < 6 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 mb-2">Poor sleep detected. Foods that help:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Tryptophan: Turkey, milk, bananas</li>
                        <li>• Magnesium: Pumpkin seeds, dark chocolate</li>
                        <li>• Melatonin-rich: Tart cherries, tomatoes</li>
                        <li>• Avoid large meals 3 hours before bed</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-green-700 mb-2">Good sleep quality! Support with:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Light dinner 2-3 hours before bed</li>
                        <li>• Herbal tea before bedtime</li>
                        <li>• Consistent meal timing</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Menstrual Health Support */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">🌸</span>
                    </div>
                    <h4 className="font-semibold text-gray-800">Menstrual Health</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 mb-2">Support your cycle with:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Iron-rich: Spinach, lentils, lean meat</li>
                      <li>• Anti-inflammatory: Turmeric, ginger</li>
                      <li>• Calcium: Dairy, leafy greens, sesame</li>
                      <li>• Reduce salt during PMS</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Daily Meal Suggestions */}
              <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-lg mr-2">🍽️</span>
                  Today's Meal Suggestions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <h5 className="font-medium text-orange-700 mb-2">Breakfast</h5>
                    <p className="text-xs text-gray-600">
                      {nutritionPlan?.breakfast || 
                        (currentEnergy < 6 ? 
                          "Oatmeal with berries, nuts, and honey" : 
                          "Greek yogurt with granola and fruit")
                      }
                    </p>
                  </div>
                  <div className="text-center">
                    <h5 className="font-medium text-orange-700 mb-2">Lunch</h5>
                    <p className="text-xs text-gray-600">
                      {nutritionPlan?.lunch || 
                        (currentStress > 6 ? 
                          "Quinoa salad with leafy greens and avocado" : 
                          "Grilled chicken with sweet potato and vegetables")
                      }
                    </p>
                  </div>
                  <div className="text-center">
                    <h5 className="font-medium text-orange-700 mb-2">Dinner</h5>
                    <p className="text-xs text-gray-600">
                      {nutritionPlan?.dinner || 
                        (currentSleep < 6 ? 
                          "Salmon with steamed broccoli and brown rice" : 
                          "Lentil soup with whole grain bread")
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Hydration Tracker */}
              <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-lg mr-2">💧</span>
                  Hydration Goals
                </h4>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Daily target: {nutritionPlan?.hydration || 
                      (currentStress > 6 || currentEnergy < 6 ? '10-12 glasses' : '8-10 glasses')
                    }
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Add lemon or cucumber for variety
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button className="bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition-colors font-medium">
                  📱 Get Meal Plan App
                </button>
                <button className="bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors font-medium">
                  🛒 Generate Shopping List
                </button>
              </div>

              <p className="text-xs text-orange-600 mt-4 text-center italic">
                "Nutrition recommendations update based on your daily wellness check-ins"
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}