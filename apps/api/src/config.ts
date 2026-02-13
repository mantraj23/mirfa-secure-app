import dotenv from 'dotenv';

dotenv.config();

export const MASTER_KEY = process.env.MASTER_KEY;
export const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

if (!MASTER_KEY || MASTER_KEY.length !== 64) {
  console.error("\n❌ CRITICAL ERROR: MASTER_KEY invalid");
  process.exit(1);
}
