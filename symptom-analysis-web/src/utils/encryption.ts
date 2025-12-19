import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';

// In a real app, this key should be an env variable.
// For this standalone client-side demo, we'll use a hardcoded fallback or generated key.
const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "nidan-secure-key-v1";

export const encryptData = (data: any): string => {
    try {
        const jsonString = JSON.stringify(data);
        return AES.encrypt(jsonString, SECRET_KEY).toString();
    } catch (error) {
        console.error("Encryption failed:", error);
        return "";
    }
};

export const decryptData = <T>(ciphertext: string): T | null => {
    try {
        if (!ciphertext) return null;
        const bytes = AES.decrypt(ciphertext, SECRET_KEY);
        const decryptedString = bytes.toString(encUtf8);
        return JSON.parse(decryptedString) as T;
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
};
