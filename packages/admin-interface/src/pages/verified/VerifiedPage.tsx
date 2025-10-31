import React, { useState } from 'react';
import TokenList from '../../components/token/TokenList';

const VerifiedPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'polar-verified' | 'strict'>('polar-verified');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('polar-verified')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'polar-verified'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Polar Verified
              </button>
              <button
                onClick={() => setActiveTab('strict')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'strict'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Strict List
              </button>
            </nav>
          </div>
        </div>

        <TokenList view={activeTab} />
      </div>
    </div>
  );
};

export default VerifiedPage;