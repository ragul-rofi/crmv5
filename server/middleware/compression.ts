import { Request, Response, NextFunction } from 'express';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

export const responseCompression = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    if (acceptEncoding.includes('gzip') && 
        typeof data === 'string' && 
        data.length > 1024) {
      
      gzipAsync(Buffer.from(data)).then(compressed => {
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Length', compressed.length);
        originalSend.call(this, compressed);
      }).catch(() => {
        originalSend.call(this, data);
      });
    } else {
      originalSend.call(this, data);
    }
    
    return this;
  };
  
  next();
};

export const cacheHeaders = (maxAge: number = 3600) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    res.setHeader('ETag', `"${Date.now()}"`);
    next();
  };
};