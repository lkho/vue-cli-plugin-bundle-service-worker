const path = require('path')
const buildSW = require('./src/build-sw')
const BundleServiceWorkerPlugin = require('./src/BundleServiceWorkerPlugin')
const Config = require('webpack-chain')
const { merge } = require('webpack-merge')
const PLUGIN_NAME = require('./package.json').name
const DefinePlugin = require('webpack/lib/DefinePlugin')
const resolveClientEnv = require('@vue/cli-service/lib/util/resolveClientEnv')

module.exports = (api, options) => {
  const { pwa, outputDir, pluginOptions } = options

  if (!pwa || !pwa.workboxOptions) {
    throw new Error('pwa.workboxOptions is missing')
  }

  if (pwa.workboxPluginMode !== 'InjectManifest') {
    throw new Error('Only pwa.workboxPluginMode "InjectManifest" is supported')
  }

  // defer to pwa plugin's config
  const swSrc = api.resolve(pwa.workboxOptions.swSrc)

  // default to filename of swSrc, ala workbox plugin
  const swDest = pwa.workboxOptions.swDest || path.basename(swSrc)
  const targetDir = api.resolve(outputDir)

  // configure webpack
  const chainableConfig = new Config()
  let swConfig = null

  chainableConfig
    .mode(process.env.NODE_ENV)
    .entry('index')
      .add(swSrc)
      .end()
    .output
      .path(targetDir)
      .filename(swDest)
      .end()
    .plugin('define')
      .use(DefinePlugin, [
        resolveClientEnv(options),
      ])

  swConfig = chainableConfig.toConfig()

  // apply user modifications to webpack config
  if (pluginOptions && pluginOptions[PLUGIN_NAME]) {
    const { configureWebpack, chainWebpack } = pluginOptions[PLUGIN_NAME]

    if (chainWebpack) {
      chainWebpack(chainableConfig)

      swConfig = chainableConfig.toConfig()
    }

    if (configureWebpack) {
      if (typeof configureWebpack === 'function') {
        // function with optional return value
        const res = configureWebpack(swConfig)

        if (res) {
          swConfig = merge(swConfig, res)
        }
      } else {
        // merge literal values
        swConfig = merge(swConfig, configureWebpack)
      }
    }
  }

  api.registerCommand('build:sw', {
    description: 'Builds service worker',
    usage: 'vue-cli-service build:sw',
  }, async (args) => {
    await buildSW(Object.assign({}, args, { webpackConfig: swConfig }))
  })

  api.chainWebpack(webpackConfig => {
    const target = process.env.VUE_CLI_BUILD_TARGET
    if (target && target !== 'app') {
      return
    }

    webpackConfig
      .when(process.env.NODE_ENV === 'production', config => {
        config
          .plugin('bundle-service-worker')
          .use(BundleServiceWorkerPlugin, [{ webpackConfig: swConfig }])
          .before('workbox')

        config
          .plugin('workbox')
          // use init instead of tap, as it seems the args are not available
          // for tap when this is called
          .init((Plugin, [options]) => {
            // Inject manifest into built service worker (modify in place)
            options.swSrc = path.resolve(targetDir, swDest)

            return new Plugin(options)
          })
          // .tap(args => {
          //   // Inject manifest into built service worker (modify in place)
          //   args[0].swSrc = path.resolve(targetDir, swDest)

          //   return args
          // })
      })
  })
}

module.exports.defaultModes = {
  'build:sw': 'production'
}
