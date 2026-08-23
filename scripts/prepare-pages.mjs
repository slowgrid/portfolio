import { readFile, writeFile } from 'node:fs/promises';

const repository = process.env.GITHUB_REPOSITORY;
const owner = process.env.GITHUB_REPOSITORY_OWNER;

if (!repository || !owner) {
  throw new Error('GITHUB_REPOSITORY and GITHUB_REPOSITORY_OWNER are required.');
}

const repositoryName = repository.split('/')[1];
const isUserSite = repositoryName.toLowerCase() === `${owner}.github.io`.toLowerCase();
const siteUrl = isUserSite
  ? `https://${owner}.github.io`
  : `https://${owner}.github.io/${repositoryName}`;
const imageUrl = `${siteUrl}/og.png`;
const outputPath = new URL('../dist/index.html', import.meta.url);

let html = await readFile(outputPath, 'utf8');
html = html
  .replace(/(<meta\s+property="og:image"\s+content=")[^"]*("\s*\/?>)/, `$1${imageUrl}$2`)
  .replace(/(<meta\s+name="twitter:image"\s+content=")[^"]*("\s*\/?>)/, `$1${imageUrl}$2`);

await writeFile(outputPath, html);
console.log(`GitHub Pages metadata prepared for ${siteUrl}`);
