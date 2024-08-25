# Nuxt Svgo Loader

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Nuxt module to load SVG files as Vue components, using SVGO for optimization.

## Features

- 📁 Load SVG files as Vue components.
- 🎨 Optimize SVGs using SVGO.
- 🛠️ Seamless integration with Nuxt DevTools.

## Installation

Install and add nuxt-svgo-loader to your nuxt.config.

```bash
npx nuxi@latest module add nuxt-svgo-loader
```

```ts
export default defineNuxtConfig({
  modules: ['nuxt-svgo-loader'],
  svgoLoader: {
    // Options here will be passed to `vite-svg-loader`
  }
})
```

> [!NOTE]
> Since `nuxt-svgo-loader` is a Nuxt module based on `vite-svg-loader`, the configuration for `svgoLoader` remains identical to that of `vite-svg-loader`. You can refer to the documentation of `vite-svg-loader` for the available options [here](https://github.com/jpkleemans/vite-svg-loader?tab=readme-ov-file#vite-svg-loader).

## Usage

### Component

SVGs can be explicitly imported as Vue components using the `?component` suffix:

```ts
import NuxtSvg from '~/assets/svg/nuxt.svg'
// <NuxtSvg />
```

### URL

SVGs can be imported as URLs using the `?url` suffix:

```ts
import nuxtSvgUrl from '~/assets/svg/nuxt.svg?url'
// nuxtSvgUrl === '/_nuxt/assets/svg/nuxt.svg'
```

### Raw

SVGs can be imported as raw strings using the `?raw` suffix:

```ts
import nuxtSvgRaw from '~/assets/svg/nuxt.svg?raw'
// nuxtSvgRaw === '<svg xmlns="http://www.w3.org/2000/svg" ...'
```

### Skip SVGO for a single file

SVGO can be explicitly disabled for one file by adding the `?skipsvgo` suffix:

```ts
import NuxtSvgWithoutOptimizer from '~/assets/svg/nuxt.svg?skipsvgo'
// <NuxtSvgWithoutOptimizer />
```

## DevTools

This module adds a new tab to the Nuxt DevTools, which allows you to inspect the SVG files.

<p align='center'>
<img src='https://raw.githubusercontent.com/Mini-ghost/nuxt-svgo-loader/main/.github/assets/devtools.png' width='100%'/>
</p>

## License

[MIT](./LICENSE) License © 2023-PRESENT [Alex Liu](https://github.com/Mini-ghost)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-svgo-loader?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-svgo-loader
[npm-downloads-src]: https://img.shields.io/npm/dt/nuxt-svgo-loader?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-svgo-loader
[license-src]: https://img.shields.io/npm/l/nuxt-svgo-loader.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-svgo-loader
[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
