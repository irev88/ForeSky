import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // frontend/src/pages/LoginPage.jsx

// ...
    // frontend/src/pages/LoginPage.jsx

// ...
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);
            
            // CHANGE THE URL IN THIS LINE
            const response = await apiClient.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            
            localStorage.setItem('accessToken', response.data.access_token);
            navigate('/');
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        }
    };
// ...
// ...

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                <button type="submit">Login</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default LoginPage;