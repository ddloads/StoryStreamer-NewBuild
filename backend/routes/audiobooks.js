import express from 'express';
import Audiobook from '../models/audiobook.model.js';
import User from '../models/user.model.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// GET all audiobooks (with filtering, sorting, and pagination)
router.route('/').get(async (req, res) => {
  try {
    const { genre, author, sort, page = 1, limit = 10 } = req.query;
    let query = {};
    let sortOption = {};

    if (genre) {
      query.genre = genre;
    }

    if (author) {
      query.authors = { $elemMatch: { $regex: author, $options: 'i' } };
    }

    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOption = { createdAt: -1 }; // Default sort by creation date, newest first
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const totalAudiobooks = await Audiobook.countDocuments(query);
    const totalPages = Math.ceil(totalAudiobooks / limitNumber);

    const audiobooks = await Audiobook.find(query)
      .sort(sortOption)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.json({
      audiobooks,
      currentPage: pageNumber,
      totalPages,
      totalAudiobooks
    });
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// POST a new audiobook
router.route('/add').post((req, res) => {
  const newAudiobook = new Audiobook(req.body);

  newAudiobook.save()
    .then(() => res.json('Audiobook added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// GET recently added audiobooks
router.route('/recent').get((req, res) => {
  Audiobook.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .then(audiobooks => res.json(audiobooks))
    .catch(err => res.status(400).json('Error: ' + err));
});


// Search route
router.get('/search', async (req, res) => {
  const { query } = req.query;
  
  try {
    const results = await Audiobook.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { authors: { $elemMatch: { $regex: query, $options: 'i' } } },
        { narrator: { $regex: query, $options: 'i' } },
        { genre: { $regex: query, $options: 'i' } },
        { 'series.name': { $regex: query, $options: 'i' } }
      ]
    });
    
    res.json(results);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// GET expanded statistics about the audiobook collection
router.route('/stats').get(async (req, res) => {
  try {
    const totalAudiobooks = await Audiobook.countDocuments();
    
    // Genre statistics
    const genreStats = await Audiobook.aggregate([
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Author statistics
    const authorStats = await Audiobook.aggregate([
      { $unwind: "$authors" },
      { $group: { _id: "$authors", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }  // Top 10 authors
    ]);

    // Narrator statistics
    const narratorStats = await Audiobook.aggregate([
      { $group: { _id: "$narrator", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }  // Top 10 narrators
    ]);

    // Series statistics
    const seriesStats = await Audiobook.aggregate([
      { $match: { "series.name": { $exists: true, $ne: null } } },
      { $group: { _id: "$series.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }  // Top 10 series
    ]);

    // File type breakdown
    const fileTypeStats = await Audiobook.aggregate([
      { $unwind: "$audioFiles" },
      { $group: { _id: "$audioFiles.fileType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Duration statistics
    const durationStats = await Audiobook.aggregate([
      { 
        $group: { 
          _id: null, 
          totalDuration: { $sum: "$duration" },
          avgDuration: { $avg: "$duration" },
          minDuration: { $min: "$duration" },
          maxDuration: { $max: "$duration" }
        } 
      }
    ]);

    // Timeline analysis
    const timelineStats = await Audiobook.aggregate([
      { 
        $group: { 
          _id: { $year: "$releaseDate" },
          count: { $sum: 1 }
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    // Book with most audio files
    const mostFiles = await Audiobook.aggregate([
      { 
        $project: { 
          title: 1, 
          fileCount: { $size: "$audioFiles" } 
        } 
      },
      { $sort: { fileCount: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      totalAudiobooks,
      genreBreakdown: genreStats,
      topAuthors: authorStats,
      topNarrators: narratorStats,
      topSeries: seriesStats,
      fileTypeBreakdown: fileTypeStats,
      durationStats: durationStats[0],
      releaseYearTimeline: timelineStats,
      bookWithMostFiles: mostFiles[0],
      oldestBook: await Audiobook.findOne().sort({ releaseDate: 1 }).select('title releaseDate'),
      newestBook: await Audiobook.findOne().sort({ releaseDate: -1 }).select('title releaseDate')
    });
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// GET a specific audiobook by id
router.route('/:id').get((req, res) => {
  Audiobook.findById(req.params.id)
    .then(audiobook => res.json(audiobook))
    .catch(err => res.status(400).json('Error: ' + err));
});

// DELETE a specific audiobook by id
router.route('/:id').delete((req, res) => {
  Audiobook.findByIdAndDelete(req.params.id)
    .then(() => res.json('Audiobook deleted.'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// UPDATE a specific audiobook by id
router.route('/update/:id').post((req, res) => {
  Audiobook.findById(req.params.id)
    .then(audiobook => {
      // Update each field
      Object.keys(req.body).forEach(key => {
        audiobook[key] = req.body[key];
      });

      audiobook.save()
        .then(() => res.json('Audiobook updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// GET enhanced personalized recommendations
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('favoriteAudiobooks')
      .populate('listeningHistory.audiobook')
      .populate('completedBooks');

    // Calculate genre, author, and narrator preferences
    const genrePreferences = {};
    const authorPreferences = {};
    const narratorPreferences = {};
    let totalListeningTime = 0;

    user.listeningHistory.forEach(entry => {
      const { genre, authors, narrator } = entry.audiobook;
      const listeningTime = entry.progress;
      totalListeningTime += listeningTime;

      genrePreferences[genre] = (genrePreferences[genre] || 0) + listeningTime;
      authors.forEach(author => {
        authorPreferences[author] = (authorPreferences[author] || 0) + listeningTime;
      });
      narratorPreferences[narrator] = (narratorPreferences[narrator] || 0) + listeningTime;
    });

    // Normalize preferences
    Object.keys(genrePreferences).forEach(genre => {
      genrePreferences[genre] /= totalListeningTime;
    });
    Object.keys(authorPreferences).forEach(author => {
      authorPreferences[author] /= totalListeningTime;
    });
    Object.keys(narratorPreferences).forEach(narrator => {
      narratorPreferences[narrator] /= totalListeningTime;
    });

    // Get top preferences
    const topGenres = Object.entries(genrePreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    const topAuthors = Object.entries(authorPreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([author]) => author);

    const topNarrators = Object.entries(narratorPreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([narrator]) => narrator);

    // Find recommendations
    const recommendations = await Audiobook.find({
      $or: [
        { genre: { $in: topGenres } },
        { authors: { $in: topAuthors } },
        { narrator: { $in: topNarrators } }
      ],
      _id: { $nin: user.completedBooks.map(book => book._id) }
    }).limit(50);

    // Score recommendations
    const scoredRecommendations = recommendations.map(book => {
      let score = 0;
      if (topGenres.includes(book.genre)) {
        score += genrePreferences[book.genre] * 3;  // Weigh genre more heavily
      }
      book.authors.forEach(author => {
        if (topAuthors.includes(author)) {
          score += authorPreferences[author];
        }
      });
      if (topNarrators.includes(book.narrator)) {
        score += narratorPreferences[book.narrator] * 2;  // Weigh narrator more than author but less than genre
      }

      // Boost score for books that would help achieve next milestone
      const nextMilestone = user.milestones.find(m => !m.achieved);
      if (nextMilestone) {
        switch (nextMilestone.name) {
          case "5 Different Genres Explored":
          case "10 Different Genres Explored":
            if (!Object.keys(genrePreferences).includes(book.genre)) {
              score += 0.5;
            }
            break;
          case "10 Different Authors Explored":
          case "20 Different Authors Explored":
            if (book.authors.some(author => !Object.keys(authorPreferences).includes(author))) {
              score += 0.5;
            }
            break;
        }
      }

      return { book, score };
    });

    // Sort by score and return top 10
    scoredRecommendations.sort((a, b) => b.score - a.score);
    const topRecommendations = scoredRecommendations.slice(0, 10).map(r => r.book);

    // Collaborative filtering
    const similarUsers = await User.find({
      $and: [
        { _id: { $ne: user._id } },
        { 
          $or: [
            { 'favoriteAudiobooks': { $in: user.favoriteAudiobooks } },
            { 'completedBooks': { $in: user.completedBooks } }
          ]
        }
      ]
    }).limit(10);

    const collaborativeRecommendations = await Audiobook.find({
      _id: { 
        $in: similarUsers.flatMap(u => [...u.favoriteAudiobooks, ...u.completedBooks]),
        $nin: [...user.favoriteAudiobooks, ...user.completedBooks].map(book => book._id)
      }
    }).limit(5);

    res.json({
      personalizedRecommendations: topRecommendations,
      collaborativeRecommendations: collaborativeRecommendations
    });
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// Helper function to calculate similarity between two strings
function similarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  let longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  let costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}


export default router;