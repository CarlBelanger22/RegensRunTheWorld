import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const FILENAME_RE = /^rrtw-backup-\d{4}-\d{2}-\d{2}\.json$/

/**
 * Dev-only: POST /__rrtw/save-backup writes Export JSON into workspace backups/.
 */
export function rrtwBackupPlugin(): Plugin {
  return {
    name: 'rrtw-save-backup',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/__rrtw/save-backup') {
          next()
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })
        req.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
              filename?: string
              backup?: unknown
            }
            const filename = body.filename
            if (typeof filename !== 'string' || !FILENAME_RE.test(filename)) {
              res.statusCode = 400
              res.end('Invalid filename')
              return
            }
            if (body.backup == null || typeof body.backup !== 'object') {
              res.statusCode = 400
              res.end('Missing backup object')
              return
            }

            const dir = path.resolve(server.config.root, 'backups')
            fs.mkdirSync(dir, { recursive: true })

            for (const entry of fs.readdirSync(dir)) {
              if (FILENAME_RE.test(entry) && entry !== filename) {
                fs.unlinkSync(path.join(dir, entry))
              }
            }

            const target = path.join(dir, filename)
            fs.writeFileSync(
              target,
              `${JSON.stringify(body.backup, null, 2)}\n`,
              'utf8',
            )

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, path: `backups/${filename}` }))
          } catch (error) {
            res.statusCode = 500
            res.end(
              error instanceof Error ? error.message : 'Failed to save backup',
            )
          }
        })
      })
    },
  }
}
