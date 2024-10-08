import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const API_URL = 'http://localhost:8000/api';

function Login() {
    const [identifier, setIdentifier] = useState(''); // Single input for email or username
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${API_URL}/loginUser`, {
                identifier, // Use the identifier for login                
                password,
            });


            // Store the token in localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user_id', response.data.user.email);


            // Handle user role and navigation
            if (response.data.user.role === 'admin') {
                navigate('/admin-dashboard');
            } else if (response.data.user.role === 'teacher') {
                navigate('/teacher-dashboard');
            } else if (response.data.user.role === 'student') {
                navigate('/student-dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <h1>Login</h1>
            <form onSubmit={handleLogin}>
                <div>
                    <label>Username or Email</label>
                    <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            <p>
                Don't have an account? <a href="/register">Register</a>
            </p>
        </div>
    );
}

export default Login;
