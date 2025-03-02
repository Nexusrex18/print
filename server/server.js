const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const cors = require('cors');
const port = 3001;

app.use(cors());

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Function to clean the converted directory
const cleanConvertedDirectory = () => {
  const outputDir = path.resolve('converted');
  if (fs.existsSync(outputDir)) {
    // Read all files in the directory
    const files = fs.readdirSync(outputDir);
    // Delete each file
    files.forEach((file) => {
      const filePath = path.join(outputDir, file);
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    });
  } else {
    console.log("📂 Converted directory does not exist, skipping cleanup.");
  }
};

// Endpoint to convert PPT to PDF
app.post('/api/convert-to-pdf', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    console.error('❌ No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = path.resolve(file.path);
  const outputDir = path.resolve('converted');
  const outputPath = path.join(outputDir, `${path.parse(file.originalname).name}.pdf`);

  // Clean the converted directory before starting the conversion
  cleanConvertedDirectory();

  // Ensure converted directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const libreOfficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;
  const command = `${libreOfficePath} --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Conversion error:', error);
      console.error('⚠️ LibreOffice STDERR:', stderr);
      console.error('✅ LibreOffice STDOUT:', stdout);

      // Delete the uploaded file on error
      fs.unlinkSync(inputPath);
      return res.status(500).json({ error: 'Conversion failed', details: stderr });
    }

    console.log('✅ Conversion success:', stdout);

    // Validate the PDF file
    if (!fs.existsSync(outputPath)) {
      console.error('❌ Converted PDF file not found');

      // Delete the uploaded file if conversion fails
      fs.unlinkSync(inputPath);
      return res.status(500).json({ error: 'Converted PDF file not found' });
    }

    // Delete the uploaded file after successful conversion
    fs.unlinkSync(inputPath);

    // Check for any file in the converted directory
    const filesInConvertedDir = fs.readdirSync(outputDir);
    if (filesInConvertedDir.length > 0) {
      const firstFile = filesInConvertedDir[0];
      const firstFilePath = path.join(outputDir, firstFile);
      console.log(`📂 Found file in converted directory: ${firstFilePath}`);
      return res.json({ success: true, pdfPath: `/api/files/${firstFile}` });
    } else {
      console.error('❌ No files found in converted directory');
      return res.status(500).json({ error: 'No files found in converted directory' });
    }
  });
});

// Serve converted files
// Serve the first file from the converted directory
app.get('/api/files', (req, res) => {
    const outputDir = path.resolve('converted');
  
    // Check if the converted directory exists
    if (!fs.existsSync(outputDir)) {
      console.error('❌ Converted directory does not exist');
      return res.status(404).json({ error: 'Converted directory not found' });
    }
  
    // Read all files in the converted directory
    const files = fs.readdirSync(outputDir);
  
    // Check if there are any files in the directory
    if (files.length === 0) {
      console.error('❌ No files found in the converted directory');
      return res.status(404).json({ error: 'No files found in the converted directory' });
    }
  
    // Get the first file in the directory
    const firstFile = files[0];
    const filePath = path.join(outputDir, firstFile);
  
    // Send the first file as the response
    console.log(`📂 Sending file: ${filePath}`);
    res.sendFile(filePath, { root: '.' });
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});