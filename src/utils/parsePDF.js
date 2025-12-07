
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

/**
 * Parse PDF file and extract routine data
 * @param {File} file - The PDF file to parse
 * @returns {Promise<Array>} Array of routine objects
 */
export async function parsePDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const allRoutines = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Group items by Y coordinate (row)
            const rows = groupTextByRow(textContent.items);

            // Sort rows by Y (top to bottom)
            // PDF coordinates: (0,0) is bottom-left usually. So higher Y is top of page.
            // visual Top-Down means sorting Y Descending.
            const sortedRows = Object.keys(rows)
                .sort((a, b) => parseFloat(b) - parseFloat(a))
                .map(y => rows[y]);

            if (sortedRows.length === 0) continue;

            // Identify headers to determine column positions
            const headers = findHeaders(sortedRows);

            if (!headers) {
                console.warn(`Page ${pageNum}: Could not find table headers. Skipping.`);
                continue;
            }

            // Extract data rows
            const pageRoutines = extractDataFromRows(sortedRows, headers);
            allRoutines.push(...pageRoutines);
        }

        // Step 1: Extract and normalize days from all routines
        allRoutines.forEach(routine => {
            // First, normalize existing day
            if (routine.day) {
                routine.day = normalizeDay(routine.day);
            }
            
            // If still no day, search all fields aggressively
            if (!routine.day || routine.day === '') {
                // Look for day patterns in all fields combined
                const allText = Object.values(routine).join(' ').toUpperCase();
                const dayMatch = allText.match(/\b(SUN|MON|TUE|WED|THU|FRI|SAT|SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\b/);
                if (dayMatch) {
                    routine.day = normalizeDay(dayMatch[1]);
                }
            }
        });

        // Step 2: Separate routines with and without time
        const routinesWithTime = allRoutines.filter(r => r.time);
        const routinesWithoutTime = allRoutines.filter(r => !r.time);

        // Step 3: Fill down days - propagate day values forward through the list
        // This handles cases where day is only in the first row of a day's classes
        // Also handle cases where day appears in multiple consecutive rows
        let lastDay = '';
        routinesWithTime.forEach((routine, index) => {
            const currentDay = routine.day ? normalizeDay(routine.day) : '';
            
            if (currentDay && currentDay !== '') {
                // Found a new day - use it
                lastDay = currentDay;
                routine.day = lastDay;
            } else if (lastDay) {
                // No day in this row - use the last known day
                routine.day = lastDay;
            }
        });

        // Step 3b: Also fill backwards to catch any missed days at the start
        lastDay = '';
        for (let i = routinesWithTime.length - 1; i >= 0; i--) {
            const routine = routinesWithTime[i];
            const currentDay = routine.day ? normalizeDay(routine.day) : '';
            
            if (currentDay && currentDay !== '') {
                lastDay = currentDay;
            } else if (lastDay) {
                routine.day = lastDay;
            }
        }

        // Step 4: Group routines by day, then sort by time within each day
        const routinesByDay = {};
        routinesWithTime.forEach(routine => {
            const day = routine.day && normalizeDay(routine.day) !== '' ? normalizeDay(routine.day) : 'Unknown';
            if (!routinesByDay[day]) {
                routinesByDay[day] = [];
            }
            routinesByDay[day].push(routine);
        });

        // Debug: Log day distribution
        console.log('Day distribution:', Object.keys(routinesByDay).map(day => `${day}: ${routinesByDay[day].length}`).join(', '));

        // Step 5: Sort each day's routines by time
        const dayOrder = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const filledRoutines = [];
        
        // Process days in order
        dayOrder.forEach(day => {
            if (routinesByDay[day]) {
                // Sort by time within this day
                routinesByDay[day].sort((a, b) => {
                    const timeA = parseTimeValue(a.time);
                    const timeB = parseTimeValue(b.time);
                    if (timeA === null && timeB === null) return 0;
                    if (timeA === null) return 1;
                    if (timeB === null) return -1;
                    return timeA - timeB;
                });
                filledRoutines.push(...routinesByDay[day]);
            }
        });

        // Add any remaining routines (Unknown day or other days)
        Object.keys(routinesByDay).forEach(day => {
            if (!dayOrder.includes(day)) {
                routinesByDay[day].sort((a, b) => {
                    const timeA = parseTimeValue(a.time);
                    const timeB = parseTimeValue(b.time);
                    if (timeA === null && timeB === null) return 0;
                    if (timeA === null) return 1;
                    if (timeB === null) return -1;
                    return timeA - timeB;
                });
                filledRoutines.push(...routinesByDay[day]);
            }
        });

        // Debug: Log sample routines to see what was extracted
        console.log('Sample routines (first 5):', filledRoutines.slice(0, 5).map(r => ({ day: r.day, time: r.time, module: r.module })));
        console.log('Total routines:', filledRoutines.length);
        
        return filledRoutines;

    } catch (error) {
        console.error('PDF Parsing Error:', error);
        throw new Error('Failed to parse PDF file: ' + error.message);
    }
}

