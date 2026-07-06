import crypto from 'crypto';
import { env } from '../config/env';

// We use a 32-byte key for AES-256
// If JWT_SECRET is present, we use a hash of it, otherwise fallback to a default secure buffer.
// In production, JWT_SECRET is provided and highly secure.
const ENCRYPTION_KEY = crypto.scryptSync(env.JWT_SECRET || 'fallback-encryption-key-dev', 'salt', 32);
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Format: iv:encryptedData
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  if (!text) return text;
  
  const textParts = text.split(':');
  if (textParts.length !== 2) {
    // If it's not in the format iv:encrypted, we assume it's legacy unencrypted or corrupted.
    return text;
  }
  
  try {
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    // If decryption fails, return original or empty
    return '';
  }
}
