import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

async function readEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const env = {};

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const equalsIndex = line.indexOf('=');
      if (equalsIndex === -1) continue;

      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }

    return env;
  } catch {
    return {};
  }
}

async function copyFileIfExists(source, destination) {
  try {
    await fs.copyFile(source, destination);
  } catch {
    await fs.writeFile(destination, '', 'utf8');
  }
}

async function main() {
  const resolvedDist = path.resolve(distDir);
  if (!resolvedDist.startsWith(path.resolve(rootDir))) {
    throw new Error('Refusing to write outside the workspace');
  }

  await fs.mkdir(resolvedDist, { recursive: true });

  const fileEnv = {
    ...(await readEnvFile(path.join(rootDir, '.env'))),
    ...(await readEnvFile(path.join(rootDir, '.env.local'))),
  };
  const runtimeEnv = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  };
  const env = {
    ...fileEnv,
    ...Object.fromEntries(Object.entries(runtimeEnv).filter(([, value]) => typeof value === 'string' && value.length > 0)),
  };

  const html = await fs.readFile(path.join(rootDir, 'index.html'), 'utf8');
  const envScript = `<script>window.process=window.process||{env:{}};window.process.env=Object.assign(window.process.env||{},${JSON.stringify(env).replace(/</g, '\\u003c')});</script>`;
  const outputHtml = html.replace('/index.tsx', '/index.js');
  const finalHtml = outputHtml.replace('</head>', `${envScript}\n</head>`);
  await fs.writeFile(path.join(resolvedDist, 'index.html'), finalHtml, 'utf8');

  await copyFileIfExists(
    path.join(rootDir, 'index.css'),
    path.join(resolvedDist, 'index.css')
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
