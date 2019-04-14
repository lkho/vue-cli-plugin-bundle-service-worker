const buildSW = require('./build-sw')

const ID = 'vue-cli:bundle-service-worker-plugin'

module.exports = class BundleServiceWorkerPlugin {
  constructor({ webpackConfig }) {
    this.webpackConfig = webpackConfig
  }

  apply(compiler) {
    compiler.hooks.emit.tapPromise(ID, async (compilation) => {
      if (process.env.VUE_CLI_MODERN_BUILD) {
        // avoid running twice (already run after the legacy build)
        return
      }

      await buildSW({ webpackConfig: this.webpackConfig })
    })
  }
}
