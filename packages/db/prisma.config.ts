import { defineConfig } from 'prisma/config';
import 'dotenv/config'; // <--- This is crucial to load the .env file

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // This ensures the URL is read from the loaded environment variables
    url: process.env.DATABASE_URL ?? "",
  },
});