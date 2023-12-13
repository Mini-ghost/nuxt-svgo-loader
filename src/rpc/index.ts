import fsp from 'node:fs/promises'
import type { Nuxt } from 'nuxt/schema'

import type { WebSocket } from 'ws'
import type { ChannelOptions } from 'birpc'
import type { Plugin } from 'vite'
import fg from 'fast-glob'
import { basename, resolve } from 'pathe'
import { parse, stringify } from 'flatted'
import { createBirpcGroup } from 'birpc'
import { logger } from '@nuxt/kit'
import { colors } from 'consola/utils'
import { debounce } from 'perfect-debounce'
import type { ClientFunctions, ServerFunctions, SvgFilesInfo } from '../types'

const WS_EVENT_NAME = 'nuxt-svg-loader:devtools:rpc'

export function setupRPC(nuxt: Nuxt) {
  const serverFunctions = {} as ServerFunctions
  const extendedRpcMap = new Map<string, any>()
  const rpc = createBirpcGroup<ClientFunctions, ServerFunctions>(serverFunctions, [], {
    resolver(name, fn) {
      if (fn)
        return fn

      if (!name.includes(':'))
        return

      const [namespace, fnName] = name.split(':')
      return extendedRpcMap.get(namespace)?.[fnName]
    },
    onError(error, name) {
      logger.error(
        colors.yellow(`[nuxt-devtools] RPC error on executing "${colors.bold(name)}":\n`)
        + colors.red(error?.message || ''),
      )
    },
    timeout: 120_000,
  })

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

    const { srcDir } = nuxt.options

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

  Object.assign(serverFunctions, {
    async getStaticSvgFiles() {
      return await scan()
    },
  })

  const wsClients = new Set<WebSocket>()

  const vitePlugin: Plugin = {
    name: 'nuxt-svg-loader:rpc',
    configureServer(server) {
      server.ws.on('connection', (ws) => {
        wsClients.add(ws)
        const channel: ChannelOptions = {
          post: d =>
            ws.send(
              JSON.stringify({
                type: 'custom',
                event: WS_EVENT_NAME,
                data: d,
              }),
            ),
          on(fn) {
            ws.on('message', (e) => {
              try {
                const data = JSON.parse(String(e)) || {}
                if (data.type === 'custom' && data.event === WS_EVENT_NAME)
                  fn(data.data)
              }
              catch {}
            })
          },
          serialize: stringify,
          deserialize: parse,
        }
        rpc.updateChannels((c) => {
          c.push(channel)
        })
        ws.on('close', () => {
          wsClients.delete(ws)
          rpc.updateChannels((c) => {
            const index = c.indexOf(channel)
            if (index >= 0)
              c.splice(index, 1)
          })
        })
      })
    },
  }

  return vitePlugin
}
