import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Output directory can be customized via OUTPUT_DIR environment variable
const outputDir = process.env.OUTPUT_DIR || join(projectRoot, 'outputs');
const outputFile = join(outputDir, 'server.js');

// Build configuration - single bundle with all code
console.log(`📦 Building server...`);
console.log(`   Output: ${outputFile}`);

await build({
  entryPoints: [join(projectRoot, 'sources/server.ts')],
  outfile: outputFile,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: true,
  minify: false,
  // Bundle all npm dependencies but keep Node.js built-ins external
  external: [
    'node:*',
  ],
  banner: {
    js: `import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);`,
  },
});

console.log(`   ✅ server built successfully at ${outputFile}`);

console.log('\n✨ All builds completed successfully!');
