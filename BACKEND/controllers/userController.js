// controllers/userController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a new user
exports.createUser = async (req, res) => {  
  try {
    const { email, username, password, name, role, branch } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      name,
      role,
      branch,
    });

    await sendWelcomeEmail(email, name);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
};

const sendWelcomeEmail = async (userEmail, userName) => {
  // Create a transporter using SMTP or a service like Gmail
  let transporter = nodemailer.createTransport({
    service: 'gmail', // Or use your preferred email provider
    auth: {
      user: 'testmate164@gmail.com', // Your email
      pass: 'zxyk ilea piek vxbt', // Your email password or app password
    },
  });
   // Define the email options
   let mailOptions = {
    from: 'testmate164@gmail.com', // Sender address
    to: userEmail, // Receiver email
    subject: 'Welcome to Our Platform',
    text: `Hello ${userName},\n\nWelcome to our platform! We're excited to have you onboard.\n\nBest regards,\nThe Team Testmate`,
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

exports.login = async (req, res) => {
  try {
    console.log("login handler hit");
    const { input, password } = req.body; // Changed 'email' to 'input'
    if (!input || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all the details carefully', 
      });
    }

    // Determine whether the input is an email or username
    const isEmail = input.includes('@');
    
    // Find user by email or username
    let user;
    if (isEmail) {
      user = await User.findOne({ where: { email: input } });
    } else {
      user = await User.findOne({ where: { username: input } });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User does not exist',
      });
    }

    const payload = {
      email: user.email,
      id: user.id,
      role: user.role,
      branch: user.branch,
    };

    if (await bcrypt.compare(password, user.password)) {
      let token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '2h',
      });

      user.token = token;
      user.password = undefined;

      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true, 
      };

      // Set the token and branch cookies
      res.cookie('token', token, options);
      res.cookie('branch', user.branch, { httpOnly: true, ...options });

      console.log("COOKIE SENT SUCCESSFULLY");

      return res.status(200).json({
        success: true,
        token,
        user,
        message: 'User logged in successfully',
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Password does not match',
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};
// Delete a user by email
exports.deleteUser = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findByPk(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.destroy();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

//get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Update a user by email
exports.updateUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const { username, password, name, role, branch } = req.body;
    const user = await User.findByPk(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.username = username;
    user.password = password;
    user.name = name;
    user.role = role;
    user.branch = branch;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Get all users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const users = await User.findAll({ where: { role } });
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found for the specified role' });
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};