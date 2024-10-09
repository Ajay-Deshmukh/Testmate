const User = require('../models/User');
const bcrypt = require('bcrypt');

// Add a new teacher
exports.addTeacher = async (req, res) => {
  const { email, username, password, name, role, branch } = req.body;

  // Check if required fields are provided
  if (!email || !username || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Teacher with this email already exists' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new teacher
    const newTeacher = await User.create({
      email,
      username,
      password: hashedPassword,
      name,
      role: role || 'teacher', // Default to 'teacher' if not provided
      branch,
    });

    res.status(201).json(newTeacher);
  } catch (error) {
    console.error('Error adding teacher:', error);
    res.status(500).json({ error: 'An error occurred while adding the teacher' });
  }
};

// Get all teachers
exports.getAllTeachers = async (req, res) => {
    console.log("getAllTeachers triggered");
  try {
    const teachers = await User.findAll({
      where: { role: 'teacher' },
    });
    res.status(200).json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'An error occurred while fetching the teachers' });
  }
};

// Delete a teacher by email
exports.deleteTeacher = async (req, res) => {
  const { email } = req.params;

  try {
    // Find the teacher by email
    const teacher = await User.findOne({ where: { email, role: 'teacher' } });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Delete the teacher
    await teacher.destroy();
    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ error: 'An error occurred while deleting the teacher' });
  }
};