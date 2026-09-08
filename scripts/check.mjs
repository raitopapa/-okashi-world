import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
const files=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);e.isDirectory()?walk(p):files.push(p);}}walk(dist);
const errors=[];
for(const file of files){
  if(file.endsWith('.js')){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0)errors.push(result.stderr);}
  if(file.endsWith('.html')||file.endsWith('.css')||file.endsWith('.js')){
    const text=fs.readFileSync(file,'utf8');const refs=[...text.matchAll(/(?:src|href)=["']([^"']+)["']|(?:from\s*|import\s*)["'](\.[^"']+)["']|url\(["']?(\.[^)'" ]+)/g)].map(m=>m[1]||m[2]||m[3]);
    for(const ref of refs){if(ref.includes('${')||ref.startsWith('#')||ref.startsWith('data:'))continue;if(/^https?:/.test(ref)){errors.push(`External dependency: ${ref}`);continue;}if(!fs.existsSync(path.resolve(path.dirname(file),ref)))errors.push(`Missing: ${file} → ${ref}`);}
  }
}
const manifest=JSON.parse(fs.readFileSync(path.join(dist,'manifest.webmanifest'),'utf8'));
for(const icon of manifest.icons)if(!fs.existsSync(path.join(dist,icon.src)))errors.push(`Missing icon: ${icon.src}`);
for(const required of ['index.html','sw.js','js/art.js','assets/garden.webp','assets/parts.png'])if(!fs.existsSync(path.join(dist,required)))errors.push(`Missing: ${required}`);
const bytes=files.reduce((sum,f)=>sum+fs.statSync(f).size,0);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`✓ JavaScript syntax, local references, PWA manifest: ${files.length} files, ${(bytes/1024/1024).toFixed(2)} MiB`);
