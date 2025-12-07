import { useState } from 'react';
import '../styles/filters.css';

export default function FilterPanel({ onFilterChange }) {
    const [filters, setFilters] = useState({
        day: 'ALL',
        block: 'ALL',
        classType: 'ALL'
    });

    const days = ['ALL', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
    const blocks = ['ALL', 'A', 'B', 'C'];
    const classTypes = ['ALL', 'Lecture', 'Practical', 'Tutorial'];

    const handleFilterChange = (filterType, value) => {
        const newFilters = { ...filters, [filterType]: value };
        setFilters(newFilters);

        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    return (
        <div className="filter-panel">
            <h3 className="filter-title">Filters</h3>

            <div className="filter-section">
                <label className="filter-label">Day</label>
                <div className="filter-buttons">
                    {days.map(day => (
                        <button
                            key={day}
                            className={`filter-btn ${filters.day === day ? 'active' : ''}`}
                            onClick={() => handleFilterChange('day', day)}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <label className="filter-label">Block</label>
                <div className="filter-buttons">
                    {blocks.map(block => (
                        <button
                            key={block}
                            className={`filter-btn ${filters.block === block ? 'active' : ''}`}
                            onClick={() => handleFilterChange('block', block)}
                        >
                            {block === 'ALL' ? 'ALL' : `Block ${block}`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <label className="filter-label">Class Type</label>
                <div className="filter-buttons">
                    {classTypes.map(type => (
                        <button
                            key={type}
                            className={`filter-btn ${filters.classType === type ? 'active' : ''}`}
                            onClick={() => handleFilterChange('classType', type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <button
                className="filter-reset"
                onClick={() => {
                    const resetFilters = { day: 'ALL', block: 'ALL', classType: 'ALL' };
                    setFilters(resetFilters);
                    if (onFilterChange) onFilterChange(resetFilters);
                }}
            >
                Reset Filters
            </button>
        </div>
    );
}
