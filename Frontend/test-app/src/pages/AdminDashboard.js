import React, { useState, useEffect } from "react";
import "./admin.css";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate
import { FiClipboard, FiUsers, FiFileText, FiBarChart2, FiSettings, FiLogOut } from 'react-icons/fi'; // Import icons

const AdminPage = () => {
  const [teachers, setTeachers] = useState([]); // State to store fetched teachers
  const [newTeacherData, setNewTeacherData] = useState({
    email: "",
    username: "",
    password: "",
    name: "",
    role: "teacher",
    branch: "none",
  });

  const API_URL = "http://127.0.0.1:8000/api/teacherRoutes"; // Adjust this if your server runs on a different port
  const navigate = useNavigate();

  // Fetch teachers from the backend
  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_URL}/getTeachers`);
      setTeachers(response.data); // Set fetched teachers in state
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  // Add a new teacher
  const addTeacher = async (e) => {
    e.preventDefault();
    if (
      newTeacherData.email &&
      newTeacherData.username &&
      newTeacherData.password &&
      newTeacherData.name
    ) {
      try {
        const response = await fetch(`${API_URL}/addTeacher`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTeacherData), // Send new teacher data to backend
        });

        if (!response.ok) {
          throw new Error("Failed to add teacher");
        }

        // Reset the form data after successful addition
        setNewTeacherData({
          email: "",
          username: "",
          password: "",
          name: "",
          role: "teacher",
          branch: "CSE",
        });

        // Refresh teacher list after adding new teacher
        fetchTeachers();
      } catch (error) {
        console.error("Error adding teacher:", error);
      }
    } else {
      alert("Please fill in all required fields.");
    }
  };

  // Remove a teacher by email
  const removeTeacher = async (email) => {
    try {
      const response = await fetch(`${API_URL}/deleteTeacher/${email}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete teacher");
      }

      // Refresh teacher list after deletion
      fetchTeachers();
    } catch (error) {
      console.error("Error removing teacher:", error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Clear user data from local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');

    // Redirect to login page
    navigate('/login');
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Dashboard</h2>
        </div>
        
        <button onClick={handleLogout} className="logout-button">
          <FiLogOut className="icon" /> Logout
        </button>
      </div>

      <main className="admin-content">
        <header className="admin-header">
          <h1>Admin Page</h1>
        </header>

        <section className="add-teacher-section">
          <h2>Add Teacher</h2>
          <form onSubmit={addTeacher}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={newTeacherData.email}
                onChange={(e) =>
                  setNewTeacherData({
                    ...newTeacherData,
                    email: e.target.value,
                  })
                }
                placeholder="Enter email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={newTeacherData.username}
                onChange={(e) =>
                  setNewTeacherData({
                    ...newTeacherData,
                    username: e.target.value,
                  })
                }
                placeholder="Enter username"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={newTeacherData.password}
                onChange={(e) =>
                  setNewTeacherData({
                    ...newTeacherData,
                    password: e.target.value,
                  })
                }
                placeholder="Enter password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={newTeacherData.name}
                onChange={(e) =>
                  setNewTeacherData({ ...newTeacherData, name: e.target.value })
                }
                placeholder="Enter teacher's name"
                required
              />
            </div>
            <button type="submit">Add Teacher</button>
          </form>
        </section>

        <section className="teachers-list-section">
          <h2>Manage Teachers</h2>
          <table className="teacher-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Branch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.email}> {/* Ensure unique key */}
                  <td>{teacher.name}</td>
                  <td>{teacher.branch}</td>
                  <td>
                    <button onClick={() => removeTeacher(teacher.email)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default AdminPage;