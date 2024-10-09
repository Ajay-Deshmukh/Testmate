const express = require('express');
const { addTeacher, getAllTeachers, deleteTeacher } = require('../controllers/teacherController');
const router = express.Router();

// Add a new teacher
router.post('/addTeacher', addTeacher);

// Get all teachers
router.get('/getTeachers', getAllTeachers);

// Delete a teacher by email
router.delete('/deleteTeacher/:email', deleteTeacher);

module.exports = router;