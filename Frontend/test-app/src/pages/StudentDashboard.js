import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// import { jwtDecode } from 'jwt-decode';
import { FiClipboard, FiUsers, FiFileText, FiBarChart2, FiSettings, FiLogOut } from 'react-icons/fi';

import jwtDecode from 'jwt-decode';

function StudentDashboard() {
  const navigate = useNavigate();
  const [attemptedTests, setAttemptedTests] = useState([]);

  useEffect(() => {
    // Fetch the list of attempted tests by the user when the component mounts
    const fetchAttemptedTests = async () => {
      try {
        const token = localStorage.getItem('token'); // Retrieve the token from localStorage
        if (!token) {
          console.error('Token not found. Please log in.');
          return;
        }

        
        const userId = localStorage.getItem('user_id'); 

        const response = await axios.get(`http://localhost:8000/api/getUserAttempts/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Attach the token to the request header
          },
        });

        if (response.status === 200) {
          setAttemptedTests(response.data.attempts); // Assuming the data returned is an array of attempts
        } else {
          console.error('Failed to fetch attempted tests:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching attempted tests:', error);
      }
    };

    fetchAttemptedTests();
  }, []);

  const handleCategoryClick = async (category) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve the token from localStorage
      const response = await fetch(`http://localhost:8000/api/getTests?type=${category}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Attach the token to the request
        },
      });
      const data = await response.json();

      if (response.ok) {

        navigate(`/tests/${category.toLowerCase()}`, { state: { tests: data } });
      } else {
        console.error('Failed to fetch tests:', data.message);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token not found in localStorage');
      return;
    }

    const userId = localStorage.getItem('user_id'); 

    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await axios.delete(`http://localhost:8000/api/deleteUser/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          alert('Your account has been successfully deleted.'); 
          handleLogout();
        } else {
          console.error('Failed to delete account:', response.data.message);
          alert('There was an issue deleting your account.');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Oops! Something went wrong while deleting your account.');
      }
    }
  };

  const handleViewAnalysis = (attemptId) => {
    navigate(`/test-analysis/${attemptId}`);
  };

  return (
    <div className="student-dashboard" style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div className="sidebar" style={{ width: '20vw', backgroundColor: '#f4f4f4', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
          <p style={{ color: "grey" }}>Branch: Computer Science</p>
          <li><a href="#noticeboard">Noticeboard</a></li>
          <li><a href="#user-manual">User Manual</a></li>
          <button onClick={handleLogout} className="logout-button"><FiLogOut className="icon"/>
            Logout
          </button>
        </div>
        <div>
          <button onClick={handleDeleteAccount} style={{ padding: '10px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Delete Account
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ flex: 5, padding: '20px' }}>
        <h1>Test Categories</h1>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {['GATE_PYQ', 'MOCK_TEST', 'CUSTOM_TEST', 'CHAPTER_WISE', 'SUBJECT_WISE'].map(category => (
            <div key={category} onClick={() => handleCategoryClick(category)} style={{ width: '200px', height: '100px', backgroundColor: '#3498db', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px', cursor: 'pointer' }}>
              {category.replace('_', ' ')}
            </div>
          ))}
        </div>

        <h2>Attempted Tests</h2>
        <div style={{ marginTop: '20px' }}>
          {attemptedTests.length > 0 ? (
            attemptedTests.map((attempt) => (
              <div key={attempt.id} style={{ border: '1px solid #ddd', padding: '10px', margin: '10px 0', borderRadius: '8px' }}>
                <h3>{attempt.testTitle}</h3>
                <p>Score: {attempt.score}</p>
                <button onClick={() => handleViewAnalysis(attempt.id)} style={{ padding: '8px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
                  View Detailed Analysis
                </button>
              </div>
            ))
          ) : (
            <p>No tests attempted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
