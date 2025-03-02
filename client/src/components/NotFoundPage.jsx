import React from 'react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 px-4">
        <div className="container mx-auto">
          <a href="/" className="flex items-center">
            <div className="w-8 h-8 mr-2">
              <svg viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 6C8 4.89543 8.89543 4 10 4H22C23.1046 4 24 4.89543 24 6V26L16 20L8 26V6Z" stroke="white" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <span className="text-xl font-semibold">myprintcorner.com</span>
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-8">
          <svg className="w-32 h-32 mx-auto text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 20V4H20V20H4ZM6 18H18V6H6V18ZM9 16H15V14H9V16ZM9 11H15V9H9V11Z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-blue-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-blue-700 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          The page you are looking for is temporarily unavailable.
        </p>
        <a 
          href="/" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </a>
      </main>

    </div>
  );
};

export default NotFoundPage;