const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { generateTokens, verifyRefreshToken } = require('../services/tokenService');
const DailyRate = require('../models/DailyRate');

exports.register = async (req, res) => {
  const { email, password, username } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(409).json({ message: 'Email already in use' });

  const hash = await bcrypt.hash(password, 10);
  const newUser = await User.create({ email, password: hash, username });


  res.status(201).json({ email: newUser.email });
}; 

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: 'Invalid credentials' });

  const payload = { id: user._id };
  const { accessToken, refreshToken } = generateTokens(payload);

  await Session.create({
    userId: user._id,
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  res.json({ accessToken, refreshToken });
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  await Session.findOneAndDelete({ refreshToken });
  res.status(204).send();
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'No token provided' });

  const session = await Session.findOne({ refreshToken });
  if (!session) return res.status(403).json({ message: 'Invalid session' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokens = generateTokens({ id: payload.id });

    
    session.refreshToken = tokens.refreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    res.json(tokens);
  } catch (err) {
    res.status(403).json({ message: 'Token invalid or expired' });
  }
};


exports.getCurrentUser = async (req, res) => {
  try {
    // Use req.user directly (it is already the user doc!)
    const user = req.user;

    // Get dailyRate and notAllowedProducts as before
    const dailyRateDoc = await DailyRate.findOne({ user: user._id });
    const dailyRate = dailyRateDoc ? dailyRateDoc.kcal : 0;
    const notAllowedProducts = dailyRateDoc ? dailyRateDoc.notAllowedProducts : [];

    res.json({
      email: user.email,
      username: user.username,
      userData: {
        dailyRate,
        notAllowedProducts,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
