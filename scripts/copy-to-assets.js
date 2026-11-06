import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceDir = path.join(rootDir, 'dist');
const targetDir = path.join(rootDir, 'app', 'src', 'main', 'assets', 'www');

if (!fs.existsSync(sourceDir)) {
  console.error(`[AutoPin Pro] Source directory not found: ${sourceDir}. Running build first.`);
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy dist into target directory safely (cross-platform Windows CMD, PowerShell, Linux, macOS)
fs.cpSync(sourceDir, targetDir, {
  recursive: true,
  force: true,
});

console.log(`[AutoPin Pro] Successfully copied build assets to ${targetDir}`);
