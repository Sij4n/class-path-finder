import FileUpload from '../components/FileUpload';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function UploadPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in
        const user = sessionStorage.getItem('user');
        if (!user) {
            navigate('/login');
        }
    }, [navigate]);

    const handleUploadComplete = (routineData) => {
        // Navigate to dashboard after successful upload
        navigate('/dashboard');
    };

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="app-title">Class Path Finder</h1>
                <button onClick={handleLogout} className="btn btn-secondary">
                    Logout
                </button>
            </div>
            <FileUpload onUploadComplete={handleUploadComplete} />
        </div>
    );
}
