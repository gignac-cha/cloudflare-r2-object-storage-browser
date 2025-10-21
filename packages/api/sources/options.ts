import dotenv from 'dotenv';
import { join } from 'node:path';

// Try to load from config file first, then fall back to .env
interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
}

function loadR2Config(): R2Config {
  // First priority: Command-line arguments (passed by macOS app)
  const args = process.argv.slice(2);
  const argConfig: Partial<R2Config> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--account-id' && args[i + 1]) {
      argConfig.accountId = args[i + 1];
      i++;
    } else if (args[i] === '--access-key-id' && args[i + 1]) {
      argConfig.accessKeyId = args[i + 1];
      i++;
    } else if (args[i] === '--secret-access-key' && args[i + 1]) {
      argConfig.secretAccessKey = args[i + 1];
      i++;
    } else if (args[i] === '--endpoint' && args[i + 1]) {
      argConfig.endpoint = args[i + 1];
      i++;
    }
  }

  if (argConfig.accessKeyId && argConfig.secretAccessKey && argConfig.endpoint) {
    console.log('✓ Loaded R2 credentials from command-line arguments');
    return {
      accountId: argConfig.accountId ?? '',
      accessKeyId: argConfig.accessKeyId,
      secretAccessKey: argConfig.secretAccessKey,
      endpoint: argConfig.endpoint,
    };
  }

  // Second priority: Environment variables (for direct execution)
  if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ENDPOINT) {
    console.log('✓ Loaded R2 credentials from environment variables');
    return {
      accountId: process.env.R2_ACCOUNT_ID ?? '',
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      endpoint: process.env.R2_ENDPOINT,
    };
  }

  // Third priority: .env file (for development)
  // Try multiple possible .env locations for bundled vs development environments
  const possibleEnvPaths = [
    join(process.cwd(), '.env'),
    join(process.cwd(), '../../.env'),
    join(process.cwd(), '../../../.env'),
  ];

  for (const envPath of possibleEnvPaths) {
    dotenv.config({ path: envPath });
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ENDPOINT) {
      break;
    }
  }

  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (endpoint && accessKeyId && secretAccessKey) {
    console.log('✓ Loaded R2 credentials from .env file');
    return {
      accountId: process.env.R2_ACCOUNT_ID ?? '',
      accessKeyId,
      secretAccessKey,
      endpoint,
    };
  }

  // No credentials found
  throw new Error(
    'Missing R2 credentials.\n' +
    'Please configure credentials using one of these methods:\n' +
    '1. Command-line arguments: --account-id <id> --access-key-id <key> --secret-access-key <secret> --endpoint <url>\n' +
    '2. Environment variables: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT\n' +
    '3. Create a .env file in the project root with the above variables'
  );
}

const r2Config = loadR2Config();

export const options = {
  r2: {
    endpoint: r2Config.endpoint,
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
  server: {
    port: 0, // Random port
    host: '127.0.0.1',
  },
  app: {
    name: 'Cloudflare R2 Object Storage Browser API',
    version: '1.0.0',
  },
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') ?? [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:5173', // Vite dev server for Electron app
    ],
  },
} as const;
