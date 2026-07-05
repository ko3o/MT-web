import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ftqyzxrvghfdspgjampd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_PRsJAks9Nw0fcT7Bvd0Y2Q_abzmKtne';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const app = express();
const PORT = 3000;

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CWD:', process.cwd());

app.use(express.json());

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });

  // API Routes with try...catch protection as requested
  app.get('/api/ping', (req, res) => {
    res.json({ pong: true });
  });

  // Google Supabase OAuth Callback Endpoint for popup communication
  app.get(['/auth/callback', '/auth/callback/'], (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>驗證中...</title>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #F5F2ED;
              color: #2C1810;
              text-align: center;
            }
            .spinner {
              width: 40px;
              height: 40px;
              border: 4px solid #5A5A40;
              border-top-color: transparent;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-bottom: 20px;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h2>帳號驗證中...</h2>
          <p>正在將您安全地引導回覓野茶官網，請勿關閉視窗。</p>
          <script>
            // Send OAuth hash parameters back to parent window
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS',
                hash: window.location.hash,
                search: window.location.search
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  });

  // Custom LINE Login Callback Endpoint
  app.get('/api/auth/line/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('LINE Login Callback Error:', error, error_description);
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>LINE 登入失敗</title>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #F5F2ED;
                color: #2C1810;
                text-align: center;
              }
              .error-box {
                background: white;
                padding: 30px;
                border-radius: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                max-width: 400px;
              }
              .btn {
                background: #2C1810;
                color: #F5F2ED;
                padding: 10px 20px;
                border-radius: 10px;
                text-decoration: none;
                display: inline-block;
                margin-top: 15px;
              }
            </style>
          </head>
          <body>
            <div class="error-box">
              <h2 style="color: #ef4444;">LINE 登入失敗</h2>
              <p>${error_description || error || '未知授權錯誤'}</p>
              <a href="javascript:window.close();" class="btn">關閉視窗</a>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_FAILURE', 
                  error: '${error_description || error || '未知授權錯誤'}' 
                }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
          </body>
        </html>
      `);
    }

    try {
      const host = req.get('host') || '';
      const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      const redirectUri = process.env.APP_URL 
        ? `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/line/callback`
        : `${protocol}://${host}/api/auth/line/callback`;

      console.log('Exchanging LINE code for tokens. Redirect URI:', redirectUri);

      // Exchange code for tokens
      const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri,
          client_id: '2010600801',
          client_secret: 'a182198730ad58dded47cc4dd412723c',
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`LINE Token Exchange Failed: ${errText}`);
      }

      const tokenData = await tokenResponse.json();
      const idToken = tokenData.id_token;

      if (!idToken) {
        throw new Error('LINE did not return an id_token JWT');
      }

      // Decode base64 payload from JWT id_token (Header.Payload.Signature)
      const payloadBase64 = idToken.split('.')[1];
      const payloadDecoded = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const userProfile = JSON.parse(payloadDecoded);

      const email = userProfile.email || `${userProfile.sub}@line.miye.com`;
      const name = userProfile.name || 'LINE 用戶';
      const picture = userProfile.picture || '';
      const lineId = userProfile.sub;

      console.log('Successfully decoded LINE user profile for sub:', lineId);

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>LINE 驗證成功</title>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #F5F2ED;
                color: #2C1810;
                text-align: center;
              }
              .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #06C755;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h2>LINE 驗證成功！</h2>
            <p>正在引導回覓野茶官網，請稍候...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'LINE_AUTH_SUCCESS',
                  email: '${email}',
                  name: '${name}',
                  picture: '${picture}',
                  lineId: '${lineId}'
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Error during LINE token exchange or decoding:', err);
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>LINE 登入錯誤</title>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #F5F2ED;
                color: #2C1810;
                text-align: center;
              }
              .error-box {
                background: white;
                padding: 30px;
                border-radius: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                max-width: 400px;
              }
              .btn {
                background: #2C1810;
                color: #F5F2ED;
                padding: 10px 20px;
                border-radius: 10px;
                text-decoration: none;
                display: inline-block;
                margin-top: 15px;
              }
            </style>
          </head>
          <body>
            <div class="error-box">
              <h2 style="color: #ef4444;">LINE 登入錯誤</h2>
              <p>${err.message || '無法完成 Token 交換'}</p>
              <a href="javascript:window.close();" class="btn">關閉視窗</a>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_FAILURE', 
                  error: '${err.message || '無法完成 Token 交換'}' 
                }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
          </body>
        </html>
      `);
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error('Server error fetching products:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.get('/api/products/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      if (!slug) return res.status(400).json({ error: 'Slug is required' });

      // Check if supabase is properly initialized
      if (!supabase) {
        console.error('Supabase client not initialized');
        return res.status(503).json({ error: 'Database service unavailable' });
      }

      // Use maybeSingle() to avoid throwing on 0 rows
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Database query failed' });
      }
      
      if (!data) {
        // Try case-insensitive search if exact match fails
        const { data: retryData, error: retryError } = await supabase
          .from('products')
          .select('*')
          .ilike('slug', slug)
          .maybeSingle();
        
        if (retryError) {
          console.error('Supabase retry error:', retryError);
          return res.status(500).json({ error: 'Database retry query failed' });
        }
        if (!retryData) return res.status(404).json({ error: 'Product not found' });
        return res.json(retryData);
      }
      
      res.json(data);
    } catch (error: any) {
      console.error(`Unexpected server error fetching product ${req.params.slug}:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/api/orders', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error('Server error fetching orders:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([req.body])
        .select();
      
      if (error) throw error;
      res.json(data[0]);
    } catch (error: any) {
      console.error('Server error creating product:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('products')
        .update(req.body)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      res.json(data[0]);
    } catch (error: any) {
      console.error(`Server error updating product ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Server error deleting product ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/products/bulk', async (req, res) => {
    try {
      const products = req.body;
      if (!Array.isArray(products)) return res.status(400).json({ error: 'Body must be an array' });

      const { data, error } = await supabase
        .from('products')
        .upsert(products, { onConflict: 'id' })
        .select();
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error('Server error bulk upserting products:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/orders/bulk', async (req, res) => {
    try {
      const orders = req.body;
      if (!Array.isArray(orders)) return res.status(400).json({ error: 'Body must be an array' });

      for (const orderData of orders) {
        const { items, ...orderInfo } = orderData;
        
        // Upsert order
        const { error: orderError } = await supabase
          .from('orders')
          .upsert(orderInfo, { onConflict: 'id' });
        
        if (orderError) throw orderError;

        if (items && Array.isArray(items)) {
          // Delete existing items
          await supabase.from('order_items').delete().eq('order_id', orderInfo.id);
          
          // Insert new items
          const orderItems = items.map((item: any) => {
            const baseName = item.product_name || item.name || '未知商品';
            const opt = item.selectedOption;
            const optLabel = typeof opt === 'object' && opt !== null ? opt.label : opt;
            const finalName = optLabel ? `${baseName} (${optLabel})` : baseName;
            return {
              product_id: item.product_id || item.id,
              product_name: finalName,
              price: item.price,
              quantity: item.quantity,
              order_id: orderInfo.id
            };
          });
          
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
          
          if (itemsError) throw itemsError;
        }
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Server error bulk upserting orders:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.put('/api/orders/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Server error updating order ${req.params.id} status:`, error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Settings API
  app.get('/api/settings', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'site_config')
        .maybeSingle();
      
      if (error) throw error;
      res.json(data?.value || null);
    } catch (error: any) {
      console.error('Server error fetching settings:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ 
          key: 'site_config', 
          value: req.body,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
        .select();
      
      if (error) throw error;
      res.json(data[0].value);
    } catch (error: any) {
      console.error('Server error updating settings:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Beginner Village Settings & Stats API
  app.get('/api/beginner-village', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'beginner_village')
        .maybeSingle();
      
      if (error) throw error;
      res.json(data?.value || null);
    } catch (error: any) {
      console.error('Server error fetching beginner village settings:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/beginner-village', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ 
          key: 'beginner_village', 
          value: req.body,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
        .select();
      
      if (error) throw error;
      res.json(data[0].value);
    } catch (error: any) {
      console.error('Server error updating beginner village settings:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.get('/api/beginner-village/stats', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'beginner_village_stats')
        .maybeSingle();
      
      if (error) throw error;
      res.json(data?.value || {});
    } catch (error: any) {
      console.error('Server error fetching beginner village stats:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/beginner-village/stats/clear', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ 
          key: 'beginner_village_stats', 
          value: {},
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
        .select();
      
      if (error) throw error;
      res.json(data?.[0]?.value || {});
    } catch (error: any) {
      console.error('Server error clearing beginner village stats:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/beginner-village/click', async (req, res) => {
    try {
      const { stageId, questionId, optionId } = req.body;
      if (!stageId || !questionId || !optionId) {
        return res.status(400).json({ error: 'stageId, questionId, and optionId are required' });
      }

      // Fetch current stats
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'beginner_village_stats')
        .maybeSingle();
      
      if (error) throw error;
      
      const stats = data?.value || {};
      
      // Update key path
      if (!stats[stageId]) stats[stageId] = {};
      if (!stats[stageId][questionId]) stats[stageId][questionId] = {};
      if (!stats[stageId][questionId][optionId]) stats[stageId][questionId][optionId] = 0;
      stats[stageId][questionId][optionId] += 1;

      const { data: upsertData, error: upsertError } = await supabase
        .from('settings')
        .upsert({ 
          key: 'beginner_village_stats', 
          value: stats,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
        .select();
      
      if (upsertError) throw upsertError;
      res.json(upsertData[0].value);
    } catch (error: any) {
      console.error('Server error updating beginner village option click:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
    
    // Serve raw source files for source maps in development
    app.use('/src', express.static(path.resolve(process.cwd(), 'src')));
    
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      const ext = path.extname(req.path);
      // Return 404 for missing static files, assets, or API resources in development
      if (ext || req.path.startsWith('/api/') || req.path.startsWith('/assets/')) {
        return res.status(404).send('Not Found');
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        
        // Inject runtime environment variables for Supabase Client
        const envScript = `
    <script>
      window.ENV = {
        VITE_SUPABASE_URL: "${process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''}",
        VITE_SUPABASE_ANON_KEY: "${process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || ''}"
      };
    </script>
`;
        template = template.replace('<head>', `<head>${envScript}`);
        
        // Dynamically inject image if requested
        const imgParam = req.query.img as string || req.query.image as string;
        if (imgParam) {
          const titleParam = req.query.title as string || "覓野茶 | 新手村尋茶之旅";
          const descParam = req.query.desc as string || "快來解鎖你的專屬尋茶基因並獲得限定大獎與優惠！";
          const metaTags = `
    <meta property="og:title" content="${titleParam}" />
    <meta property="og:description" content="${descParam}" />
    <meta property="og:image" content="${imgParam}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${imgParam}" />
`;
          template = template.replace('<head>', `<head>${metaTags}`);
        }

        res.status(200).set({
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      const ext = path.extname(req.path);
      // Return 404 for missing static files, assets, or API resources in production
      if (ext || req.path.startsWith('/api/') || req.path.startsWith('/assets/')) {
        return res.status(404).send('Not Found');
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const filePath = path.join(distPath, 'index.html');
      if (fs.existsSync(filePath)) {
        let template = fs.readFileSync(filePath, 'utf-8');
        
        // Inject runtime environment variables for Supabase Client
        const envScript = `
    <script>
      window.ENV = {
        VITE_SUPABASE_URL: "${process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''}",
        VITE_SUPABASE_ANON_KEY: "${process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || ''}"
      };
    </script>
`;
        template = template.replace('<head>', `<head>${envScript}`);
        
        const imgParam = req.query.img as string || req.query.image as string;
        if (imgParam) {
          const titleParam = req.query.title as string || "覓野茶 | 新手村尋茶之旅";
          const descParam = req.query.desc as string || "快來解鎖你的專屬尋茶基因並獲得限定大獎與優惠！";
          const metaTags = `
    <meta property="og:title" content="${titleParam}" />
    <meta property="og:description" content="${descParam}" />
    <meta property="og:image" content="${imgParam}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${imgParam}" />
`;
          template = template.replace('<head>', `<head>${metaTags}`);
        }
        res.status(200).set({
          'Content-Type': 'text/html'
        }).end(template);
      } else {
        res.sendFile(filePath);
      }
    });
  }

// Only listen on a port if not in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
