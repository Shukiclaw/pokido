export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fetch from 'node-fetch';
import fs from 'fs';

const XIMILAR_API = 'https://api.ximilar.com/collectibles/v2/tcg_id';
const XIMILAR_TOKEN = process.env.XIMILAR_TOKEN;

export default async function handler(req, res) {
  // Check if token is configured
  if (!XIMILAR_TOKEN) {
    console.error('❌ XIMILAR_TOKEN not configured');
    return res.status(500).json({ 
      error: 'XIMILAR_TOKEN not configured',
      message: 'Please set XIMILAR_TOKEN environment variable in Vercel dashboard',
      usingLocal: true
    });
  }
  
  console.log('✅ XIMILAR_TOKEN is configured');
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the form data
    const form = formidable({ multiples: false });
    
    console.log('Parsing form data...');
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file;
    if (!file) {
      console.error('❌ No file in request. Files:', files);
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Handle both single file and array (formidable can return array)
    const actualFile = Array.isArray(file) ? file[0] : file;
    
    console.log('✅ File received:', actualFile.originalFilename || 'unnamed');
    
    // Get filepath
    const filepath = actualFile.filepath || actualFile.path || actualFile.newFilename;
    
    if (!filepath) {
      console.error('❌ No filepath found');
      return res.status(500).json({ 
        error: 'File path not found',
        usingLocal: true 
      });
    }

    // Read the file and convert to base64
    let fileData;
    try {
      fileData = fs.readFileSync(filepath);
      console.log('✅ File read, size:', fileData.length, 'bytes');
    } catch (readError) {
      console.error('❌ Error reading file:', readError);
      return res.status(500).json({ 
        error: 'Failed to read file: ' + readError.message,
        usingLocal: true 
      });
    }

    // Convert to base64
    const base64Image = fileData.toString('base64');
    console.log('✅ Converted to base64, length:', base64Image.length);

    // Forward to Ximilar API with JSON format
    console.log('Sending to Ximilar API:', XIMILAR_API);
    const response = await fetch(XIMILAR_API, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${XIMILAR_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{
          _base64: base64Image
        }]
      }),
    });
    
    console.log('✅ Ximilar response status:', response.status);

    // Clean up temp file
    try {
      fs.unlinkSync(filepath);
    } catch (e) {
      console.log('Could not delete temp file:', e.message);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ximilar API error:', errorText);
      return res.status(response.status).json({ 
        error: 'Ximilar API error',
        details: errorText,
        usingLocal: true
      });
    }

    const data = await response.json();
    console.log('✅ Success! Response:', JSON.stringify(data).substring(0, 200));
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ Server Error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      usingLocal: true
    });
  }
}
