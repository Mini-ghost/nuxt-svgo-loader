import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  rollup: { emitCJS: true },
  externals: [
    'vite-svg-loader',
    'oxc-walker',
    'ultrahtml',
    'ufo',
    'unplugin',
    'magic-string',
    'scule',
    'knitwork',
  ],
})
