import React, { useState, useEffect } from 'react';
import DocViewer from 'react-doc-viewer';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up the PDF worker with HTTPS URL
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FilePreview = ({ file, printSettings, previewSize = 'large' }) => {
  const { color, orientation, paperSize, twoSided } = printSettings;
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [objectUrl, setObjectUrl] = useState(null);

  // Create and clean up object URL
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

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

  // Function to determine if file is office document
  const isOfficeDoc = () => {
    const officeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/msword', // doc
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
      'application/vnd.ms-powerpoint' // ppt
    ];
    return officeTypes.includes(file.type);
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
        margin: previewSize === 'small' ? '10px 0' : '50px 0' // Smaller margin for small preview
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
    
    // Only apply if a valid size is provided
    if (sizeMap[paperSize]) {
      return {
        width: orientation === 'Landscape' ? sizeMap[paperSize].height : sizeMap[paperSize].width,
        height: orientation === 'Landscape' ? sizeMap[paperSize].width : sizeMap[paperSize].height
      };
    }
    
    return {};
  };

  // Combine all style transformations
  const getCombinedStyles = () => {
    const scale = previewSize === 'small' ? 0.5 : 1.0; // Scale down for small preview
    
    return {
      ...getColorStyle(),
      ...getOrientationStyle(),
      ...getPaperSizeStyle(),
      maxHeight: '100%',
      maxWidth: '100%',
      transition: 'all 0.3s ease',
      transform: previewSize === 'small' 
        ? `scale(${scale}) ${orientation === 'Landscape' ? 'rotate(90deg)' : ''}`
        : orientation === 'Landscape' ? 'rotate(90deg)' : '',
      transformOrigin: 'center'
    };
  };

  // Function to handle PDF document loading success
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Create container style with print settings applied
  const getContainerStyle = () => {
    // Use different heights based on preview size
    const containerHeight = previewSize === 'small' ? '100%' : '500px';
    
    return {
      textAlign: 'center',
      height: containerHeight,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'auto',
      ...getColorStyle() // Apply color settings to container for DocViewer
    };
  };

  // Get scale based on preview size
  const getScale = () => {
    return previewSize === 'small' ? 0.5 : 1.0;
  };

  // Render image preview
  if (isImage()) {
    return (
      <div className="preview-container" style={getContainerStyle()}>
        <img 
          src={objectUrl} 
          alt={file.name} 
          style={getCombinedStyles()} 
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
              style={getColorStyle()} // Apply only color filter here
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

  // Render Office documents preview
  if (isOfficeDoc()) {
    return (
      <div className="office-preview" style={getContainerStyle()}>
        <div style={getOrientationStyle()}>
          <DocViewer
            documents={[
              { uri: objectUrl, fileName: file.name }
            ]}
            style={{ 
              height: previewSize === 'small' ? '100%' : '400px',
              ...getPaperSizeStyle()
            }}
            config={{
              header: {
                disableHeader: previewSize === 'small',
                disableFileName: previewSize === 'small',
                retainURLParams: false
              }
            }}
          />
        </div>
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
        {file.name.split('.').pop().toUpperCase()}
      </div>
      <div className="file-name" style={{ fontWeight: 'bold', marginBottom: '10px' }}>
        {file.name}
      </div>
      <div className="file-message">
        Preview not available
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