import FingerprintJS from '@fingerprintjs/fingerprintjs';
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const VOTE_COOKIE_NAME = 'vote_session';
const VOTE_COOKIE_EXPIRY = 365; // jours

interface FingerprintResult {
    visitorId: string;
    components: {
        [key: string]: any;
    };
}

export class AdvancedFingerprint {
    private static instance: AdvancedFingerprint;
    private fingerprintJS: any;
    private cachedFingerprint: FingerprintResult | null = null;

    private constructor() {}

    public static async getInstance(): Promise<AdvancedFingerprint> {
        if (!AdvancedFingerprint.instance) {
            AdvancedFingerprint.instance = new AdvancedFingerprint();
            await AdvancedFingerprint.instance.initialize();
        }
        return AdvancedFingerprint.instance;
    }

    private async initialize() {
        if (!this.fingerprintJS) {
            // Charger l'instance de base
            this.fingerprintJS = await FingerprintJS.load();
            
            // Surcharger la méthode get pour filtrer les composants
            const originalGet = this.fingerprintJS.get.bind(this.fingerprintJS);
            this.fingerprintJS.get = async () => {
                const result = await originalGet();
                // Sélectionner uniquement les composants stables
                const stableComponents = {
                    screenResolution: result.components.screenResolution,
                    hardwareConcurrency: result.components.hardwareConcurrency,
                    deviceMemory: result.components.deviceMemory,
                    colorDepth: result.components.colorDepth,
                    timezone: result.components.timezone,
                    platform: result.components.platform,
                    webgl: result.components.webgl,
                    canvas: result.components.canvas,
                    audio: result.components.audio
                };
                return {
                    visitorId: result.visitorId,
                    components: stableComponents
                };
            };
        }
    }

    public static async get(): Promise<FingerprintResult> {
        const instance = await AdvancedFingerprint.getInstance();
        return await instance.getFingerprint();
    }

    private async getFingerprint(): Promise<FingerprintResult> {
        if (this.cachedFingerprint) {
            return this.cachedFingerprint;
        }

        try {
            const result = await this.fingerprintJS.get();
            this.cachedFingerprint = result;
            return result;
        } catch (error) {
            return {
                visitorId: 'unknown',
                components: {
                    screenResolution: 'unknown',
                    hardwareConcurrency: 'unknown',
                    deviceMemory: 'unknown',
                    colorDepth: 'unknown',
                    timezone: 'unknown',
                    platform: 'unknown',
                    webgl: 'unknown',
                    canvas: 'unknown',
                    audio: 'unknown'
                }
            };
        }
    }

    public async validateFingerprint(): Promise<boolean> {
        const currentFingerprint = await this.getFingerprint();
        
        const localStorage = window.localStorage.getItem('device_fingerprint');
        const sessionStorage = window.sessionStorage.getItem('device_fingerprint');
        const cookie = document.cookie.split(';').find(c => c.trim().startsWith('device_fingerprint='));
        
        if (localStorage && localStorage !== currentFingerprint.visitorId) return false;
        if (sessionStorage && sessionStorage !== currentFingerprint.visitorId) return false;
        if (cookie && cookie.split('=')[1] !== currentFingerprint.visitorId) return false;

        return true;
    }

    private storeFingerprint(fingerprint: string): void {
        localStorage.setItem('device_fingerprint', fingerprint);
        sessionStorage.setItem('device_fingerprint', fingerprint);
        document.cookie = `device_fingerprint=${fingerprint};max-age=31536000;path=/`;

        const request = indexedDB.open('FingerprintDB', 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('fingerprints')) {
                db.createObjectStore('fingerprints', { keyPath: 'id' });
            }
        };
        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['fingerprints'], 'readwrite');
            const store = transaction.objectStore('fingerprints');
            store.put({ id: 1, fingerprint });
        };
    }
}

export async function generateVoteFingerprint(pollId: string): Promise<string> {
    try {
        const fingerprint = await AdvancedFingerprint.get();
        
        // Utiliser uniquement les composants stables du fingerprint
        const stableComponents = {
            screenResolution: fingerprint.components.screenResolution,
            hardwareConcurrency: fingerprint.components.hardwareConcurrency,
            deviceMemory: fingerprint.components.deviceMemory,
            colorDepth: fingerprint.components.colorDepth,
            platform: fingerprint.components.platform,
            webgl: fingerprint.components.webgl,
            canvas: fingerprint.components.canvas,
            audio: fingerprint.components.audio,
            deviceId: fingerprint.visitorId // Utiliser le visitorId comme deviceId
        };

        // Créer l'objet fingerprint au format attendu par le backend
        const fingerprintData = {
            components: stableComponents,
            pollId: pollId
        };

        // Retourner le fingerprint au format JSON
        return JSON.stringify(fingerprintData);
    } catch (error) {
        return JSON.stringify({
            components: {
                deviceId: 'unknown',
                hardwareConcurrency: 'unknown',
                deviceMemory: 'unknown',
                platform: 'unknown',
                canvasRendering: 'unknown',
            },
            pollId: pollId
        });
    }
}

export function hasVotedForPoll(pollId: string): boolean {
    return !!Cookies.get(`${VOTE_COOKIE_NAME}_${pollId}`);
}

export function markPollAsVoted(pollId: string): void {
    Cookies.set(`${VOTE_COOKIE_NAME}_${pollId}`, 'true', { expires: VOTE_COOKIE_EXPIRY });
}

export function getVoteHistory(pollId: string): string | null {
    const value = Cookies.get(`${VOTE_COOKIE_NAME}_${pollId}`);
    return value ?? null;
}

export function clearVoteHistory(pollId: string): void {
    Cookies.remove(`${VOTE_COOKIE_NAME}_${pollId}`);
}

export function getAllVoteHistory(): { [pollId: string]: string } {
    const voteHistory: { [pollId: string]: string } = {};
    const cookies = document.cookie.split(';');
    cookies.forEach((cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key.startsWith(`${VOTE_COOKIE_NAME}_`)) {
            voteHistory[key.substring(VOTE_COOKIE_NAME.length + 1)] = value;
        }
    });
    return voteHistory;
}

export function clearAllVoteHistory(): void {
    const cookies = document.cookie.split(';');
    cookies.forEach((cookie) => {
        const key = cookie.trim().split('=')[0];
        if (key.startsWith(`${VOTE_COOKIE_NAME}_`)) {
            Cookies.remove(key);
        }
    });
}
