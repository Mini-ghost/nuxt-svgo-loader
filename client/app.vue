<script setup lang="ts">
const nuxt = useNuxtApp()

Object.assign(clientFunctions, {
  async refresh(type: string) {
    // refresh useAsyncData
    nuxt.hooks.callHookParallel('app:data:refresh', [type])
  },
})

const files = useStaticSvgFiles()
</script>

<template>
  <div class="p-2">
    <NIconTitle text="Nuxt Svg Loader" class="p-2 text-xl opacity-75" />
    <div class="grid grid-cols-minmax-8rem">
      <template v-for="file in files" :key="file.path">
        <button type="button" class="flex flex-col items-center gap-1 p-2 hover:bg-[#9CA3AF]/5">
          <div
            class="flex items-center justify-center h-30 w-30 rounded border border-[#9CA3AF]/5 p-1 overflow-hidden bg-[#9CA3AF]/5"
          >
            <img :src="`/__nuxt-svg-loader/svg/${file.path}`" :alt="file.path">
          </div>
          <span class="text-xs">{{ file.name }}</span>
        </button>
      </template>
    </div>
  </div>
</template>
