import type { Config } from 'svgo'

import { addTemplate, addVitePlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import SvgLoader from 'vite-svg-loader'
import { devtools } from './devtools'

interface SvgLoaderOptions {
  svgoConfig?: Config
  svgo?: boolean
  defaultImport?: 'url' | 'raw' | 'component'
}

export default defineNuxtModule<SvgLoaderOptions>({
  meta: {
    name: 'nuxt-svgo-loader',
    configKey: 'svgoLoader',
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    addVitePlugin(SvgLoader(options))

    addTemplate({
      filename: 'nuxt-svgo-loader.d.ts',
      getContents() {
        return `declare module '*.svg?component' {
  import { FunctionalComponent, SVGAttributes } from 'vue'
  const src: FunctionalComponent<SVGAttributes>
  export default src
}

declare module '*.svg?url' {
  const src: string
  export default src
}

declare module '*.svg?raw' {
  const src: string
  export default src
}

declare module '*.svg?skipsvgo' {
  import { FunctionalComponent, SVGAttributes } from 'vue'
  const src: FunctionalComponent<SVGAttributes>
  export default src
}
`
      },
    })

    nuxt.hook('prepare:types', ({ tsConfig }) => {
      tsConfig.include?.push('./nuxt-svgo-loader.d.ts')
    })

    if (nuxt.options.dev) {
      devtools(nuxt, resolve)
    }
  },
})
