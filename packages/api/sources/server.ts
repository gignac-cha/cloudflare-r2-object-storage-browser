import { createApp } from './application.ts';
import { options } from './options.ts';

const start = async () => {
  try {
    const server = await createApp();

    await server.listen({
      port: options.server.port,
      host: options.server.host,
    });

    const address = server.addresses()[0];
    const port = typeof address === 'object' && address !== null ? address.port : 3000;

    console.log(`Server is running on http://${options.server.host}:${port}`);
    console.log(`PORT=${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
