<script setup lang="ts">
defineProps<{
  src: string
  alt?: string
}>()
</script>

<template>
  <div class="flex items-center justify-center rounded border border-gray/5 p-1 object-cover overflow-hidden bg-[#9CA3AF]/5">
    <img :src="src" alt="alt">
  </div>
</template>
