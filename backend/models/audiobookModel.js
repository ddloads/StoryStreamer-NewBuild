import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const audiobookSchema = new Schema({
  title: { type: String, required: true },
  authors: [{ type: String, required: true }],
  narrator: { type: String, required: true },
  duration: { type: Number, required: true }, // total duration in minutes
  genre: { type: String, required: true },
  releaseDate: { type: Date, required: true },
  description: { type: String, required: true },
  coverImageUrl: { type: String },
  audioFiles: [{ 
    fileName: String, 
    filePath: String, 
    fileType: {
      type: String,
      enum: ['mp3', 'm4b', 'aax', 'aa', 'mp4', 'flac', 'ogg', 'wma', 'other'],
      required: true
    },
    duration: Number // duration of this specific file in minutes
  }],
  series: {
    name: String,
    bookNumber: Number
  },
  language: { type: String, default: 'English' },
  publisher: String,
  isbn: String,
  tags: [String],
  averageRating: { type: Number, min: 0, max: 5 },
  numberOfRatings: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const Audiobook = mongoose.model('Audiobook', audiobookSchema);

export default Audiobook;