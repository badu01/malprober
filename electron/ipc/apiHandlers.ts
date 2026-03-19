import { ipcMain } from 'electron';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

// ============ BACKEND API CONFIGURATION ============
const BACKEND_URL = 'http://127.0.0.1:5000'; // Your Python backend URL

// ============ MALWARE ANALYSIS API HANDLERS ============

/**
 * Upload file to analysis backend
 * Equivalent to: POST /api/upload
 */
ipcMain.handle('analysis:upload-file', async (event, filePath: string) => {
    try {
        console.log('Uploading file:', filePath);

        // Read file and create form data
        const formData = new FormData();
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);

        formData.append('file', fileBuffer, {
            filename: fileName,
            contentType: 'application/octet-stream'
        });

        // Send to backend
        const response = await axios.post(`${BACKEND_URL}/api/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Content-Type': 'multipart/form-data'
            },
            timeout: 30000 // 30 seconds timeout
        });

        console.log('Upload response:', response.data);
        return {
            success: response.data.success,
            message: response.data.message,
            fileInfo: {
                original_name: response.data.fileInfo.original_name,
                file_path: response.data.fileInfo.file_path,
                file_hash: response.data.fileInfo.file_hash,
                file_size: response.data.fileInfo.file_size,
                file_extension: response.data.fileInfo.file_extension
            }
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || error.message);
        }
        throw error;
    }
});

/**
 * Start analysis on uploaded file
 * Equivalent to: POST /api/analyze
 */
ipcMain.handle('analysis:start', async (event, filePath: string) => {
    try {
        console.log('Starting analysis for file:', filePath);

        const response = await axios.post(`${BACKEND_URL}/api/analyze`, {
            filePath: filePath
        }, {
            timeout: 10000
        });

        console.log('Analysis started:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error starting analysis:', error);
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || error.message);
        }
        throw error;
    }
});

/**
 * Get analysis status
 * Equivalent to: GET /api/status/:analysisId
 */
ipcMain.handle('analysis:status', async (event, analysisId: string) => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/status/${analysisId}`, {
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        console.error('Error getting analysis status:', error);
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || error.message);
        }
        throw error;
    }
});

/**
 * Get analysis results
 * Equivalent to: GET /api/results/:analysisId
 */
ipcMain.handle('analysis:results', async (event, analysisId: string) => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/results/${analysisId}`, {
            timeout: 10000
        });
        return response.data;
    } catch (error) {
        console.error('Error getting analysis results:', error);
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || error.message);
        }
        throw error;
    }
});

/**
 * Get VM status
 * Equivalent to: GET /api/vm/status
 */
ipcMain.handle('vm:status', async () => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/vm/status`, {
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        console.error('Error getting VM status:', error);
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.error || error.message);
        }
        throw error;
    }
});

/**
 * Check backend health
 * Equivalent to: GET /api/health
 */
ipcMain.handle('backend:health', async () => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/health`, {
            timeout: 3000
        });
        return {
            healthy: true,
            ...response.data
        };
    } catch (error) {
        console.error('Backend health check failed:', error);
        return {
            healthy: false,
            error: error instanceof Error ? error.message : 'Backend not reachable'
        };
    }
});

// ============ YOUR EXISTING URLSCAN HANDLER ============

ipcMain.handle("scan-url", async (__dirname, url: string) => {
    const apiKey = process.env.URLSCAN_API_KEY;
    try {
        const response = await axios.post('https://urlscan.io/api/v1/scan', {
            url: url.trim(),
            visibility: 'private',
        },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'API-Key': apiKey || '',
                }
            });
        return response.data;
    } catch (error) {
        console.error('Error scanning URL:', error);
        throw error;
    }
});