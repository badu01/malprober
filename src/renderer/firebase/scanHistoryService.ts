// src/renderer/services/firebase/scanHistoryService.ts

import { db } from './config';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { firebaseAuth } from './authService';

// Generalized Scan Record for both File and URL scans
export interface ScanRecord {
    id?: string;
    userId: string;
    type: 'file' | 'url';
    target: string;
    confidence: number;
    verdict: 'safe' | 'suspicious' | 'malicious';
    timestamp: Date;
    scanData: {
        engines?: number;
        detections?: number;
        anomalies?: string[];
        explanations?: string[];
        statistics?: Record<string, any>;
        fileInfo?: {
            name: string;
            size: number;
            hash: string;
            type: string;
            path?: string;
        };
        urlInfo?: {
            domain: string;
            protocol: string;
            path?: string;
            ip?: string;
            country?: string;
            server?: string;
            statusCode?: number;
        };
    };
    analysisFlow?: 'static_only' | 'static_then_dynamic' | 'dynamic_only';
    rawResults?: any;
    reportUrl?: string;
}

export type CreateScanRecord = Omit<ScanRecord, 'id' | 'timestamp' | 'userId'>

// Helper function to remove undefined values
const cleanUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => cleanUndefined(item));
    }

    const cleaned: any = {};
    for (const key in obj) {
        const value = obj[key];
        if (value !== undefined) {
            cleaned[key] = cleanUndefined(value);
        }
    }
    return cleaned;
};

class ScanHistoryService {
    private getScansCollection() {
        return collection(db, 'scans');
    }

    async saveScan(scanData: CreateScanRecord): Promise<string> {
        try {
            const user = firebaseAuth.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated - cannot save scan');
            }

            console.log('Saving scan for user:', user.uid);
            console.log('Scan data:', scanData);

            // Clean undefined values
            const cleanedData = cleanUndefined(scanData);

            // Normalize verdict
            let normalizedVerdict = cleanedData.verdict?.toLowerCase() || 'safe';
            if (normalizedVerdict === 'benign' || normalizedVerdict === 'clean') {
                normalizedVerdict = 'safe';
            }

            const now = new Date();
            const firestoreTimestamp = Timestamp.fromDate(now);

            const scanWithMetadata = {
                ...cleanedData,
                verdict: normalizedVerdict,
                userId: user.uid,
                timestamp: new Date(), // Use server timestamp for consistency
                createdAt: serverTimestamp(),
                dateString: now.toISOString().split('T')[0]
            };

            // Final clean
            console.log("before cleaning:",scanWithMetadata);
            
            const finalCleanData =scanWithMetadata;
            
            console.log("final clean data:", finalCleanData);

            const docRef = await addDoc(this.getScansCollection(), finalCleanData);
            console.log('Scan saved with ID:', docRef.id);

            await firebaseAuth.incrementScanCount(user.uid);

            return docRef.id;
        } catch (error) {
            console.error('Save scan error:', error);
            throw new Error(`Failed to save scan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getUserScans(limitCount: number = 50): Promise<ScanRecord[]> {
        try {
            const user = firebaseAuth.getCurrentUser();
            if (!user) {
                console.warn('No authenticated user');
                return [];
            }

            const q = query(
                this.getScansCollection(),
                where('userId', '==', user.uid),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const scans: ScanRecord[] = [];
            console.log('Scan data from Firestore:', scans);

            querySnapshot.forEach((doc) => {
                const data = doc.data();

                // Parse timestamp safely
                let timestamp: Date;

                if (data.timestamp?.toDate) {
                    timestamp = data.timestamp.toDate();
                } else if (data.createdAt?.toDate) {
                    timestamp = data.createdAt.toDate();
                } else if (data.timestamp instanceof Timestamp) {
                    timestamp = data.timestamp.toDate();
                } else {
                    timestamp = new Date();
                }

                // // Validate the date is valid
                // if (isNaN(timestamp.getTime())) {
                //     console.warn('Invalid timestamp for scan:', doc.id, timestampValue);
                //     timestamp = new Date(); // Fallback to current date
                // }

                scans.push({
                    id: doc.id,
                    userId: data.userId,
                    type: data.type,
                    target: data.target,
                    confidence: data.confidence,
                    verdict: data.verdict,
                    timestamp: timestamp,
                    scanData: data.scanData || {},
                    analysisFlow: data.analysisFlow,
                    rawResults: data.rawResults,
                    reportUrl: data.reportUrl
                });
            });

            console.log(`Retrieved ${scans.length} scans for user`);
            return scans;
        } catch (error) {
            console.error('Get scans error:', error);
            return [];
        }
    }

    async deleteScan(scanId: string): Promise<void> {
        try {
            const user = firebaseAuth.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            const scanRef = doc(db, 'scans', scanId);
            await deleteDoc(scanRef);
            console.log('Scan deleted:', scanId);
        } catch (error) {
            console.error('Delete scan error:', error);
            throw error;
        }
    }

    async getUserStats(): Promise<{
        totalScans: number;
        maliciousCount: number;
        suspiciousCount: number;
        safeCount: number;
        avgConfidence: number;
        lastScanDate: Date | null;
    }> {
        const scans = await this.getUserScans(1000);

        const maliciousCount = scans.filter(s => s.verdict === 'malicious').length;
        const suspiciousCount = scans.filter(s => s.verdict === 'suspicious').length;
        const safeCount = scans.filter(s => s.verdict === 'safe').length;
        const avgConfidence = scans.reduce((acc, s) => acc + s.confidence, 0) / (scans.length || 1);
        const lastScanDate = scans.length > 0 ? scans[0].timestamp : null;

        return {
            totalScans: scans.length,
            maliciousCount,
            suspiciousCount,
            safeCount,
            avgConfidence,
            lastScanDate
        };
    }

    async exportScans(): Promise<string> {
        const scans = await this.getUserScans(1000);
        const exportData = {
            exportedAt: new Date().toISOString(),
            userEmail: firebaseAuth.getCurrentUser()?.email,
            totalScans: scans.length,
            scans: scans.map(scan => ({
                ...scan,
                rawResults: undefined,
                timestamp: scan.timestamp.toISOString() // Convert Date to string for export
            }))
        };
        return JSON.stringify(exportData, null, 2);
    }
}

export const scanHistoryService = new ScanHistoryService();