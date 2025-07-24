import type { ComponentsOptions } from 'nuxt/schema'

import { pathToFileURL } from 'node:url'
import MagicString from 'magic-string'
import { parseAndWalk, ScopeTracker } from 'oxc-walker'
import { camelCase, pascalCase } from 'scule'
import { parseQuery, parseURL } from 'ufo'
import { parse, render, walk } from 'ultrahtml'
import { createUnplugin } from 'unplugin'

interface LoaderOptions {
  transform?: ComponentsOptions['transform']
}

const SCRIPT_RE = /(?<=<script[^>]*>)[\s\S]*?(?=<\/script>)/gi
const TEMPLATE_RE = /<template>([\s\S]*)<\/template>/

const SVGO_ICON_REGEX = /(?<=[ (])_?resolveComponent\(\s*["'](SvgoIcon[^'"]*)["'][^)]*\)/g

export function SvgoIconResolver(options: LoaderOptions = {}) {
  return createUnplugin(() => {
    const exclude = options.transform?.exclude || []
    const include = options.transform?.include || []

    const bucket = new Map<string, string>()

    return [
      {
        name: 'nuxt-svgo-loader:components',
        enforce: 'pre',
        transformInclude(id) {
          if (exclude.some(pattern => pattern.test(id))) {
            return false
          }
          if (include.some(pattern => pattern.test(id))) {
            return true
          }
          return isVue(id)
        },

        transform: {
          filter: {
            code: { include: TEMPLATE_RE },
          },

          async handler(code, id) {
            // Skip if the file does not include SvgoIcon
            if (!code.includes('SvgoIcon')) {
              return null
            }

            const scopeTracker = new ScopeTracker({ preserveExitedScopes: true })
            for (const { 0: script } of code.matchAll(SCRIPT_RE)) {
              if (!script)
                continue
              try {
                parseAndWalk(script, id, {
                  scopeTracker,
                })
              }
              catch { /* ignore */ }
            }

            const { 0: template, index: offset = 0 } = code.match(TEMPLATE_RE) || {}
            if (!template) {
              return
            }

            const s = new MagicString(code)

            const imports: string[] = []

            try {
              const ast = parse(template)
              await walk(ast, async (node) => {
                if (node.type !== 1 /* ELEMENT_NODE */) {
                  return
                }

                if (node.name !== 'SvgoIcon') {
                  return
                }

                if (scopeTracker.getDeclaration(node.name)) {
                  return
                }

                const name = node.attributes.name
                const start = node.loc[0].start + offset
                const end = node.loc.at(-1)!.end + offset

                if (!name) {
                  s.remove(start, end)
                  return
                }

                const component = `SvgoIcon${pascalCase(camelCase(name))}`

                imports.push(`import ${component} from '~/assets/svg/${name}.svg?component'`)

                const cloned = { ...node }
                cloned.name = component

                const attributes = { ...node.attributes }
                delete attributes.name

                cloned.attributes = attributes

                s.overwrite(start, end, await render(cloned))
              })
            }
            catch {
              // ignore errors if it's not html-like
            }

            if (imports.length) {
              bucket.set(id, imports.join('\n'))
            }

            if (s.hasChanged()) {
              return {
                code: s.toString(),
                map: s.generateMap({ hires: true }),
              }
            }
          },
        },
      },
      {
        name: 'nuxt-svgo-loader:resolve',
        transformInclude(id) {
          if (exclude.some(pattern => pattern.test(id))) {
            return false
          }
          if (include.some(pattern => pattern.test(id))) {
            return true
          }
          return isVue(id)
        },

        transform: {
          handler(code, id) {
            if (!bucket.has(id)) {
              return
            }

            const s = new MagicString(code)
            const imports = bucket.get(id)

            if (imports) {
              s.prepend(`${imports}\n`)
              s.replace(SVGO_ICON_REGEX, (_, name) => name)
            }

            return {
              code: s.toString(),
              map: s.generateMap({ hires: true }),
            }
          },
        },
      },
    ]
  })
}

export function isVue(id: string, opts: { type?: Array<'template' | 'script' | 'style'> } = {}) {
  // Bare `.vue` file (in Vite)
  const { search } = parseURL(decodeURIComponent(pathToFileURL(id).href))
  if (id.endsWith('.vue') && !search) {
    return true
  }

  if (!search) {
    return false
  }

  const query = parseQuery(search)

  // Component async/lazy wrapper
  if (query.nuxt_component) {
    return false
  }

  // Macro
  if (query.macro && (search === '?macro=true' || !opts.type || opts.type.includes('script'))) {
    return true
  }

  // Non-Vue or Styles
  const type = 'setup' in query ? 'script' : query.type as 'script' | 'template' | 'style'
  if (!('vue' in query) || (opts.type && !opts.type.includes(type))) {
    return false
  }

  // Query `?vue&type=template` (in Webpack or external template)
  return true
}
