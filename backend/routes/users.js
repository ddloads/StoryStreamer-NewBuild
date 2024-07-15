import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Audiobook from '../models/audiobook.model.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// User registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if this is the first user (to make them an admin)
    const isFirstUser = (await User.countDocuments({})) === 0;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: isFirstUser // Set isAdmin to true if this is the first user
    });

    await user.save();

    // Create and assign a token
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* // Get user profile
router.get('/profile',  auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('favoriteAudiobooks')
      .populate('listeningHistory.audiobook')
      .populate('completedBooks');
    res.json({
      username: user.username,
      email: user.email,
      favoriteAudiobooks: user.favoriteAudiobooks,
      listeningHistory: user.listeningHistory,
      completedBooks: user.completedBooks
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}); */

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('favoriteAudiobooks')
      .populate('listeningHistory.audiobook');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate listening stats
    const totalListeningTime = user.listeningHistory.reduce((total, item) => total + item.progress, 0);
    const completedBooksCount = user.completedBooks.length;
    
    // Find favorite genre
    const genreCounts = {};
    user.listeningHistory.forEach(item => {
      genreCounts[item.audiobook.genre] = (genreCounts[item.audiobook.genre] || 0) + 1;
    });
    const favoriteGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    res.json({
      username: user.username,
      email: user.email,
      totalListeningTime,
      completedBooksCount,
      favoriteGenre,
      favoriteAudiobooks: user.favoriteAudiobooks,
      listeningHistory: user.listeningHistory.slice(0, 5) // Get only the 5 most recent
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.username = username || user.username;
    user.email = email || user.email;

    await user.save();

    res.json({ message: 'Profile updated successfully', user: { username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user profile' });
  }
});

// Add an audiobook to favorites
router.post('/favorites/add', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { audiobookId } = req.body;
    
    if (!user.favoriteAudiobooks.includes(audiobookId)) {
      user.favoriteAudiobooks.push(audiobookId);
      await user.save();
    }
    
    res.json({ message: 'Audiobook added to favorites' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove an audiobook from favorites
router.post('/favorites/remove', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { audiobookId } = req.body;
    
    user.favoriteAudiobooks = user.favoriteAudiobooks.filter(id => id.toString() !== audiobookId);
    await user.save();
    
    res.json({ message: 'Audiobook removed from favorites' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update listening history
router.post('/history/update', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { audiobookId, progress } = req.body;
    
    const historyEntry = user.listeningHistory.find(entry => entry.audiobook.toString() === audiobookId);
    
    if (historyEntry) {
      historyEntry.lastListenedAt = new Date();
      historyEntry.progress = progress;
    } else {
      user.listeningHistory.push({
        audiobook: audiobookId,
        lastListenedAt: new Date(),
        progress: progress
      });
    }
    
    await user.save();
    res.json({ message: 'Listening history updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET expanded user statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('favoriteAudiobooks')
      .populate('listeningHistory.audiobook')
      .populate('completedBooks');

    const now = new Date();

    // Basic stats (from before)
    const totalListeningTime = user.listeningHistory.reduce((total, entry) => total + entry.progress, 0);
    const completedBooksCount = user.completedBooks.length;

    // Time-based analytics
    const lastWeekListeningTime = user.listeningHistory.reduce((total, entry) => {
      if ((now - entry.lastListenedAt) / (1000 * 60 * 60 * 24) <= 7) {
        return total + entry.progress;
      }
      return total;
    }, 0);

    const lastMonthListeningTime = user.listeningHistory.reduce((total, entry) => {
      if ((now - entry.lastListenedAt) / (1000 * 60 * 60 * 24) <= 30) {
        return total + entry.progress;
      }
      return total;
    }, 0);

    // Genre and author deep dive
    const genreStats = {};
    const authorStats = {};
    user.listeningHistory.forEach(entry => {
      const { genre, authors } = entry.audiobook;
      genreStats[genre] = (genreStats[genre] || 0) + entry.progress;
      authors.forEach(author => {
        authorStats[author] = (authorStats[author] || 0) + entry.progress;
      });
    });

    const topGenres = Object.entries(genreStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre, time]) => ({ genre, time }));

    const topAuthors = Object.entries(authorStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([author, time]) => ({ author, time }));

    // Listening streak and habits
    const listeningDays = new Set(user.listeningHistory.map(entry => 
      entry.lastListenedAt.toISOString().split('T')[0]
    ));
    const currentStreak = calculateStreak(Array.from(listeningDays));

    const listeningHours = user.listeningHistory.reduce((hours, entry) => {
      const hour = new Date(entry.lastListenedAt).getHours();
      hours[hour] = (hours[hour] || 0) + entry.progress;
      return hours;
    }, {});

    const favoriteListeningHour = Object.entries(listeningHours)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Comparison to other users (percentiles)
    const allUsers = await User.find({});
    const totalTimePercentile = calculatePercentile(allUsers.map(u => 
      u.listeningHistory.reduce((total, entry) => total + entry.progress, 0)
    ), totalListeningTime);

    const completedBooksPercentile = calculatePercentile(allUsers.map(u => 
      u.completedBooks.length
    ), completedBooksCount);

    // Progress tracking
    const inProgressBooks = user.listeningHistory.filter(entry => 
      !user.completedBooks.includes(entry.audiobook._id)
    ).map(entry => ({
      title: entry.audiobook.title,
      progress: (entry.progress / entry.audiobook.duration) * 100
    }));

    // Audiobook-specific stats
    const longestListenedBook = user.listeningHistory.reduce((longest, entry) => 
      entry.progress > longest.progress ? entry : longest
    , { progress: 0 });

    // Milestone tracking
    const milestones = [
      { name: "First Book Completed", achieved: user.completedBooks.length > 0 },
      { name: "5 Books Completed", achieved: user.completedBooks.length >= 5 },
      { name: "10 Books Completed", achieved: user.completedBooks.length >= 10 },
      { name: "24 Hours Listened", achieved: totalListeningTime >= 24 * 60 * 60 },
      { name: "100 Hours Listened", achieved: totalListeningTime >= 100 * 60 * 60 },
      { name: "5 Different Genres Explored", achieved: Object.keys(genreStats).length >= 5 },
      { name: "10 Different Authors Explored", achieved: Object.keys(authorStats).length >= 10 },
    ];

    // Calculate progress towards next milestone
    const nextMilestone = milestones.find(m => !m.achieved);
    let milestoneProgress = null;
    if (nextMilestone) {
      switch (nextMilestone.name) {
        case "5 Books Completed":
        case "10 Books Completed":
          milestoneProgress = (user.completedBooks.length / parseInt(nextMilestone.name)) * 100;
          break;
        case "24 Hours Listened":
        case "100 Hours Listened":
          const targetHours = parseInt(nextMilestone.name);
          milestoneProgress = (totalListeningTime / (targetHours * 60 * 60)) * 100;
          break;
        case "5 Different Genres Explored":
          milestoneProgress = (Object.keys(genreStats).length / 5) * 100;
          break;
        case "10 Different Authors Explored":
          milestoneProgress = (Object.keys(authorStats).length / 10) * 100;
          break;
      }
    }

    // Narrator statistics
    const narratorStats = {};
    user.listeningHistory.forEach(entry => {
      const { narrator } = entry.audiobook;
      if (!narratorStats[narrator]) {
        narratorStats[narrator] = {
          totalTime: 0,
          bookCount: new Set(),
        };
      }
      narratorStats[narrator].totalTime += entry.progress;
      narratorStats[narrator].bookCount.add(entry.audiobook._id.toString());
    });

    const topNarrators = Object.entries(narratorStats)
      .map(([narrator, stats]) => ({
        narrator,
        totalTime: stats.totalTime,
        bookCount: stats.bookCount.size
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 5);

    const favoriteNarrator = topNarrators[0];

   
    const mostRelistenedBook = user.listeningHistory.reduce((most, entry) => {
      const count = user.listeningHistory.filter(e => e.audiobook._id.equals(entry.audiobook._id)).length;
      return count > most.count ? { book: entry.audiobook, count } : most;
    }, { count: 0 });

    res.json({
      totalListeningTime,
      completedBooksCount,
      lastWeekListeningTime,
      lastMonthListeningTime,
      topGenres,
      topAuthors,
      currentStreak,
      favoriteListeningHour,
      totalTimePercentile,
      completedBooksPercentile,
      inProgressBooks,
      topNarrators,
      favoriteNarrator,
      milestones,
      longestListenedBook: longestListenedBook.audiobook ? longestListenedBook.audiobook.title : null,
      nextMilestone: nextMilestone ? {
        name: nextMilestone.name,
        progress: milestoneProgress
      } : null,
      
      mostRelistenedBook: mostRelistenedBook.book ? {
        title: mostRelistenedBook.book.title,
        count: mostRelistenedBook.count
      } : null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark a book as completed
router.post('/complete-book', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { audiobookId } = req.body;
    
    if (!user.completedBooks.includes(audiobookId)) {
      user.completedBooks.push(audiobookId);
      await user.save();
    }
    
    res.json({ message: 'Book marked as completed' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper function to calculate streak
function calculateStreak(dates) {
  dates.sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    if (i === 0 || isConsecutiveDay(new Date(dates[i-1]), new Date(dates[i]))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function isConsecutiveDay(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// Helper function to calculate percentile
function calculatePercentile(array, value) {
  const sortedArray = array.sort((a, b) => a - b);
  const index = sortedArray.findIndex(item => item >= value);
  return (index / sortedArray.length) * 100;
}


export default router;