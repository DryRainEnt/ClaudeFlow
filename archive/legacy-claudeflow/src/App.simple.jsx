import React from 'react';

function App() {
  return (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">ClaudeFlow Test</h1>
        <p className="text-gray-600">If you can see this, React is working!</p>
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p className="text-blue-800">Basic UI test successful</p>
        </div>
      </div>
    </div>
  );
}

export default App;