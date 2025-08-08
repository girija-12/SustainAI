import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  agentName: string;
  agentDescription: string;
  messages: Message[];
  placeholder: string;
  bgColor: string;
}

export default function ChatWidget({ 
  agentName, 
  agentDescription, 
  messages, 
  placeholder, 
  bgColor 
}: ChatWidgetProps) {
  const [inputValue, setInputValue] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>(messages);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = { role: 'user', content: inputValue };
      setChatMessages([...chatMessages, newMessage]);
      setInputValue('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse: Message = { 
          role: 'assistant', 
          content: 'Thank you for your message. I\'m processing your request and will provide insights based on the available data.' 
        };
        setChatMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Agent Header */}
      <div className={`bg-gradient-to-r ${bgColor} p-6 text-white`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{agentName}</h3>
            <p className="text-sm opacity-90">{agentDescription}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm opacity-75">Online</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {chatMessages.map((message, index) => (
            <div key={index} className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg max-w-xs ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
