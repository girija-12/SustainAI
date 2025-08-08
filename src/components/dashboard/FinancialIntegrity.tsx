import { useState } from 'react';
import ChatWidget from '../shared/ChatWidget';

export default function FinancialIntegrity() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const transactions = [
    { id: 1, amount: 1250.00, description: 'Office Supplies Purchase', fraudProb: 0.02, status: 'safe' },
    { id: 2, amount: 5000.00, description: 'Equipment Lease Payment', fraudProb: 0.15, status: 'review' },
    { id: 3, amount: 850.00, description: 'Marketing Campaign', fraudProb: 0.03, status: 'safe' },
    { id: 4, amount: 15000.00, description: 'Unusual Wire Transfer', fraudProb: 0.89, status: 'flagged' },
  ];

  const trendData = [
    { month: 'Jan', fraudRate: 2.1 },
    { month: 'Feb', fraudRate: 1.8 },
    { month: 'Mar', fraudRate: 2.3 },
    { month: 'Apr', fraudRate: 1.5 },
    { month: 'May', fraudRate: 1.9 },
    { month: 'Jun', fraudRate: 1.2 },
  ];

  const chatMessages = [
    { role: 'assistant' as const, content: 'Hello! I\'m IntegrityBot, your financial fraud detection assistant. I can analyze transactions and identify suspicious patterns.' },
    { role: 'user' as const, content: 'Can you analyze my recent transactions for any anomalies?' },
    { role: 'assistant' as const, content: 'I\'ve analyzed your recent transactions. Found 1 high-risk transaction flagged for review: $15,000 wire transfer with 89% fraud probability. I recommend immediate verification of this transaction.' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* AI Agent Card */}
      <div className="lg:col-span-1">
        <ChatWidget
          agentName="IntegrityBot"
          agentDescription="AI-powered fraud detection and financial analysis"
          messages={chatMessages}
          placeholder="Ask about transaction analysis..."
          bgColor="from-purple-500 to-indigo-600"
        />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* File Upload */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Upload Transaction Data</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-600 mb-2">
                {uploadedFile ? uploadedFile.name : 'Drop your transaction files here or click to browse'}
              </p>
              <p className="text-sm text-gray-500">Supports CSV, Excel, and JSON formats</p>
            </label>
          </div>
        </div>

        {/* Fraud Detection Results */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Transaction Analysis</h3>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <h4 className="font-medium">{transaction.description}</h4>
                  <p className="text-sm text-gray-600">${transaction.amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{(transaction.fraudProb * 100).toFixed(1)}% Risk</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    transaction.status === 'safe' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status === 'safe' ? '✓ Safe' :
                     transaction.status === 'review' ? '⚠ Review' :
                     '🚨 Flagged'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Graph */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Fraud Rate Trends</h3>
          <div className="h-64 flex items-end justify-between gap-4">
            {trendData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-lg transition-all duration-1000"
                  style={{ height: `${data.fraudRate * 40}px` }}
                ></div>
                <p className="text-sm text-gray-600 mt-2">{data.month}</p>
                <p className="text-xs text-purple-600 font-medium">{data.fraudRate}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
