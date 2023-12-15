import fsp from 'node:fs/promises'
import { addVitePlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import SvgLoader from 'vite-svg-loader'
import type { Config } from 'svgo'
import { extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'
import { debounce } from 'perfect-debounce'
import fg from 'fast-glob'
import { basename } from 'pathe'
import type { ClientFunctions, ServerFunctions, SvgFilesInfo } from './types'

interface SvgLoaderOptions {
  svgoConfig?: Config
  svgo?: boolean
  defaultImport?: 'url' | 'raw' | 'component'
}

const DEVTOOLS_CLIENT_PATH = '/__nuxt-svg-loader'

export default defineNuxtModule<SvgLoaderOptions>({
  meta: {
    name: 'nuxt-svg-loader',
    configKey: 'svgLoader',
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const { srcDir } = nuxt.options

    addVitePlugin(SvgLoader(options))

    if (nuxt.options.dev) {
      nuxt.hook('vite:serverCreated', async (server) => {
        const sirv = await import('sirv').then(r => r.default || r)

        server.middlewares.use(
          DEVTOOLS_CLIENT_PATH,
          sirv(resolve('./client'), {
            single: true,
            dev: true,
          }),
        )

        server.middlewares.use(`${'/__nuxt-svg-loader'}/svg`, async (req, res, next) => {
          if (!req.url)
            return next()

          if (req.url.endsWith('.svg')) {
            try {
              res.setHeader('Content-Type', 'image/svg+xml')
              res.end(await fsp.readFile(resolve(srcDir, req.url.slice(1)), 'utf-8'))
              return
            }
            catch (e) {}
          }

          next()
        })
      })

      nuxt.hook('devtools:customTabs', (tabs) => {
        tabs.push({
          title: 'Nuxt SVG Loader',
          name: 'nuxt-svg-loader',
          view: {
            type: 'iframe',
            src: DEVTOOLS_CLIENT_PATH,
          },
        })
      })

      onDevToolsInitialized(() => {
        const serverFunctions = {} as ServerFunctions
        const rpc = extendServerRpc<ClientFunctions, ServerFunctions>('NUXT_SVG_LOADER', serverFunctions)

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

          const files = await fg(['{assets,public}/**/*.svg'], {
            cwd: srcDir,
            onlyFiles: true,
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
  },
})
