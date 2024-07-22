<script setup lang="ts">
import { join } from 'pathe'
import { genImport, genSafeVariableName } from 'knitwork'
import { camelCase, pascalCase } from 'scule'
import type { SvgFilesInfo } from '../../src/types'

type LoaderMode = 'component' | 'skipsvgo' | 'raw' | 'url'

const props = defineProps<{
  selected: SvgFilesInfo
}>()

const clipboard = useClipboard()

const basicPath = computed(() => join('~', props.selected.path))

function genImportPath(mode?: LoaderMode) {

  const safeVariableName = genSafeVariableName(props.selected.name).replace(/_(45|46|47)/g, '_')
  const importPath = `${basicPath.value}${mode ? '?' + mode : ''}`

  if (mode === 'component' || mode === 'skipsvgo')
    return genImport(importPath, pascalCase(safeVariableName))

  return genImport(importPath, camelCase(`${safeVariableName}${mode ? '_' + mode : ''}`))
}

function onCopy(mode?: LoaderMode) {
  clipboard.copy(genImportPath(mode))
}
</script>

<template>
  <div class="flex flex-col gap-4 min-h-full overflow-hidden p-4">
    <div class="flex gap-2 items-center -mb-2 opacity-50">
      <div class="h-px w-full bg-gray/15" />
      <div class="flex-none">
        Preview
      </div>
      <div class="h-px w-full bg-gray/15" />
    </div>

    <div class="flex items-center justify-center">
      <SvgPreview class="max-h-80 min-h-20 min-w-20 w-auto" :src="`/__nuxt-svgo-loader/svg/${selected.path}`" :alt="selected.name" />
    </div>

    <div class="flex gap-2 items-center -mb-2 opacity-50">
      <div class="h-px w-full bg-gray/15" />
      <div class="flex-none">
        Import Paths
      </div>
      <div class="h-px w-full bg-gray/15" />
    </div>

    <table class="max-w-full w-full table-fixed">
      <colgroup>
        <col class="w-30">
        <col class="w-full">
      </colgroup>
      <tbody>
        <tr>
          <td class="text-end pe-5 opacity-50">
            Path
          </td>
          <td class="font-mono truncate white-space-pre">
            <div class="flex gap-1">
              <div class="flex-auto ws-pre of-hidden truncate">
                {{ basicPath }}
              </div>
              <NButton icon="carbon-copy" :border="false" @click="onCopy()" />
            </div>
          </td>
        </tr>
        <tr>
          <td class="text-end pe-5 opacity-50">
            Component
          </td>
          <td class="font-mono truncate white-space-pre">
            <div class="flex gap-1">
              <div class="flex-auto ws-pre of-hidden truncate">
                {{ basicPath }}?component
              </div>
              <NButton icon="carbon-copy" :border="false" @click="onCopy('component')" />
            </div>
          </td>
        </tr>
        <tr>
          <td class="text-end pe-5 opacity-50">
            Skip Svgo
          </td>
          <td class="font-mono truncate white-space-pre">
            <div class="flex gap-1">
              <div class="flex-auto ws-pre of-hidden truncate">
                {{ basicPath }}?skipsvgo
              </div>
              <NButton icon="carbon-copy" :border="false" @click="onCopy('skipsvgo')" />
            </div>
          </td>
        </tr>
        <tr>
          <td class="text-end pe-5 opacity-50">
            Raw
          </td>
          <td class="font-mono truncate white-space-pre">
            <div class="flex gap-1">
              <div class="flex-auto ws-pre of-hidden truncate">
                {{ basicPath }}?raw
              </div>
              <NButton icon="carbon-copy" :border="false" @click="onCopy('raw')" />
            </div>
          </td>
        </tr>
        <tr>
          <td class="text-end pe-5 opacity-50">
            Url
          </td>
          <td class="font-mono truncate white-space-pre">
            <div class="flex gap-1">
              <div class="flex-auto ws-pre of-hidden truncate">
                {{ basicPath }}?url
              </div>
              <NButton icon="carbon-copy" :border="false" @click="onCopy('url')" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
