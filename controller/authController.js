const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/userModel");
const redisClient = require("../config/redis");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({ username, email,password, passwordhash: hashedPassword });
    await user.save();
    
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({email});
console.log(user);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
console.log(user.password);
console.log(password);
  const isMatch =  (password === user.password);
  console.log(isMatch);
  if (!isMatch) return res.status(400).json({ message: "Invalid ascredentials" });

  // Ensure single-device login
  const existingSessionId = await redisClient.get(`user:${user.id}`);
  console.log(existingSessionId);
  if (existingSessionId) await redisClient.del(existingSessionId);

  req.session.userId = user.id;
  req.session.userEmail = user.email;
  req.session.sessionId = uuidv4();
  await redisClient.set(`user:${user.id}`, req.session.sessionId);
  const newSessionId = await redisClient.get(`user:${user.id}`);
  console.log(newSessionId);
  res.json({ message: "Login successful", user: { id: user.id, username: user.username } });
};

exports.logout = async (req, res) => {
  await redisClient.del(`user:${req.session.userId}`);
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.json({ message: "Logged out successfully" });
  });
};

exports.getUserDetails = async (req, res) => {
  const user = await User.findById(req.session.userId).select("-passwordhash");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
};
