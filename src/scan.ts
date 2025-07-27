import type { Nuxt } from 'nuxt/schema'

import { basename, isAbsolute, join } from 'pathe'
import { glob } from 'tinyglobby'

export async function scanComponents(nuxt: Nuxt, namespaces?: { prefix: string, dir: string }[]) {
  if (!namespaces)
    return _scanComponents(nuxt.options.srcDir)

  const files = []
  for (const namespace of namespaces || []) {
    const dir = isAbsolute(namespace.dir)
      ? namespace.dir
      : join(nuxt.options.rootDir, namespace.dir)

    files.push(...await _scanComponents(dir, namespace.prefix))
  }

  return files
}

async function _scanComponents(cwd: string, prefix = '') {
  const files = await glob(['**/*.svg'], {
    cwd,
    onlyFiles: true,
    absolute: true,
    ignore: ['node_modules', 'dist', 'build', 'coverage', 'test', 'tests'],
    expandDirectories: false,
  })

  return files.map(path => ({
    name: basename(path, '.svg'),
    prefix,
    path,
  }))
}
