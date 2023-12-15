export default defineNuxtConfig({
  modules: ['nuxt-svgo-loader'],

  svgoLoader: {
    svgoConfig: {
      // Options here will be passed to svgo
    },
  },
})
