import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Custom plugin to serve token service files
const tokenServicePlugin = () => {
  return {
    name: 'token-service-files',
    configureServer(server: any) {
      // Handle file reading (GET requests)
      server.middlewares.use('/packages/token-service/data', (req: any, res: any, next: any) => {
        if (req.method === 'GET') {
          const filePath = req.url.replace(/^\//, '') // Remove leading slash
          const fullPath = path.resolve(__dirname, '../token-service/data', filePath)

          try {
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
              const content = fs.readFileSync(fullPath, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.end(content)
            } else {
              res.statusCode = 404
              res.end('File not found')
            }
          } catch (error) {
            res.statusCode = 500
            res.end('Server error')
          }
        } else {
          next()
        }
      })

      // Handle API requests for token operations
      server.middlewares.use('/api/tokens', (req: any, res: any, next: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          res.end()
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => {
            body += chunk.toString()
          })
          
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              
              if (req.url === '/polar-verified') {
                // Add to polar verified list
                const polarPath = path.resolve(__dirname, '../token-service/data/polar-verified.json')
                let polarTokens = []
                
                if (fs.existsSync(polarPath)) {
                  polarTokens = JSON.parse(fs.readFileSync(polarPath, 'utf-8'))
                }
                
                // Check if token already exists
                const exists = polarTokens.some((t: any) => t.coinType === data.coinType)
                if (!exists) {
                  polarTokens.push(data)
                  fs.writeFileSync(polarPath, JSON.stringify(polarTokens, null, 2))
                }
                
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(JSON.stringify({ success: true, data }))
                
              } else if (req.url === '/strict-tokens') {
                // Add to strict tokens list
                const strictPath = path.resolve(__dirname, '../token-service/data/strict-tokens.json')
                let strictTokens = []
                
                if (fs.existsSync(strictPath)) {
                  strictTokens = JSON.parse(fs.readFileSync(strictPath, 'utf-8'))
                }
                
                // Check if token already exists
                const exists = strictTokens.some((t: any) => t.coinType === data.coinType)
                if (!exists) {
                  strictTokens.push(data)
                  fs.writeFileSync(strictPath, JSON.stringify(strictTokens, null, 2))
                }
                
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(JSON.stringify({ success: true, data }))
                
              } else {
                res.statusCode = 404
                res.end('Not found')
              }
            } catch (error) {
              res.statusCode = 500
              res.end(JSON.stringify({ success: false, error: 'Server error' }))
            }
          })
        } else {
          next()
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tokenServicePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@polar/shared': path.resolve(__dirname, '../../shared'),
    },
  },
  server: {
    port: 3000,
    host: true,
    fs: {
      // Allow serving files from parent directories
      allow: ['..']
    }
  },
})
