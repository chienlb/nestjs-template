export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '123456',
    database: process.env.POSTGRES_DB || 'nestjs_template',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'defaultSecret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  r2: {
    accountId:
      process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '',
    accessKeyId:
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
      process.env.R2_ACCESS_KEY_ID ||
      '',
    secretAccessKey:
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET_ACCESS_KEY ||
      '',
    bucketName:
      process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.R2_BUCKET || '',
    publicUrl:
      process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.R2_PUBLIC_BASE || '',
  },
  mail: {
    host:
      process.env.MAIL_HOST ||
      (process.env.EMAIL_USER?.includes('gmail')
        ? 'smtp.gmail.com'
        : 'smtp.example.com'),
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    user: process.env.MAIL_USER || process.env.EMAIL_USER || '',
    pass: process.env.MAIL_PASS || process.env.EMAIL_PASS || '',
    from:
      process.env.MAIL_FROM ||
      `"${process.env.EMAIL_USER || 'NestJS Template'}" <${process.env.MAIL_USER || process.env.EMAIL_USER || 'noreply@example.com'}>`,
  },
  security: {
    corsOrigins: (process.env.CORS_ORIGINS || '*').split(','),
    csrfSecret: process.env.CSRF_SECRET || 'csrf-super-secret-key-change-me',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  },
});
