import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'

import { basename } from 'pathe'
import { glob } from 'tinyglobby'

export async function scanComponents(nuxt: Nuxt, resolve: Resolver['resolve']) {
  const srcDir = nuxt.options.srcDir || nuxt.options.appDir

  const files = await glob(['**/*.svg'], {
    cwd: srcDir,
    onlyFiles: true,
    ignore: ['**/node_modules/**', '**/dist/**'],
  })

  return files.map((path) => {
    const filePath = resolve(srcDir, path)

    return {
      path,
      filePath,
      name: basename(path),
    }
  })
}
