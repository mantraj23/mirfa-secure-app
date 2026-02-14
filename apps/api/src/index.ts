import { buildServer } from './server.js';

const start = async () => {
  const app = await buildServer();
  const port = Number(process.env.PORT) || 3001;
  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`✅ API running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
