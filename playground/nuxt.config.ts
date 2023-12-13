export default defineNuxtConfig({
  modules: ['nuxt-svg-loader'],

  svgLoader: {
    svgoConfig: {
      // Options here will be passed to svgo
    },
  },
})
