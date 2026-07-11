import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'default-32-byte-secret-key-123456'; // Must be 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypt a plain text string
 * Useful for encrypting API Keys, Bank Accounts, or private data before saving to DB
 */
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypt an encrypted string
 */
export const decrypt = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
