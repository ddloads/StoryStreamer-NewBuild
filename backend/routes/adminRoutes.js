import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import * as mm from 'music-metadata';
import authMiddleware from '../middleware/authMiddleware.js';
import checkAdmin from '../middleware/checkAdmin.js';

const router = express.Router();

router.use(authMiddleware);
router.use(checkAdmin);

// Add a new audiobook database location
router.post('/add-database-location', async (req, res) => {
  try {
    const { location } = req.body;
    await fs.access(location);
    res.json({ message: 'Database location added successfully', location });
  } catch (error) {
    res.status(400).json({ error: 'Invalid directory location' });
  }
});

// Scan for audiobooks and extract metadata
router.post('/scan-audiobooks', async (req, res) => {
  try {
    const { location } = req.body;
    async function scanDirectory(dir) {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          await scanDirectory(filePath);
        } else if (path.extname(file).toLowerCase() === '.mp3') {
          const metadata = await mm.parseFile(filePath);
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