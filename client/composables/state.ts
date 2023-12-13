import type { AsyncDataOptions } from '#app'

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
