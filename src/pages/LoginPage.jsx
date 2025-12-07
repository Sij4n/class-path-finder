import Login from '../components/Login';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const navigate = useNavigate();

    const handleLogin = async (userData) => {
        // Navigate to upload page after successful login
        navigate('/upload');
    };

    return (
        <div className="page-container">
            <Login onLogin={handleLogin} />
        </div>
    );
}
