import type { Config } from 'svgo'

import { addBuildPlugin, addTemplate, addVitePlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import SvgLoader from 'vite-svg-loader'
import { devtools } from './devtools'
import { SvgoIconTransform } from './plugins/svgo-icon-transform'
import { scanComponents } from './scan'

interface SvgLoaderOptions {
  svgoConfig?: Config
  svgo?: boolean
  defaultImport?: 'url' | 'raw' | 'component'
}

const DTS = `declare module '*.svg?component' {
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
      getContents: () => DTS,
    })

    const context = {
      components: [] as Awaited<ReturnType<typeof scanComponents>>,
    }

    function getComponents() {
      return context.components
    }

    addBuildPlugin(
      SvgoIconTransform({
        getComponents,
        transform:
          typeof nuxt.options.components === 'object'
          && !Array.isArray(nuxt.options.components)
            ? nuxt.options.components.transform
            : undefined,
      }),
    )

    addTemplate({
      filename: 'svgo-icon.d.ts',
      getContents: () => {
        const names = getComponents().map(component => `'${component.name.replace('.svg', '')}'`)
        return `import { FunctionalComponent, SVGAttributes } from 'vue'
declare module 'vue' {
  export interface GlobalComponents {
    SvgoIcon: FunctionalComponent<SVGAttributes & { name: ${names.join(' | ')} }>
  }
}`
      },
    })

    nuxt.hook('app:templates', async () => {
      context.components = await scanComponents(nuxt, resolve)
    })

    nuxt.hook('prepare:types', ({ tsConfig }) => {
      tsConfig.include?.push('./nuxt-svgo-loader.d.ts')
      tsConfig.include?.push('./svgo-icon.d.ts')
    })

    if (nuxt.options.dev) {
      devtools(nuxt, resolve)
    }
  },
})
