import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function localFilesPlugin() {
  return {
    name: 'local-files-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api', (req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0] || '';
        
        if (req.method === 'POST' && url === '/save-download') {
          const rawFilename = req.headers['x-filename'] || `download_${Date.now()}`;
          const filename = decodeURIComponent(rawFilename as string);
          const dirPath = path.resolve(__dirname, 'downloads');
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          const safeFilename = path.basename(filename);
          const savePath = path.join(dirPath, safeFilename);
          
          const writeStream = fs.createWriteStream(savePath);
          req.pipe(writeStream);
          
          req.on('end', () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          });
          
          req.on('error', (err: any) => {
            console.error('Error saving file:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          });
        } else if (req.method === 'GET' && url === '/list-downloads') {
          const dirPath = path.resolve(__dirname, 'downloads');
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          const files = fs.readdirSync(dirPath).filter(f => !f.startsWith('.')).map(f => {
            const stats = fs.statSync(path.join(dirPath, f));
            return { name: f, size: stats.size, time: stats.mtimeMs };
          });
          files.sort((a, b) => b.time - a.time);
          
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ files }));
        } else if (req.method === 'GET' && url.startsWith('/download/')) {
          const filename = decodeURIComponent(url.replace('/download/', ''));
          const safeFilename = path.basename(filename);
          const filePath = path.resolve(__dirname, 'downloads', safeFilename);
          
          if (fs.existsSync(filePath)) {
            res.statusCode = 200;
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            fs.createReadStream(filePath).pipe(res);
          } else {
            res.statusCode = 404;
            res.end('File Not Found');
          }
        } else if (req.method === 'GET' && url === '/config') {
          const configPath = path.resolve(__dirname, 'user_config.json');
          if (fs.existsSync(configPath)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            fs.createReadStream(configPath).pipe(res);
          } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({}));
          }
        } else if (req.method === 'POST' && url === '/config') {
          const configPath = path.resolve(__dirname, 'user_config.json');
          const writeStream = fs.createWriteStream(configPath);
          req.pipe(writeStream);
          req.on('end', () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          });
          req.on('error', (err: any) => {
            console.error('Error saving config:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          });
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), localFilesPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.API_KEY),
        'process.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL),
        'process.env.MODEL_ID': JSON.stringify(env.MODEL_ID)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
