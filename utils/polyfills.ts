// Polyfill for base64 functions to fix compatibility with music-metadata
// React Native's built-in atob/btoa have issues with certain encodings

import { decode, encode } from 'base-64';

// More robust base64 decode that handles edge cases
function safeAtob(input: string): string {
    // Clean the input - remove any characters that aren't valid base64
    const cleanInput = input.replace(/[^A-Za-z0-9+/=]/g, '');

    // Add padding if needed
    const padded = cleanInput.padEnd(
        cleanInput.length + (4 - (cleanInput.length % 4)) % 4,
        '='
    );

    try {
        return decode(padded);
    } catch {
        // If still failing, try the original input with decode
        try {
            return decode(input);
        } catch {
            // Last resort: return empty string instead of crashing
            console.warn('[Polyfill] Could not decode base64 string');
            return '';
        }
    }
}

// More robust base64 encode
function safeBtoa(input: string): string {
    try {
        return encode(input);
    } catch {
        console.warn('[Polyfill] Could not encode string to base64');
        return '';
    }
}

// Override global atob and btoa with robust implementations
global.atob = safeAtob;
global.btoa = safeBtoa;

export { };
