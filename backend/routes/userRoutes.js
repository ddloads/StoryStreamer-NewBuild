// routes/userRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if this is the first user
    const userCount = await User.countDocuments();
    const isAdmin = userCount === 0;

    const user = new User({ username, email, password, isAdmin });
    await user.save();
    
    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.status(201).json({ 
      message: 'User registered successfully', 
      userId: user._id,
      isAdmin: user.isAdmin,
      token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'An error occurred while registering the user' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, userId: user._id, isAdmin: user.isAdmin });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      favoriteAudiobooks: user.favoriteAudiobooks,
      listeningHistory: user.listeningHistory,
      completedBooks: user.completedBooks
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'An error occurred while fetching the user profile' });
  }
});

// In userRoutes.js
router.post('/favorites/:audiobookId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const audiobook = await Audiobook.findById(req.params.audiobookId);

    if (!audiobook) {
      return res.status(404).json({ error: 'Audiobook not found' });
    }

    if (!user.favoriteAudiobooks.includes(audiobook._id)) {
      user.favoriteAudiobooks.push(audiobook._id);
      await user.save();
    }

    res.json({ message: 'Audiobook added to favorites' });
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

router.post('/reading-list/:audiobookId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const audiobook = await Audiobook.findById(req.params.audiobookId);

    if (!audiobook) {
      return res.status(404).json({ error: 'Audiobook not found' });
    }

    if (!user.readingList.includes(audiobook._id)) {
      user.readingList.push(audiobook._id);
      await user.save();
    }

    res.json({ message: 'Audiobook added to reading list' });
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

export default router;