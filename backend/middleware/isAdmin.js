import User from '../models/user.model.js';

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error checking admin status' });
  }
};

export { isAdmin };