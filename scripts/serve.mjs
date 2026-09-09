import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.json':'application/json','.png':'image/png','.webp':'image/webp'};
const port=Number(process.env.OKASHI_PORT||8080);
http.createServer(async(req,res)=>{
  try{
    let requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(requestPath.endsWith('/'))requestPath+='index.html';
    const file=path.resolve(root,'.'+requestPath);
    if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden');}
    const data=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('ファイルが見つかりません');}
}).listen(port,'0.0.0.0',()=>console.log(`おかしのおうち: http://localhost:${port}\n終了: Ctrl+C`));
