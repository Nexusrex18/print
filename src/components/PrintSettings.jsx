import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FilePreview from "./FilePreview";

const PrintSettings = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [printSettings, setPrintSettings] = useState({
    color: "Color",
    pages: "All",
    copies: 1,
    paperSize: "A4",
    orientation: "Portrait",
    twoSided: "Off",
  });
  const [showMoreSettings, setShowMoreSettings] = useState(false);

  useEffect(() => {
    // Get uploaded files from local storage
    const storedFiles = localStorage.getItem("uploadedFiles");
    if (storedFiles) {
      const parsedFiles = JSON.parse(storedFiles);

      // Process each file to recreate Object URLs or load from sessionStorage
      const processedFiles = parsedFiles.map((file) => {
        // If it's an image or already has a preview, we can use it directly
        if (file.preview) {
          return file;
        }

        // For PDFs and other files stored with fileId, retrieve from sessionStorage
        if (file.fileId) {
          const fileData = sessionStorage.getItem(file.fileId);
          if (fileData) {
            return {
              ...file,
              preview: fileData, // This is a data URL from sessionStorage
            };
          }
        }

        // Fallback if we couldn't retrieve the file
        return file;
      });

      setFiles(processedFiles);
    } else {
      // If no files, go back to homepage
      navigate("/");
    }
  }, [navigate]);

  const handleAddMoreFiles = () => {
    // This would open a file picker in a real app
    document.getElementById("additionalFiles").click();
  };

  const handleAdditionalFiles = async (e) => {
    const fileList = Array.from(e.target.files);
    const newFilesPromises = fileList.map((file) => {
      return new Promise((resolve) => {
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
        };

        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            fileData.preview = e.target.result;
            resolve(fileData);
          };
          reader.readAsDataURL(file);
        } else {
          const fileId = `file_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          fileData.fileId = fileId;

          const reader = new FileReader();
          reader.onload = (e) => {
            sessionStorage.setItem(fileId, e.target.result);
            fileData.preview = e.target.result;
            resolve(fileData);
          };
          reader.readAsDataURL(file);
        }
      });
    });

    const newFiles = await Promise.all(newFilesPromises);
    const updatedFiles = [...files, ...newFiles];

    setFiles(updatedFiles);
    localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);

    if (updatedFiles.length === 0) {
      localStorage.removeItem("uploadedFiles");
      navigate("/");
    } else {
      setFiles(updatedFiles);
      localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
      if (currentFileIndex >= updatedFiles.length) {
        setCurrentFileIndex(updatedFiles.length - 1);
      }
    }
  };

  const handleNavigateFile = (direction) => {
    if (direction === "next" && currentFileIndex < files.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    } else if (direction === "prev" && currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };

  const handleSettingChange = (setting, value) => {
    setPrintSettings({
      ...printSettings,
      [setting]: value,
    });
  };

  const handleIncrementCopies = () => {
    setPrintSettings({
      ...printSettings,
      copies: printSettings.copies + 1,
    });
  };

  const handleDecrementCopies = () => {
    if (printSettings.copies > 1) {
      setPrintSettings({
        ...printSettings,
        copies: printSettings.copies - 1,
      });
    }
  };

  const handleSaveChanges = () => {
    // Save the current file's settings
    const updatedFiles = [...files];
    updatedFiles[currentFileIndex] = {
      ...updatedFiles[currentFileIndex],
      settings: { ...printSettings },
    };
    setFiles(updatedFiles);
    localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
    alert("Changes saved!");
  };

  const handleApplyToAll = () => {
    // Apply current settings to all files
    const updatedFiles = files.map((file) => ({
      ...file,
      settings: { ...printSettings },
    }));
    setFiles(updatedFiles);
    localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
    alert("Settings applied to all files!");
  };

  const handleProceedToSelectShop = () => {
    // Save all settings before proceeding
    const updatedFiles = [...files];
    updatedFiles[currentFileIndex] = {
      ...updatedFiles[currentFileIndex],
      settings: { ...printSettings },
    };
    setFiles(updatedFiles);
    localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));

    // Navigate to select shop page
    navigate("/select-shop");
  };

  // Add this function right after all your other handler functions in PrintSettings.js
  const getFileObject = (fileData) => {
    if (!fileData || !fileData.preview) return null;
    // console.log("file data: ",fileData)
    // Convert data URL to Blob
    try {
      const [prefix, dataString] = fileData.preview.split(",");
      const mimeType = prefix.match(/:(.*?);/)[1];
      const byteCharacters = atob(dataString);
      const byteArrays = [];

      for (let i = 0; i < byteCharacters.length; i += 512) {
        const slice = byteCharacters.slice(i, i + 512);
        const byteNumbers = new Array(slice.length);

        for (let j = 0; j < slice.length; j++) {
          byteNumbers[j] = slice.charCodeAt(j);
        }

        byteArrays.push(new Uint8Array(byteNumbers));
      }

      // Create a Blob from the byte arrays
      const blob = new Blob(byteArrays, { type: mimeType });

      // console.log("after processing", blob ,"abfaij", fileData)

      // Create a File object from the Blob
      return new File([blob], fileData.name, {
        type: fileData.type || mimeType,
        lastModified: fileData.lastModified || Date.now(),
      });
    } catch (error) {
      console.error("Error creating file object:", error);
      return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="black" />
              <path d="M2 17L12 22L22 17" stroke="black" strokeWidth="2" />
              <path d="M2 12L12 17L22 12" stroke="black" strokeWidth="2" />
            </svg>
            <span className="ml-2 text-xl font-semibold">
              myprintcorner.com
            </span>
          </div>
          <button className="text-blue-600 hover:text-blue-800">Sign In</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mb-2">
                ✓
              </div>
              <span className="text-sm">Upload File</span>
            </div>
            <div className="flex-grow border-t-2 border-blue-300 mx-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mb-2">
                2
              </div>
              <span className="text-sm">Print Settings</span>
            </div>
            <div className="flex-grow border-t-2 border-gray-300 mx-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mb-2">
                3
              </div>
              <span className="text-sm">Select Location</span>
            </div>
            <div className="flex-grow border-t-2 border-gray-300 mx-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 mb-2">
                4
              </div>
              <span className="text-sm">Order Summary</span>
            </div>
          </div>
        </div>

        {/* Print Settings Content */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - File Preview */}
            <div className="lg:w-2/3">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-center relative min-h-96">
                  {files.length > 0 && (
                    <div className="relative border border-blue-200 rounded-lg p-2 w-full h-full flex items-center justify-center">
                      <FilePreview
                        file={getFileObject(files[currentFileIndex])}
                        printSettings={printSettings}
                      />
                      <button
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                        onClick={() => handleRemoveFile(currentFileIndex)}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {files.length > 1 && (
                    <>
                      <button
                        className="absolute left-4 w-8 h-8 rounded-full bg-blue-200 text-blue-600 flex items-center justify-center"
                        onClick={() => handleNavigateFile("prev")}
                        disabled={currentFileIndex === 0}
                      >
                        &lt;
                      </button>
                      <button
                        className="absolute right-4 w-8 h-8 rounded-full bg-blue-200 text-blue-600 flex items-center justify-center"
                        onClick={() => handleNavigateFile("next")}
                        disabled={currentFileIndex === files.length - 1}
                      >
                        &gt;
                      </button>
                    </>
                  )}
                </div>

                {/* Add More Files Button */}
                <div className="mt-4 flex items-center justify-center">
                  <div
                    className="border border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={handleAddMoreFiles}
                  >
                    <div className="w-8 h-8 rounded-full border border-blue-500 flex items-center justify-center text-blue-500 mb-2">
                      +
                    </div>
                    <p className="text-blue-500">Add More Files</p>
                  </div>
                  <input
                    type="file"
                    id="additionalFiles"
                    className="hidden"
                    multiple
                    onChange={handleAdditionalFiles}
                  />
                </div>

                {/* File Name and Type */}
                {files.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm truncate">
                      File: <strong>{files[currentFileIndex].name}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      Type: {files[currentFileIndex].type || "Unknown"}
                    </p>
                  </div>
                )}
              </div>

              {/* Proceed Button */}
              <div className="mt-6 flex justify-center">
                <button
                  className="px-6 py-3 bg-black text-white rounded-full flex items-center"
                  onClick={handleProceedToSelectShop}
                >
                  Proceed to Select Shop
                  <svg
                    className="w-4 h-4 ml-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M9 5l7 7-7 7"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Column - Print Options */}
            <div className="lg:w-1/3">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Print Options</h2>

                {/* Preview of current file */}
                {files.length > 0 && (
                  <div className="border rounded-lg p-2 mb-6 h-40 flex items-center justify-center overflow-hidden">
                    <FilePreview
                      file={getFileObject(files[currentFileIndex])}
                      printSettings={printSettings}
                      previewSize="small"
                    />
                  </div>
                )}

                {/* Pages Option */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-medium">Pages</label>
                    <select
                      className="border rounded-md p-2"
                      value={printSettings.pages}
                      onChange={(e) =>
                        handleSettingChange("pages", e.target.value)
                      }
                    >
                      <option>All</option>
                      <option>Custom</option>
                    </select>
                  </div>
                </div>

                {/* Color Option */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-medium">Colour</label>
                    <select
                      className="border rounded-md p-2"
                      value={printSettings.color}
                      onChange={(e) =>
                        handleSettingChange("color", e.target.value)
                      }
                    >
                      <option>Color</option>
                      <option>Black & White</option>
                    </select>
                  </div>
                </div>

                {/* Copies Option */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-medium">Number of Copies</label>
                    <div className="flex items-center">
                      <button
                        className="w-8 h-8 bg-gray-200 text-gray-700 rounded-l-md flex items-center justify-center"
                        onClick={handleDecrementCopies}
                        disabled={printSettings.copies <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="w-16 border-y border-gray-300 p-2 text-center"
                        value={printSettings.copies}
                        onChange={(e) =>
                          handleSettingChange(
                            "copies",
                            parseInt(e.target.value) || 1
                          )
                        }
                        min="1"
                      />
                      <button
                        className="w-8 h-8 bg-blue-500 text-white rounded-r-md flex items-center justify-center"
                        onClick={handleIncrementCopies}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Show More Settings Link */}
                <div className="mt-6 mb-2">
                  <button
                    className="text-blue-500 hover:text-blue-700 flex items-center"
                    onClick={() => setShowMoreSettings(!showMoreSettings)}
                  >
                    {showMoreSettings
                      ? "Hide Additional Settings"
                      : "Show More Settings"}
                    <svg
                      className={`w-4 h-4 ml-1 transform ${
                        showMoreSettings ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M19 9l-7 7-7-7"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Additional Settings */}
                {showMoreSettings && (
                  <div className="border-t pt-4 mt-2">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="font-medium">Paper Size</label>
                        <select
                          className="border rounded-md p-2"
                          value={printSettings.paperSize}
                          onChange={(e) =>
                            handleSettingChange("paperSize", e.target.value)
                          }
                        >
                          <option>A4</option>
                          <option>Letter</option>
                          <option>A3</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="font-medium">Orientation</label>
                        <select
                          className="border rounded-md p-2"
                          value={printSettings.orientation}
                          onChange={(e) =>
                            handleSettingChange("orientation", e.target.value)
                          }
                        >
                          <option>Portrait</option>
                          <option>Landscape</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="font-medium">Two-sided</label>
                        <select
                          className="border rounded-md p-2"
                          value={printSettings.twoSided}
                          onChange={(e) =>
                            handleSettingChange("twoSided", e.target.value)
                          }
                        >
                          <option>Off</option>
                          <option>Long edge</option>
                          <option>Short edge</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8">
                  <button
                    className="flex-1 py-3 bg-gray-900 text-white rounded-md hover:bg-black transition-colors"
                    onClick={handleApplyToAll}
                  >
                    Apply to All
                  </button>
                  <button
                    className="flex-1 py-3 bg-gray-900 text-white rounded-md hover:bg-black transition-colors"
                    onClick={handleSaveChanges}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrintSettings;
