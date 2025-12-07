import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { parseExcel } from '../utils/parseExcel';
import { parsePDF } from '../utils/parsePDF';
import '../styles/main.css';

export default function FileUpload({ onUploadComplete }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        const validTypes = [
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload a PDF or Excel file');
            return;
        }

        setFile(selectedFile);
        setError('');
    };

    const uploadFile = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setProgress(0);
        setError('');

        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            if (!user) {
                throw new Error('User not logged in');
            }

            // Simulate upload progress
            setProgress(20);

            // Parse the file based on type
            let routineData;
            if (file.type === 'application/pdf') {
                routineData = await parsePDF(file);
            } else {
                routineData = await parseExcel(file);
            }

            setProgress(50);

            // Upload file to Supabase Storage / Database if configured.
            // In local development without Supabase credentials, `supabase`
            // will be null and we simply skip the remote upload and rely on
            // sessionStorage instead.
            if (supabase) {
                const fileName = `${user.fullName.replace(/\s+/g, '_')}_${Date.now()}_${file.name}`;
                const filePath = `${user.section}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('routine_files')
                    .upload(filePath, file);

                if (uploadError) {
                    console.warn('Storage upload error:', uploadError);
                    // Continue even if storage fails (in case bucket doesn't exist yet)
                }

                setProgress(75);

                // Save parsed data to database
                const { error: dbError } = await supabase
                    .from('routines')
                    .insert({
                        user_id: user.section, // Using section as user_id for now
                        json_data: routineData
                    });

                if (dbError) {
                    console.warn('Database insert error:', dbError);
                    // Continue even if DB fails
                }
            } else {

                console.warn(
                    '[Supabase] Not configured. Skipping remote upload and using session storage only.'
                );
                setProgress(75);
            }

            setProgress(100);

            // Store in session storage as fallback
            sessionStorage.setItem('routineData', JSON.stringify(routineData));

            // Call completion callback
            if (onUploadComplete) {
                onUploadComplete(routineData);
            }
        } catch (err) {
            setError(err.message || 'Failed to process file. Please try again.');
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-container">
            <div className="upload-card">
                <h2>Upload Your Routine</h2>
                <p className="upload-description">
                    Upload your university routine file in PDF or Excel format
                </p>

                <div
                    className={`drop-zone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="file-upload"
                        accept=".pdf,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="file-input"
                        disabled={uploading}
                    />
                    <label htmlFor="file-upload" className="file-label">
                        <div className="upload-icon">📁</div>
                        {file ? (
                            <div className="file-info">
                                <p className="file-name">{file.name}</p>
                                <p className="file-size">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="upload-text">
                                    Drag and drop your file here, or click to browse
                                </p>
                                <p className="upload-hint">Supports PDF and Excel files</p>
                            </>
                        )}
                    </label>
                </div>

                {uploading && (
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="progress-text">{progress}%</p>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                <button
                    onClick={uploadFile}
                    className="btn btn-primary"
                    disabled={!file || uploading}
                >
                    {uploading ? 'Processing...' : 'Upload and Parse'}
                </button>
            </div>
        </div>
    );
}
