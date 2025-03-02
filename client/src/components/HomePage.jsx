import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };
  
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };
  
  const handleFileUpload = async (files) => {
    setIsProcessing(true);
    
    try {
      // Create an array to store file data and file readers
      const fileDataPromises = Array.from(files).map(file => {
        return new Promise((resolve) => {
          // For PDFs, we'll just store basic info without preview
          // The actual preview will be created on the PrintSettings page
          const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
          };
          
          // If it's an image or other file where preview makes sense
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              // Store the base64 data URL which persists in localStorage
              fileData.preview = e.target.result;
              resolve(fileData);
            };
            reader.readAsDataURL(file);
          } else {
            // For non-images (like PDFs), store the file object in sessionStorage
            // We'll use an identifier to reference it
            const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            fileData.fileId = fileId;
            
            // Create a blob or temporary storage to hold the file content
            // We'll use this to recreate the file on the PrintSettings page
            const reader = new FileReader();
            reader.onload = (e) => {
              // Store the binary data to sessionStorage as Base64
              // Note: This may not work for very large files due to sessionStorage limits
              sessionStorage.setItem(fileId, e.target.result);
              resolve(fileData);
            };
            reader.readAsDataURL(file);
          }
        });
      });
      
      // Wait for all file processing to complete
      const fileData = await Promise.all(fileDataPromises);
      
      // Store the file metadata in localStorage
      localStorage.setItem('uploadedFiles', JSON.stringify(fileData));
      
      // Navigate to the print settings page
      navigate('/print-settings');
    } catch (error) {
      console.error('Error processing files:', error);
      alert('There was an error processing your files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="black" />
              <path d="M2 17L12 22L22 17" stroke="black" strokeWidth="2" />
              <path d="M2 12L12 17L22 12" stroke="black" strokeWidth="2" />
            </svg>
            <span className="ml-2 text-xl font-semibold">myprintcorner.com</span>
          </div>
          <button className="text-blue-600 hover:text-blue-800">Sign In</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Headline */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold">
              Print Document,
              <br />
              <span className="text-blue-500">Smartly and Securely.</span>
            </h1>
          </div>

          {/* File Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center bg-gray-100 transition-all ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            } ${isProcessing ? 'opacity-70' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl">Processing files...</p>
              </div>
            ) : (
              <>
                <div className="mb-4 w-12 h-12 rounded-full border-2 border-gray-700 flex items-center justify-center">
                  <span className="text-2xl">+</span>
                </div>
                <p className="text-xl mb-2">Drag & Drop or Choose Files</p>
                <p className="text-sm text-gray-600 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" />
                  </svg>
                  Max File Size: 10 MB
                </p>
                <input 
                  type="file" 
                  id="fileInput" 
                  className="hidden" 
                  multiple 
                  onChange={handleFileChange} 
                />
                <button 
                  onClick={() => document.getElementById('fileInput').click()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Select Files
                </button>
              </>
            )}
          </div>

          {/* How it works section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold mb-8">How it works?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mr-3">1</div>
                  <h3 className="text-xl font-semibold">Upload & Customize</h3>
                </div>
                <p>Upload your files & set preferences like color, size & page count.</p>
              </div>
              
              {/* Step 2 */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mr-3">2</div>
                  <h3 className="text-xl font-semibold">Pick a Shop</h3>
                </div>
                <p>Select a nearby print shop and receive a unique code.</p>
              </div>
              
              {/* Step 3 */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mr-3">3</div>
                  <h3 className="text-xl font-semibold">Print Instantly</h3>
                </div>
                <p>Share the code at the shop to get your documents printed.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;