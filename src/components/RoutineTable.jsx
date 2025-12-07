import '../styles/table.css';

export default function RoutineTable({ routines }) {
    if (!routines || routines.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No Classes Found</h3>
                <p>No classes match your current filters. Try adjusting your filters or upload a routine file.</p>
            </div>
        );
    }

    // Group routines by day
    const routinesByDay = routines.reduce((acc, routine) => {
        const day = routine.day || 'Unknown';
        if (!acc[day]) {
            acc[day] = [];
        }
        acc[day].push(routine);
        return acc;
    }, {});

    // Sort days
    const dayOrder = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const sortedDays = Object.keys(routinesByDay).sort((a, b) => {
        return dayOrder.indexOf(a) - dayOrder.indexOf(b);
    });

    return (
        <div className="routine-table-container">
            {sortedDays.map(day => (
                <div key={day} className="day-section">
                    <h3 className="day-header">{day}</h3>
                    <div className="routine-grid">
                        {routinesByDay[day]
                            .sort((a, b) => {
                                // Sort by time
                                const timeA = a.time?.split('-')[0]?.trim() || '';
                                const timeB = b.time?.split('-')[0]?.trim() || '';
                                return timeA.localeCompare(timeB);
                            })
                            .map((routine, index) => (
                                <div key={index} className={`routine-card ${routine.classType?.toLowerCase()}`}>
                                    <div className="routine-time">
                                        <span className="time-icon">🕐</span>
                                        {routine.time}
                                    </div>

                                    {routine.module && (
                                        <h4 className="routine-module">{routine.module}</h4>
                                    )}

                                    <div className="routine-details">
                                        {routine.lecturer && (
                                            <div className="detail-item">
                                                <span className="detail-icon">👨‍🏫</span>
                                                <span>{routine.lecturer}</span>
                                            </div>
                                        )}

                                        {routine.room && routine.block && (
                                            <div className="detail-item">
                                                <span className="detail-icon">📍</span>
                                                <span>Block {routine.block}, Room {routine.room}</span>
                                            </div>
                                        )}

                                        {routine.hours && (
                                            <div className="detail-item">
                                                <span className="detail-icon">⏱️</span>
                                                <span>{routine.hours} hours</span>
                                            </div>
                                        )}

                                        {routine.classType && (
                                            <div className="routine-badge">{routine.classType}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
