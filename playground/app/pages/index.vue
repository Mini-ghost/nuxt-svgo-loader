<script setup lang="ts">
import NuxtSvg from '~/assets/svg/nuxt.svg?component'
import VueSvg from '~/assets/svg/vue.svg?component'
</script>

<template>
  <div>
    <NuxtSvg width="92" height="92" fill="#00DC82" />
    <VueSvg width="92" height="92" fill="#41B883" />

    <!-- @vue-expect-error -->
    <SvgoIcon /> <!-- should remove -->

    <!-- Basic Usage（PascalCase） -->
    <SvgoIcon name="nuxt" width="92" height="92" fill="#00DC82" />
    <SvgoIcon name="vue" width="92" height="92" fill="#41B883" />

    <!-- kebab-case -->
    <svgo-icon name="nuxt" width="92" height="92" fill="#00DC82" />

    <!-- skipsvgo -->
    <SvgoIcon name="vue" strategy="skipsvgo" width="92" height="92" fill="#41B883" />
  </div>
</template>
