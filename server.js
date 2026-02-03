import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import handler from './api/mensajes.js';
import chatHandler from './api/chat.js';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = http.createServer(async (req, res) => {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Rutas API
  if (req.url === '/api/mensajes' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      req.body = body ? JSON.parse(body) : {};
      await handler(req, res);
    });
    return;
  }

  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      req.body = body ? JSON.parse(body) : {};
      await chatHandler(req, res);
    });
    return;
  }

  // Servir archivos estáticos
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
    res.writeHead(200);
    res.end(data);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
