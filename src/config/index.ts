import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  ip_address: process.env.IP_ADDRESS!,
  jwt_secret: process.env.JWT_SECRET!,
  jwt_expire: process.env.JWT_EXPIRE_IN!,
  bcrypt_sart_rounds: process.env.BCRYPT_SALT_ROUNDS!,
  firebase_service_account_key: process.env.FIREBASE_BASS_64,
  node_env: process.env.NODE_ENV,
  email_user: process.env.EMAIL_USER,
  email_pass: process.env.EMAIL_PASS,
  email_host: process.env.EMAIL_HOST,
  email_port: process.env.EMAIL_PORT,
  email_from: process.env.EMAIL_FROM,
  db_url: process.env.DATABASE_URL,
  db_name: process.env.DB_NAME,
  port: process.env.PORT || 7003,
  origin: process.env.ORIGIN || "*",
  super_user_email: process.env.SUPER_USER_EMAIL,
  super_user_password: process.env.SUPER_USER_PASSWORD,
  strip_public_key: process.env.STRIP_PUBLIC_KEY,
  strip_secret_key: process.env.STRIP_SECRET_KEY,
  database_user_name: process.env.MONGODB_ADMINUSERNAME!,
  database_user_password: process.env.MONGODB_ADMINPASSWORD!,
  database_name: process.env.DATABASE_NAME!,
  database_port: process.env.MONGODB_PORT!,
};
