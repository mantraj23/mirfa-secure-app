import { buildServer } from './server.js';
console.log("MASTER_KEY length:", process.env.MASTER_KEY?.length);

const start = async () => {
  const app = await buildServer();

  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('✅ API running on http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
