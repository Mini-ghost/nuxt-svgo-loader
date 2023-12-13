import { createBirpc } from 'birpc'
import { parse, stringify } from 'flatted'
import { tryCreateHotContext } from 'vite-hot-client'
import type { ClientFunctions, ServerFunctions } from '../../src/types'

const WS_EVENT_NAME = 'nuxt-svg-loader:devtools:rpc'

export const wsConnecting = ref(false)
export const wsError = ref<any>()
export const wsConnectingDebounced = useDebounce(wsConnecting, 2000)

const connectPromise = connectVite()
let onMessage: any = () => {}

export const clientFunctions = {
  // will be added in app.vue
} as ClientFunctions

export const extendedRpcMap = new Map<string, any>()

export const rpc = createBirpc<ServerFunctions, ClientFunctions>(clientFunctions, {
  async post(d) {
    (await connectPromise).send(WS_EVENT_NAME, d)
  },
  on(fn) {
    onMessage = fn
  },
  serialize: stringify,
  deserialize: parse,
  resolver(name, fn) {
    if (fn)
      return fn
    if (!name.includes(':'))
      return
    const [namespace, fnName] = name.split(':')
    return extendedRpcMap.get(namespace)?.[fnName]
  },
  onError(error, name) {
    console.error(`[devtools][nuxt-svg-loader] RPC error on executing "${name}":`, error)
  },
  timeout: 120_000,
})

async function connectVite() {
  let base = window.parent?.__NUXT__?.config?.app?.baseURL ?? '/'
  if (base && !base.endsWith('/'))
    base += '/'

  const hot = await tryCreateHotContext(undefined, [
    ...(base
      ? [`${base}_nuxt/`, base]
      : []),
    '/_nuxt/',
    '/',
  ])

  if (!hot) {
    wsConnecting.value = true
    throw new Error('Unable to connect to devtools')
  }

  hot.on(WS_EVENT_NAME, (data) => {
    wsConnecting.value = false
    onMessage(data)
  })

  wsConnecting.value = true

  hot.on('vite:ws:connect', () => {
    wsConnecting.value = false
  })
  hot.on('vite:ws:disconnect', () => {
    wsConnecting.value = true
  })

  return hot
}