function parseTimeValue(timeStr) {
    if (!timeStr) return null;
    
    // Handle time range format like "06:30 - 08:00" - extract start time
    const timeRangeMatch = timeStr.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
    if (timeRangeMatch) {
        const h = parseInt(timeRangeMatch[1]);
        const m = parseInt(timeRangeMatch[2]);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
            return h * 60 + m;
        }
    }
    
    // Handle single time format like "06:30"
    const singleTimeMatch = timeStr.match(/(\d{1,2})[:.](\d{2})/);
    if (singleTimeMatch) {
        const h = parseInt(singleTimeMatch[1]);
        const m = parseInt(singleTimeMatch[2]);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
            return h * 60 + m;
        }
    }
    
    return null;
}

/**
 * Groups text items by their Y coordinate with some tolerance
 */
function groupTextByRow(items) {
    const rows = {};
    const tolerance = 5; // pixels

    items.forEach(item => {
        // item.transform[5] is the y coordinate
        const y = item.transform[5];

        // Find existing row within tolerance
        let matchedY = Object.keys(rows).find(key => Math.abs(parseFloat(key) - y) < tolerance);

        if (!matchedY) {
            matchedY = y;
            rows[matchedY] = [];
        }

        rows[matchedY].push(item);
    });

    // Sort items within each row by X coordinate
    Object.keys(rows).forEach(y => {
        rows[y].sort((a, b) => a.transform[4] - b.transform[4]);
    });

    return rows;
}

/**
 * Finds the row containing headers
 */
function findHeaders(sortedRows) {
    // Keywords to look for in the header row
    const headerKeywords = ['Day', 'Time', 'Section', 'Hours', 'Room', 'Block', 'Lecturer', 'Module', 'Class', 'Type', 'Semester', 'Course'];

    for (const row of sortedRows) {
        const rowText = row.map(item => item.str).join(' ').toLowerCase();
        const matchCount = headerKeywords.filter(k => rowText.includes(k.toLowerCase())).length;

        // If enough keywords match, assume this is the header row
        if (matchCount > 4) {
            return row;
        }
    }
    return null;
}

/**
 * Extracts data from rows based on header positions
 */
