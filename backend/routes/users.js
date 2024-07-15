import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';


const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('Registration attempt for:', { username, email });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });
    
    const isFirstUser = (await User.countDocuments({})) === 0;
    
    user = new User({
      username,
      email,
      password,
      isAdmin: isFirstUser
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    console.log('User saved to database');

     // Return JWT
     const payload = { user: { id: user.id } };
     jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
       if (err) throw err;
       res.json({ token });
     });
   } catch (err) {
     console.error(err.message);
     res.status(500).send('Server error');
   }
 });

// User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {

    //Check if user exists
    let user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid email or password' });
    

       // Return JWT
       const payload = { user: { id: user.id } };
       jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
         if (err) throw err;
         res.json({ token });
       });
     } catch (err) {
       console.error(err.message);
       res.status(500).send('Server error');
     }
   });

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;