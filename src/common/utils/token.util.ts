import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

/**
 * Generate a random token string (useful for password reset, email verification, etc.)
 */
export const generateRandomToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a plain token using bcrypt (useful for storing refresh tokens in DB)
 */
export const hashToken = async (token: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(token, salt);
};

/**
 * Compare a plain token with a hashed token
 */
export const compareToken = async (
  token: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(token, hash);
};

/**
 * Generate a random numeric OTP (One Time Password)
 */
export const generateNumericOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Hash an OTP using bcrypt (for securely storing OTPs in database)
 */
export const hashOTP = async (otp: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

/**
 * Compare a plain OTP with a hashed OTP
 */
export const compareOTP = async (
  otp: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(otp, hash);
};

/**
 * Sign a JSON Web Token (JWT)
 */
export const signJwt = (
  payload: string | object | Buffer,
  secret: string = process.env.JWT_SECRET || 'defaultSecret',
  options?: jwt.SignOptions,
): string => {
  return jwt.sign(payload, secret, options);
};

/**
 * Verify a JSON Web Token (JWT)
 */
export const verifyJwt = <T>(
  token: string,
  secret: string = process.env.JWT_SECRET || 'defaultSecret',
  options?: jwt.VerifyOptions,
): T => {
  return jwt.verify(token, secret, options) as T;
};
