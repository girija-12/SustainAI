import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import Homepage from "./components/Homepage";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'demo'>('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              SustainAI
            </h2>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setCurrentView('home')}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentView === 'home' 
                  ? 'bg-green-100 text-green-700' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Home
            </button>
            <Authenticated>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentView === 'dashboard' 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                Dashboard
              </button>
            </Authenticated>
            <button 
              onClick={() => setCurrentView('demo')}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentView === 'demo' 
                  ? 'bg-green-100 text-green-700' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Demo
            </button>
          </nav>

          <SignOutButton />
        </div>
      </header>

      <main className="flex-1">
        <Content currentView={currentView} setCurrentView={setCurrentView} />
      </main>
      
      <Toaster />
    </div>
  );
}

function Content({ currentView, setCurrentView }: { 
  currentView: 'home' | 'dashboard' | 'demo', 
  setCurrentView: (view: 'home' | 'dashboard' | 'demo') => void 
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
      </div>
    );
  }

  return (
    <>
      <Unauthenticated>
        <div className="max-w-md mx-auto mt-20 px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to SustainAI</h1>
            <p className="text-gray-600">Sign in to access your personalized sustainability dashboard</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        {currentView === 'home' && <Homepage setCurrentView={setCurrentView} />}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'demo' && <Homepage setCurrentView={setCurrentView} />}
      </Authenticated>
    </>
  );
}
