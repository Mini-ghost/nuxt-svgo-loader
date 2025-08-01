import type { Config } from 'svgo'

import { addBuildPlugin, addTemplate, addVitePlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import SvgLoader from 'vite-svg-loader'
import { devtools } from './devtools'
import { SvgoIconTransform } from './plugins/svgo-icon-transform'
import { scanComponents } from './scan'

interface SvgLoaderNamespace {
  /**
   * The prefix to use for the SVG components in this namespace
   */
  prefix: string

  /**
   * The directory where the SVG files are located
   */
  dir: string
}

interface SvgLoaderOptions {
  svgoConfig?: Config
  svgo?: boolean
  defaultImport?: 'url' | 'raw' | 'component'

  /**
   * The namespaces to use for the SVG loader
   */
  namespaces?: SvgLoaderNamespace[]
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

function generateSvgoIconDts(names: string[]) {
  return `import { FunctionalComponent, SVGAttributes } from 'vue'

interface SvgoIconProps {
  /**
   * The name of the SVG icon to render
   *
   * @description This should match the filename (without extension) of an SVG file
   * in your configured icons directory. The available names are type-checked
   * based on the SVG files found during build time.
   */
  name: ${names.join(' | ')}

  /**
   * The imported strategy for the SVG icon
   *
   * @description
   * - \`'component'\`: Process the SVG through SVGO optimization and render as Vue component (default)
   * - \`'skipsvgo'\`: Skip SVGO optimization and render the raw SVG as Vue component
   *
   * @default 'component'
   *
   * @example
   * \`\`\`vue
   * <!-- Optimized SVG (default) -->
   * <SvgoIcon name="my-icon" />
   * <SvgoIcon name="my-icon" strategy="component" />
   *
   * <!-- Raw SVG without optimization -->
   * <SvgoIcon name="my-icon" strategy="skipsvgo" />
   * \`\`\`
   */
  strategy?: 'component' | 'skipsvgo'
}

declare module 'vue' {
  export interface GlobalComponents {
    /**
     * A Vue virtual component that is used to replace with the specified SVG component at build-time
     *
     * @example
     * \`\`\`vue
     * <template>
     *   <!-- Basic usage -->
     *   <SvgoIcon name="home" />
     *
     *   <!-- With SVG attributes -->
     *   <SvgoIcon
     *     aria-label="User profile"
     *     class="size-6"
     *     fill="currentColor"
     *     name="user"
     *   />
     *
     *   <!-- Skip optimization -->
     *   <SvgoIcon name="complex-logo" strategy="skipsvgo" />
     * </template>
     * \`\`\`
     */
    SvgoIcon: FunctionalComponent<SVGAttributes & SvgoIconProps>
  }
}`
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
      getContents: () => DTS,
    })

    const context = {
      components: new Map<string, { name: string, path: string, prefix: string }>(),
    }

    addBuildPlugin(
      SvgoIconTransform({
        getComponents: () => context.components,
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
        const names = [...context.components.keys()].map(name => `'${name}'`)

        if (names.length === 0) {
          return generateSvgoIconDts(['string'])
        }

        return generateSvgoIconDts(names)
      },
    })

    nuxt.hook('app:templates', async () => {
      const components = await scanComponents(nuxt, options.namespaces)

      context.components.clear()

      for (const component of components) {
        let name = component.name
        if (component.prefix) {
          name = `${component.prefix}:${name}`
        }

        context.components.set(name, component)
      }
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
