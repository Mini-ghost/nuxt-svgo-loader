<script setup lang="ts">
import type { SvgFilesInfo } from '../../src/types'

const nuxt = useNuxtApp()

clientFunctions.refresh = async (type) => {
  // refresh useAsyncData
  await nuxt.hooks.callHookParallel('app:data:refresh', [type])
}

const files = useStaticSvgFiles()

const selected = ref<SvgFilesInfo>()
const navbar = ref<HTMLElement>()

const search = ref('')

const filtered = computed(() => {
  const result = search.value
    ? files.value?.filter(file => file.name.toLowerCase().includes(search.value.toLowerCase()))
    : files.value

  return result || []
})

const byFolders = computed(() => {
  const result: Record<string, SvgFilesInfo[]> = {}
  for (const asset of filtered.value) {
    const folder = `/${asset.path.split('/').slice(0, -1).join('/')}`
    if (!result[folder])
      result[folder] = []
    result[folder].push(asset)
  }
  return Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
})

useEventListener('keydown', (event) => {
  switch (event.key) {
    case 'Escape':
      selected.value = undefined
      break
  }
})
</script>

<template>
  <div class="h-screen overflow-auto">
    <NNavbar ref="navbar" v-model:search="search" class="border-gray/20 p-2" />

    <template v-for="[folder, items] of byFolders" :key="folder">
      <NSectionBlock
        :text="folder"
        :description="`${items.length} items`"
        :padding="false"
        container-class="grid grid-cols-minmax-8rem gap-1 px-2"
      >
        <template v-for="file in items" :key="file.path">
          <button type="button" class="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray/5" :class="{ '!bg-green/10': selected === file }" @click="selected = file">
            <SvgPreview class="h-30 w-30" :src="`/__nuxt-svgo-loader/svg/${file.path}`" :alt="file.name" />
            <span class="text-xs">{{ file.name }}</span>
          </button>
        </template>
      </NSectionBlock>
      <div class="h-px w-full bg-gray/15" />
    </template>

    <NDrawer :model-value="!!selected" :top="navbar" class="w-120 border-gray/20" auto-close @close="selected = undefined">
      <SvgDetails v-if="selected" :selected="selected" />
    </NDrawer>
  </div>
</template>

<style>
::-webkit-scrollbar {
  display: none;
}

img {
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}
/* override devtools-ui-ki */

.hover\:bg-active {
  @apply hover:bg-gray/5;
}
</style>
