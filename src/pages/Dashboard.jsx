import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterPanel from '../components/FilterPanel';
import RoutineTable from '../components/RoutineTable';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
    const navigate = useNavigate();
    const [routines, setRoutines] = useState([]);
    const [filteredRoutines, setFilteredRoutines] = useState([]);
    const [filters, setFilters] = useState({
        day: 'ALL',
        block: 'ALL',
        classType: 'ALL'
    });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const userData = sessionStorage.getItem('user');
        if (!userData) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(userData));

        // Load routine data
        loadRoutineData();
    }, [navigate]);

    const loadRoutineData = async () => {
        try {
            // First try to load from session storage
            const sessionData = sessionStorage.getItem('routineData');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                setRoutines(data);
                setFilteredRoutines(data);
                setLoading(false);
                return;
            }

            // If not in session, try to load from Supabase if it's configured
            if (supabase) {
                const userData = JSON.parse(sessionStorage.getItem('user'));
                const { data, error } = await supabase
                    .from('routines')
                    .select('json_data')
                    .eq('user_id', userData.section)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (data && !error) {
                    setRoutines(data.json_data);
                    setFilteredRoutines(data.json_data);
                    sessionStorage.setItem('routineData', JSON.stringify(data.json_data));
                }
            } else {

                console.warn(
                    '[Supabase] Not configured. Skipping remote routine fetch and relying on session storage.'
                );
            }
        } catch (error) {
            console.error('Error loading routine data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);

        let filtered = [...routines];

        // Filter by day
        if (newFilters.day !== 'ALL') {
            filtered = filtered.filter(r =>
                r.day?.toUpperCase() === newFilters.day
            );
        }

        // Filter by block
        if (newFilters.block !== 'ALL') {
            filtered = filtered.filter(r =>
                r.block?.toUpperCase() === newFilters.block
            );
        }

        // Filter by class type
        if (newFilters.classType !== 'ALL') {
            filtered = filtered.filter(r =>
                r.classType?.toLowerCase() === newFilters.classType.toLowerCase()
            );
        }

        setFilteredRoutines(filtered);
    };

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };

    const handleUploadNew = () => {
        navigate('/upload');
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading your routine...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container dashboard">
            <div className="dashboard-header">
                <div>
                    <h1 className="app-title">Class Path Finder</h1>
                    {user && (
                        <p className="user-info">
                            Welcome, <strong>{user.fullName}</strong> | Section: <strong>{user.section}</strong>
                        </p>
                    )}
                </div>
                <div className="header-actions">
                    <button onClick={handleUploadNew} className="btn btn-secondary">
                        Upload New Routine
                    </button>
                    <button onClick={handleLogout} className="btn btn-outline">
                        Logout
                    </button>
                </div>
            </div>

            <div className="dashboard-content">
                <aside className="sidebar">
                    <FilterPanel onFilterChange={handleFilterChange} />
                </aside>

                <main className="main-content">
                    <div className="content-header">
                        <h2>Your Schedule</h2>
                        <p className="result-count">
                            Showing {filteredRoutines.length} of {routines.length} classes
                        </p>
                    </div>
                    <RoutineTable routines={filteredRoutines} />
                </main>
            </div>
        </div>
    );
}
