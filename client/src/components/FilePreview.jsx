import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import FileViewer from 'react-file-viewer';
import * as XLSX from 'xlsx';
import axios from 'axios'; // Make sure to install axios

// Set up the PDF worker with HTTPS URL
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FilePreview = ({ file, printSettings, previewSize = 'large' }) => {
  const { color, orientation, paperSize, twoSided } = printSettings;
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [objectUrl, setObjectUrl] = useState(null);
  const [fileExtension, setFileExtension] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState(null);
  const [conversionError, setConversionError] = useState(null);

  // Create and clean up object URL
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      
      // Extract file extension
      const fileName = file.name || '';
      const extension = fileName.split('.').pop().toLowerCase();
      setFileExtension(extension);
      
      // Clear any previous conversion state
      setConvertedPdfUrl(null);
      setConversionError(null);
      
      // If it's a PowerPoint file, convert it to PDF
      if (['ppt', 'pptx'].includes(extension)) {
        convertPowerPointToPdf(file);
      }
      // If it's an Excel file, parse it
      else if (['xlsx', 'xls', 'csv'].includes(extension)) {
        parseExcelFile(file);
      } else {
        setExcelData(null);
      }
      
      return () =>{
        URL.revokeObjectURL(url);
      }
    }
  }, [file]);

  // Convert PowerPoint to PDF
  const convertPowerPointToPdf = async (file) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('https://print-5hm2.onrender.com/api/convert-to-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setConvertedPdfUrl(response.data.pdfPath);
      } else {
        setConversionError('Failed to convert the file');
      }
    } catch (error) {
      console.error('Error converting PowerPoint:', error);
      setConversionError('Error during file conversion');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse Excel file using SheetJS
  const parseExcelFile = async (file) => {
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          setExcelData({
            data: jsonData,
            sheetNames: workbook.SheetNames,
            activeSheet: firstSheetName
          });
          setIsLoading(false);
        } catch (error) {
          console.error('Error parsing Excel:', error);
          setExcelData(null);
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setExcelData(null);
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setExcelData(null);
      setIsLoading(false);
    }
  };

  // Return null if no file is provided
  if (!file) {
    return null;
  }

  // Function to determine if file is an image
  const isImage = () => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    return imageTypes.includes(file.type);
  };

  // Function to determine if file is a PDF
  const isPDF = () => {
    return file.type === 'application/pdf';
  };

  // Function to determine if file is PowerPoint
  const isPowerPoint = () => {
    return ['ppt', 'pptx'].includes(fileExtension);
  };

  // Function to determine if file is Excel
  const isExcel = () => {
    return ['xlsx', 'xls', 'csv'].includes(fileExtension);
  };

  // Function to determine if file is Word
  const isWord = () => {
    return ['docx', 'doc', 'rtf'].includes(fileExtension);
  };

  // Apply color filter based on settings
  const getColorStyle = () => {
    if (color === 'Black & White') {
      return {
        filter: 'grayscale(100%)'
      };
    }
    return {};
  };

  // Apply orientation based on settings
  const getOrientationStyle = () => {
    if (orientation === 'Landscape') {
      return {
        transform: 'rotate(90deg)',
        transformOrigin: 'center',
        margin: previewSize === 'small' ? '10px 0' : '50px 0'
      };
    }
    return {};
  };

  // Apply paper size based on settings
  const getPaperSizeStyle = () => {
    const sizeMap = {
      'A4': { width: '210mm', height: '297mm' },
      'Letter': { width: '215.9mm', height: '279.4mm' },
      'Legal': { width: '215.9mm', height: '355.6mm' }
    };
    
    if (sizeMap[paperSize]) {
      return {
        width: orientation === 'Landscape' ? sizeMap[paperSize].height : sizeMap[paperSize].width,
        height: orientation === 'Landscape' ? sizeMap[paperSize].width : sizeMap[paperSize].height
      };
    }
    
    return {};
  };

  // Create container style with print settings applied
  const getContainerStyle = () => {
    const containerHeight = previewSize === 'small' ? '100%' : '500px';
    
    return {
      textAlign: 'center',
      height: containerHeight,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'auto',
      ...getColorStyle()
    };
  };

  // Get scale based on preview size
  const getScale = () => {
    return previewSize === 'small' ? 0.5 : 1.0;
  };

  // Error handler for FileViewer
  const onError = (e) => {
    console.error('Error in file viewer:', e);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // Render Excel data as a table
  const renderExcelTable = () => {
    if (!excelData || !excelData.data || !excelData.data.length) {
      return <div>No data to display</div>;
    }

    return (
      <div style={{
        overflowX: 'auto',
        width: '100%',
        height: '100%',
        padding: '10px',
        ...getColorStyle()
      }}>
        <table style={{
          borderCollapse: 'collapse',
          width: '100%',
          fontSize: previewSize === 'small' ? '10px' : '14px'
        }}>
          <thead>
            <tr>
              {excelData.data[0] && excelData.data[0].map((header, index) => (
                <th key={index} style={{
                  padding: previewSize === 'small' ? '4px' : '8px',
                  borderBottom: '2px solid #ddd',
                  background: '#f3f3f3',
                  position: 'sticky',
                  top: 0
                }}>
                  {header !== undefined ? String(header) : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {excelData.data.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{
                    padding: previewSize === 'small' ? '3px' : '6px',
                    border: '1px solid #ddd',
                    textAlign: typeof cell === 'number' ? 'right' : 'left'
                  }}>
                    {cell !== undefined ? String(cell) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // PowerPoint preview (converted to PDF)
  if (isPowerPoint()) {
    if (isLoading) {
      return (
        <div className="powerpoint-conversion" style={{
          ...getContainerStyle(),
          flexDirection: 'column',
        }}>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Converting PowerPoint to PDF...</p>
            <div className="loading-indicator" style={{
              width: '50px',
              height: '50px',
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #3498db',
              borderRadius: '50%',
              margin: '20px auto',
              animation: 'spin 2s linear infinite'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      );
    }

    if (conversionError) {
      return (
        <div className="powerpoint-error" style={{
          ...getContainerStyle(),
          flexDirection: 'column',
        }}>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ color: 'red' }}>Error: {conversionError}</p>
            <p>Unable to preview PowerPoint file. Please try again or check if the file is valid.</p>
          </div>
        </div>
      );
    }

    if (convertedPdfUrl) {
      return (
        <div className="pdf-preview" style={getContainerStyle()}>
          <div style={getOrientationStyle()}>
            <Document
              file={convertedPdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => console.error('Error loading converted PDF:', error)}
              loading={<div>Loading PDF...</div>}
              noData={<div>No PDF conversion available</div>}
              error={<div>Error loading converted PDF. Please check if the file is valid.</div>}
            >
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={false}
                renderAnnotationLayer={false}
                scale={getScale()}
                style={getColorStyle()} 
              />
            </Document>
            {numPages && previewSize === 'large' && (
              <div className="pdf-controls" style={{ marginTop: '10px' }}>
                <button 
                  onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                  disabled={pageNumber <= 1}
                  style={{ margin: '0 5px', padding: '5px 10px' }}
                >
                  Previous
                </button>
                <span style={{ margin: '0 10px' }}>{pageNumber} of {numPages}</span>
                <button 
                  onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                  disabled={pageNumber >= numPages}
                  style={{ margin: '0 5px', padding: '5px 10px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // Render image preview
  if (isImage()) {
    return (
      <div className="preview-container" style={getContainerStyle()}>
        <img 
          src={objectUrl} 
          alt={file.name} 
          style={{
            maxHeight: '100%',
            maxWidth: '100%',
            ...getColorStyle(),
            ...getOrientationStyle()
          }} 
        />
      </div>
    );
  }

  // Render PDF preview
  if (isPDF()) {
    return (
      <div className="pdf-preview" style={getContainerStyle()}>
        <div style={getOrientationStyle()}>
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error('Error loading PDF:', error)}
            loading={<div>Loading PDF...</div>}
            noData={<div>No PDF file selected</div>}
            error={<div>Error loading PDF. Please check if the file is valid.</div>}
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false}
              renderAnnotationLayer={false}
              scale={getScale()}
              style={getColorStyle()} 
            />
          </Document>
          {numPages && previewSize === 'large' && (
            <div className="pdf-controls" style={{ marginTop: '10px' }}>
              <button 
                onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                disabled={pageNumber <= 1}
                style={{ margin: '0 5px', padding: '5px 10px' }}
              >
                Previous
              </button>
              <span style={{ margin: '0 10px' }}>{pageNumber} of {numPages}</span>
              <button 
                onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                disabled={pageNumber >= numPages}
                style={{ margin: '0 5px', padding: '5px 10px' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Excel files with custom renderer
  if (isExcel()) {
    return (
      <div className="excel-preview" style={{
        ...getContainerStyle(),
        flexDirection: 'column',
        alignItems: 'stretch'
      }}>
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Loading Excel data...
          </div>
        ) : excelData ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            overflow: 'hidden'
          }}>
            {excelData.sheetNames.length > 1 && (
              <div style={{
                padding: '5px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                overflowX: 'auto'
              }}>
                {excelData.sheetNames.map(sheetName => (
                  <button
                    key={sheetName}
                    style={{
                      margin: '0 5px',
                      padding: '3px 8px',
                      background: excelData.activeSheet === sheetName ? '#4a86e8' : '#f1f1f1',
                      color: excelData.activeSheet === sheetName ? 'white' : 'black',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: previewSize === 'small' ? '10px' : '12px'
                    }}
                    onClick={() => {
                      // This would need implementation to switch sheets
                      console.log('Switch to sheet:', sheetName);
                    }}
                  >
                    {sheetName}
                  </button>
                ))}
              </div>
            )}
            <div style={{
              flex: 1,
              overflow: 'auto',
              ...getColorStyle()
            }}>
              {renderExcelTable()}
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Unable to preview Excel file. The file might be damaged or in an unsupported format.</p>
          </div>
        )}
      </div>
    );
  }

  // Render Word documents with react-file-viewer
  if (isWord()) {
    return (
      <div className="word-preview" style={{
        ...getContainerStyle(),
        position: 'relative',
        height: previewSize === 'small' ? '250px' : '500px'
      }}>
        <div style={{
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          ...getColorStyle()
        }}>
          <FileViewer
            fileType={fileExtension}
            filePath={objectUrl}
            onError={onError}
            errorComponent={
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Error loading the document. Please check if the file is valid.</p>
              </div>
            }
          />
        </div>
        
        {previewSize === 'small' && (
          <div style={{
            position: 'absolute',
            bottom: '5px',
            right: '5px',
            background: 'rgba(255,255,255,0.8)',
            padding: '3px 6px',
            borderRadius: '3px',
            fontSize: '9px'
          }}>
            {paperSize} | {orientation} | {color}
          </div>
        )}
      </div>
    );
  }

  // Fallback for other file types
  return (
    <div className="generic-preview" style={{ 
      textAlign: 'center', 
      padding: previewSize === 'small' ? '15px' : '50px', 
      border: '1px dashed #ccc', 
      borderRadius: '4px',
      fontSize: previewSize === 'small' ? '0.8em' : '1em',
      height: '100%',
      overflow: 'auto'
    }}>
      <div className="file-icon" style={{ 
        fontSize: previewSize === 'small' ? '24px' : '48px', 
        marginBottom: previewSize === 'small' ? '10px' : '20px' 
      }}>
        {fileExtension ? fileExtension.toUpperCase() : '?'}
      </div>
      <div className="file-name" style={{ fontWeight: 'bold', marginBottom: '10px' }}>
        {file.name}
      </div>
      <div className="file-message">
        Preview not available for {fileExtension || 'this file type'}
      </div>
      {previewSize !== 'small' && (
        <div className="file-settings" style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <p>Print settings will be applied during actual printing.</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>Color: {color}</li>
            <li>Orientation: {orientation}</li>
            <li>Paper Size: {paperSize}</li>
            <li>Two-Sided: {twoSided ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
