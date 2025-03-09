import type { AsyncDataOptions } from '#app'
import type { BirpcReturn } from 'birpc'
import type { ClientFunctions, ServerFunctions } from '../../src/types'
import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'

let rpc: BirpcReturn<ServerFunctions, ClientFunctions>

export const clientFunctions = {
  // will be added in app.vue
} as ClientFunctions

onDevtoolsClientConnected((client) => {
  rpc = client.devtools.extendClientRpc<ServerFunctions, ClientFunctions>('NUXT_SVGO_LOADER', clientFunctions)
})

function useAsyncState<T>(key: string, fn: () => Promise<T>, options?: AsyncDataOptions<T>) {
  const nuxt = useNuxtApp()

  const unique = (nuxt.payload.unique = nuxt.payload.unique || ({} as any))
  if (!unique[key])
    unique[key] = useAsyncData(key, fn, options)

  return unique[key].data as Ref<T | null>
}

export function useStaticSvgFiles() {
  return useAsyncState('getStaticSvgFiles', () => rpc.getStaticSvgFiles())
}
