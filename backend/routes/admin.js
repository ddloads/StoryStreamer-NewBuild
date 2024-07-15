import express from 'express';
import User from '../models/user.model.js';
import verifyToken from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';
import * as mm from 'music-metadata';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// Middleware to check if user is admin
router.use(verifyToken, isAdmin);

// Add a new audiobook database location
router.post('/add-database-location', async (req, res) => {
  try {
    const { location } = req.body;
    
    // Check if the directory exists
    await fs.access(location);
    
    // TODO: Store the location in the database or in a configuration file
    
    res.json({ message: 'Database location added successfully', location });
  } catch (error) {
    res.status(400).json({ error: 'Invalid directory location' });
  }
});

// Scan for audiobooks and extract metadata
router.post('/scan-audiobooks', async (req, res) => {
  try {
    const { location } = req.body;
    
    // Recursive function to scan directories
    async function scanDirectory(dir) {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          await scanDirectory(filePath);
        } else if (path.extname(file).toLowerCase() === '.mp3') {
          // Extract metadata from MP3 file
          const metadata = await mm.parseFile(filePath);
          
          // TODO: Store metadata in MongoDB
          console.log('Extracted metadata:', metadata.common);
        }
      }
    }
    
    await scanDirectory(location);
    
    res.json({ message: 'Scan completed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error scanning audiobooks' });
  }
});

export default router;