<script setup lang="ts">
import type { SvgFilesInfo } from '../src/types'

const nuxt = useNuxtApp()

clientFunctions.refresh = async (type) => {
  // refresh useAsyncData
  await nuxt.hooks.callHookParallel('app:data:refresh', [type])
}

const files = useStaticSvgFiles()

const selected = ref<SvgFilesInfo>()
const navbar = ref<HTMLElement>()

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
    <NNavbar ref="navbar" class="border-gray/20 p-2">
      <NIconTitle text="Nuxt Svg Loader" />
    </NNavbar>

    <div class="grid grid-cols-minmax-8rem gap-1 p-2">
      <template v-for="file in files" :key="file.path">
        <button type="button" class="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray/5" :class="{ '!bg-green/10': selected === file }" @click="selected = file">
          <SvgPreview class="h-30 w-30" :src="`/__nuxt-svg-loader/svg/${file.path}`" :alt="file.name" />
          <span class="text-xs">{{ file.name }}</span>
        </button>
      </template>
    </div>

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
</style>
