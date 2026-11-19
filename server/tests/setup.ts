process.env.DATABASE_URL ??= 'postgresql://sweety:sweety_local_password@localhost:5432/sweety_test?schema=public';
process.env.JWT_SECRET ??= 'test-secret-at-least-thirty-two-characters-long';
process.env.CLIENT_ORIGIN ??= 'http://localhost:5173';
process.env.APP_TIME_ZONE ??= 'Asia/Kolkata';
process.env.NODE_ENV = 'test';
