import { resolve } from 'node:path'
import process from 'node:process'
import { defineNuxtModule } from '@nuxt/kit'
import { startSubprocess } from '@nuxt/devtools-kit'
import NuxtSvgoLoader from '../src/module'

export default defineNuxtConfig({
  modules: [
    NuxtSvgoLoader,

    /**
     * Start a sub Nuxt Server for developing the client
     * The terminal output can be found in the Terminals tab of the devtools.
     */
    defineNuxtModule({
      setup(_, nuxt) {
        if (!nuxt.options.dev)
          return

        const subprocess = startSubprocess(
          {
            command: 'npx',
            args: ['nuxi', 'dev', '--port', '3030'],
            cwd: resolve(__dirname, '../client'),
          },
          {
            id: 'nuxt-svgo-loader:client',
            name: 'Nuxt SVGO Loader Client Dev',
          },
        )
        subprocess.getProcess().stdout?.on('data', (data) => {
          // eslint-disable-next-line no-console
          console.log(` sub: ${data.toString()}`)
        })

        process.on('exit', () => {
          subprocess.terminate()
        })
      },
    }),
  ],

  svgoLoader: {
    svgoConfig: {
      // Options here will be passed to svgo
    },
  },
})
