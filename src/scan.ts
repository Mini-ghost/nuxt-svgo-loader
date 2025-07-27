import type { Nuxt } from 'nuxt/schema'

import { basename } from 'pathe'
import { glob } from 'tinyglobby'

export async function scanComponents(nuxt: Nuxt) {
  const files = await glob(['**/*.svg'], {
    cwd: nuxt.options.srcDir,
    onlyFiles: true,
    absolute: true,
    ignore: ['node_modules', 'dist', 'build', 'coverage', 'test', 'tests'],
    expandDirectories: false,
  })

  return files.map(path => ({
    name: basename(path, '.svg'),
    path,
  }))
}
