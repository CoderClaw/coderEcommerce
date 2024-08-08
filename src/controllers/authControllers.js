const { hashPassword, comparePassword } = require('../utils/hash');
const userDao = require('../daos/userDao');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/mailer');
const UserDto = require('../dtos/userDto');
const crypto = require('crypto');

const register = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  const existingUser = await userDao.findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ message: 'Email already taken' });
  }

  const hashedPassword = await hashPassword(password);
  const newUser = await userDao.createUser({ first_name, last_name, email, password: hashedPassword });
  
  sendMail(email, 'Welcome', 'Thank you for registering');
  
  return res.status(201).json({ message: 'User created', user: new UserDto(newUser) });
};

const login = async (req, res) => {
  const { username, password } = req.body;
  const user = await userDao.findUserByUsername(username);
  if (!user) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_PRIVATE_KEY, { expiresIn: '1h' });
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/'); // Redirect to home page after successful login
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

const getCurrentUser = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    const user = await userDao.findById(decoded.id);
    const userDto = new UserDto(user);
    res.status(200).json({ user: userDto });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const user = await userDao.findUserByEmail(email);

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const token = crypto.randomBytes(20).toString('hex');
  const resetPasswordExpires = Date.now() + 3600000; // 1 hour

  user.resetPasswordToken = token;
  user.resetPasswordExpires = resetPasswordExpires;
  await user.save();

  const resetUrl = `http://localhost:8080/reset-password/${token}`;

  sendMail(user.email, 'Password Reset', `Click here to reset your password: ${resetUrl}`);

  res.status(200).json({ message: 'Password reset link sent' });
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await userDao.findUserByResetToken(token);

  if (!user || user.resetPasswordExpires < Date.now()) {
    return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
  }

  if (await comparePassword(password, user.password)) {
    return res.status(400).json({ message: 'Cannot use the same password' });
  }

  user.password = await hashPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: 'Password has been reset' });
};

module.exports = { register, login, logout, getCurrentUser, requestPasswordReset, resetPassword };
