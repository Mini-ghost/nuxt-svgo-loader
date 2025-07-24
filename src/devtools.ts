import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'

import type { ClientFunctions, ServerFunctions, SvgFilesInfo } from './types'
import { existsSync } from 'node:fs'
import fsp from 'node:fs/promises'
import { extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'

import { basename } from 'pathe'
import { debounce } from 'perfect-debounce'
import { glob } from 'tinyglobby'

const DEVTOOLS_CLIENT_PATH = '/__nuxt-svgo-loader'
const DEVTOOLS_CLIENT_PORT = 3030

export function devtools(nuxt: Nuxt, resolve: Resolver['resolve']): void {
  const clientPath = resolve('./client')
  const isProductionBuild = existsSync(clientPath)

  const { srcDir } = nuxt.options

  if (isProductionBuild) {
    nuxt.hook('vite:serverCreated', async (server) => {
      const sirv = await import('sirv').then(r => r.default || r)

      server.middlewares.use(
        DEVTOOLS_CLIENT_PATH,
        sirv(resolve('./client'), {
          single: true,
          dev: true,
        }),
      )

      server.middlewares.use(`${DEVTOOLS_CLIENT_PATH}/svg`, async (req, res, next) => {
        if (!req.url)
          return next()

        if (req.url.endsWith('.svg')) {
          try {
            res.setHeader('Content-Type', 'image/svg+xml')
            res.end(await fsp.readFile(resolve(srcDir, req.url.slice(1)), 'utf-8'))
            return
          }
          catch {}
        }

        next()
      })
    })
  }
  else {
    nuxt.hook('vite:extendConfig', (config) => {
      config.server ||= {}
      config.server.proxy ||= {}
      config.server.proxy[`^${DEVTOOLS_CLIENT_PATH}/svg/.*`] = {
        target: `http://localhost:${DEVTOOLS_CLIENT_PORT}${DEVTOOLS_CLIENT_PATH}`,
        changeOrigin: true,
        followRedirects: true,
        configure(proxy) {
          proxy.on('proxyReq', async (_proxyReq, req, res) => {
            if (!req.url)
              return

            const path = req.url.slice(`${DEVTOOLS_CLIENT_PATH}/svg/`.length) ?? ''

            res.setHeader('Content-Type', 'image/svg+xml')
            res.end(await fsp.readFile(resolve(srcDir, path), 'utf-8'))
          })
        },
      }

      config.server.proxy[DEVTOOLS_CLIENT_PATH] = {
        target: `http://localhost:${DEVTOOLS_CLIENT_PORT}${DEVTOOLS_CLIENT_PATH}`,
        changeOrigin: true,
        followRedirects: true,
        rewrite: path => path.replace(DEVTOOLS_CLIENT_PATH, ''),
      }
    })
  }

  nuxt.hook('devtools:customTabs', (tabs) => {
    tabs.push({
      title: 'Nuxt SVG Loader',
      name: 'nuxt-svgo-loader',
      view: {
        type: 'iframe',
        src: DEVTOOLS_CLIENT_PATH,
      },
    })
  })

  onDevToolsInitialized(() => {
    const serverFunctions = {} as ServerFunctions
    const rpc = extendServerRpc<ClientFunctions, ServerFunctions>('NUXT_SVGO_LOADER', serverFunctions)

    let cache: SvgFilesInfo[] | null = null

    const refreshDebounced = debounce(() => {
      cache = null
      rpc.broadcast.refresh.asEvent('getStaticSvgFiles')
    }, 500)

    nuxt.hook('builder:watch', (event) => {
      if (event === 'add' || event === 'unlink')
        refreshDebounced()
    })

    async function scan() {
      if (cache)
        return cache

      const files = await glob(['**/*.svg'], {
        cwd: srcDir,
        onlyFiles: true,
        ignore: ['**/node_modules/**', '**/dist/**'],
      })

      cache = await Promise.all(
        files.map(async (path) => {
          const filePath = resolve(srcDir, path)
          const stat = await fsp.lstat(filePath)

          return {
            path,
            filePath,
            name: basename(path),
            size: stat.size,
            mtime: stat.mtimeMs,
          }
        }),
      )

      return cache
    }

    serverFunctions.getStaticSvgFiles = async () => {
      return await scan()
    }
  })
}
