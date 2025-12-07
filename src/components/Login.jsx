import { useState } from 'react';
import '../styles/main.css';

export default function Login({ onLogin }) {
    const [fullName, setFullName] = useState('');
    const [section, setSection] = useState('A10');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const sections = [
        'A10', 'A11', 'A12', 'A13', 'A14', 'A15',
        'A16', 'A17', 'A18', 'A19', 'A20', 'A21'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!fullName.trim()) {
            setError('Please enter your full name');
            return;
        }

        setLoading(true);

        try {
            // Store user info in session storage
            const userData = { fullName: fullName.trim(), section };
            sessionStorage.setItem('user', JSON.stringify(userData));

            // Call the onLogin callback
            if (onLogin) {
                await onLogin(userData);
            }
        } catch (err) {
            setError('Login failed. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Class Path Finder</h1>
                    <p>Navigate your university schedule with ease</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            className="form-input"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="section">Section</label>
                        <select
                            id="section"
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="form-select"
                            disabled={loading}
                        >
                            {sections.map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                            ))}
                        </select>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Logging in...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