function extractDataFromRows(rows, headerRow) {
    const results = [];

    // 1. Build a better column mapping by analyzing header positions
    // First, identify which header corresponds to which field
    const headerMap = [];
    headerRow.forEach((item, index) => {
        const txt = item.str.toLowerCase().trim();
        let key = null;
        
        // More precise matching for Day column (should be first or early)
        if (txt.includes('day') && !txt.includes('today') && !txt.includes('yesterday')) {
            key = 'day';
        } else if (txt.includes('time')) {
            key = 'time';
        } else if (txt.includes('section')) {
            key = 'section';
        } else if (txt.includes('hours') || txt.includes('hour')) {
            key = 'hours';
        } else if (txt.includes('room') && !txt.includes('classroom')) {
            key = 'room';
        } else if (txt.includes('block')) {
            key = 'block';
        } else if (txt.includes('lecturer') || txt.includes('instructor') || txt.includes('teacher')) {
            key = 'lecturer';
        } else if (txt.includes('code') && (txt.includes('module') || txt.includes('course'))) {
            key = 'moduleCode';
        } else if (txt.includes('title') || (txt.includes('module') && !txt.includes('code'))) {
            key = 'module';
        } else if ((txt.includes('class') && txt.includes('type')) || (txt.includes('type') && !txt.includes('module'))) {
            key = 'classType';
        } else if (txt.includes('semester') || txt.includes('sem')) {
            key = 'semester';
        } else if (txt.includes('course') && !txt.includes('code')) {
            key = 'course';
        }
        
        headerMap.push({
            key,
            x: item.transform[4],
            index
        });
    });

    // Sort by X position to get column order
    headerMap.sort((a, b) => a.x - b.x);

    // Create column boundaries - use the X positions of headers
    const boundaries = [];
    for (let i = 0; i < headerMap.length - 1; i++) {
        const curr = headerMap[i];
        const next = headerMap[i + 1];
        // Use midpoint between columns
        const mid = (curr.x + next.x) / 2;
        boundaries.push(mid);
    }
    // Add a final boundary far to the right
    boundaries.push(headerMap[headerMap.length - 1].x + 100);

    // Create column keys array ordered by X position
    const columnKeys = headerMap.map(h => h.key);

    // Start processing data rows (rows strictly below header)
    const headerY = headerRow[0].transform[5];

    for (const row of rows) {
        if (row[0].transform[5] >= headerY) continue; // Skip header and above

        const rowData = {};

        // For each item in the row, find which column it belongs to
        row.forEach(item => {
            const x = item.transform[4];
            // Find which boundary this x is before
            let colIndex = 0;
            while (colIndex < boundaries.length && x > boundaries[colIndex]) {
                colIndex++;
            }

            // colIndex now points to the column (0-based)
            if (colIndex < columnKeys.length) {
                const key = columnKeys[colIndex];
                if (key) {
                    // If multiple items fall in same column (e.g. wrapped text), join them
                    const currentValue = rowData[key] || '';
                    rowData[key] = currentValue ? currentValue + ' ' + item.str.trim() : item.str.trim();
                } else {
                    // If no key mapped but this is the first column (colIndex 0), 
                    // it might be the day column that wasn't detected in header
                    if (colIndex === 0) {
                        const text = item.str.trim().toUpperCase();
                        // Check if it looks like a day
                        if (text.match(/^(SUN|MON|TUE|WED|THU|FRI|SAT|SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)$/)) {
                            rowData.day = normalizeDay(text);
                        }
                    }
                }
            }
        });

        // Clean up all fields - remove extra spaces
        Object.keys(rowData).forEach(key => {
            if (rowData[key]) {
                rowData[key] = rowData[key].trim().replace(/\s+/g, ' ');
            }
        });

        // Try to extract day - check first column first, then all fields
        // The first column is often the day column even if header wasn't detected
        if (!rowData.day || normalizeDay(rowData.day) === '') {
            // Check if first item in row looks like a day
            if (row.length > 0) {
                const firstItem = row[0].str.trim().toUpperCase();
                const firstItemDay = normalizeDay(firstItem);
                if (firstItemDay && firstItemDay !== '') {
                    rowData.day = firstItemDay;
                }
            }
            
            // If still no day, check all fields for day patterns
            if (!rowData.day || normalizeDay(rowData.day) === '') {
                const allFields = Object.values(rowData).join(' ').toUpperCase();
                const dayMatch = allFields.match(/\b(SUN|MON|TUE|WED|THU|FRI|SAT|SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\b/);
                if (dayMatch) {
                    rowData.day = normalizeDay(dayMatch[1]);
                }
            }
        } else {
            // Normalize the day if it exists
            rowData.day = normalizeDay(rowData.day);
        }

        // Clean up time format
        if (rowData.time) {
            rowData.time = rowData.time.trim();
        }

        // Only store rows that have either a day or time (actual data rows)
        if (rowData.day || rowData.time) {
            results.push(rowData);
        }
    }

    return results;
}

function normalizeDay(day) {
    if (!day) return '';
    const cleaned = day.trim().toUpperCase();
    
    // Handle full names or 3-letter codes
    const map = {
        'SUNDAY': 'SUN',
        'MONDAY': 'MON',
        'TUESDAY': 'TUE',
        'WEDNESDAY': 'WED',
        'THURSDAY': 'THU',
        'FRIDAY': 'FRI',
        'SATURDAY': 'SAT'
    };

    if (map[cleaned]) return map[cleaned];

    // Check if it's already a valid 3-letter day code
    const validDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    if (validDays.includes(cleaned)) {
        return cleaned;
    }

    // Fallback to first 3 chars if it looks like a day
    for (const validDay of validDays) {
        if (cleaned.startsWith(validDay) || cleaned.includes(validDay)) {
            return validDay;
        }
    }

    // If it contains day-like text, try to extract
    const dayMatch = cleaned.match(/\b(SUN|MON|TUE|WED|THU|FRI|SAT)\b/);
    if (dayMatch) {
        return dayMatch[1];
    }

    return '';
}
