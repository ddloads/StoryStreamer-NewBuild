import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  favoriteAudiobooks: [{
    type: Schema.Types.ObjectId,
    ref: 'Audiobook'
  }],
  listeningHistory: [{
    audiobook: {
      type: Schema.Types.ObjectId,
      ref: 'Audiobook'
    },
    lastListenedAt: Date,
    progress: Number // Progress in seconds
  }],
  completedBooks: [{
    type: Schema.Types.ObjectId,
    ref: 'Audiobook'
  }]
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;