import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract routine data
 * @param {File} file - The Excel file to parse
 * @returns {Promise<Array>} Array of routine objects
 */
export async function parseExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get the first sheet
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                // Transform to our routine format
                const routines = jsonData.map(row => ({
                    day: row.Day || row.day || '',
                    time: row.Time || row.time || '',
                    section: row.Section || row.section || '',
                    hours: row.Hours || row.hours || row.Duration || row.duration || '',
                    room: row.Room || row.room || '',
                    block: row.Block || row.block || '',
                    lecturer: row.Lecturer || row.lecturer || row.Teacher || row.teacher || '',
                    module: row.Module || row.module || row.Subject || row.subject || '',
                    classType: row['Class Type'] || row.classType || row.Type || row.type || '',
                    semester: row.Semester || row.semester || '',
                    course: row.Course || row.course || ''
                })).filter(routine => routine.day || routine.time); // Filter out empty rows

                resolve(routines);
            } catch (error) {
                reject(new Error('Failed to parse Excel file: ' + error.message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsArrayBuffer(file);
    });
}
