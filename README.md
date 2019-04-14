# vue-cli-plugin-bundle-service-worker

Builds your service worker with webpack.  Primary use case is if your service worker imports/requires modules other than the workbox libs.

Requires the `@vue/pwa` plugin to be installed and configured using `workboxPluginMode === 'InjectManifest'`.

## Installation
```
vue add bundle-service-worker
```

```javascript
// vue.config.js
module.exports = {
  // required
  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'src/service-worker.js'
    }
  },

  // optional
  pluginOptions: {
    'vue-cli-plugin-bundle-service-worker': {
      // simple (https://cli.vuejs.org/guide/webpack.html#chaining-advanced)
      configureWebpack: {
        plugins: [
          new MyAwesomeWebpackPlugin()
        ]
      },

      // chaining (https://cli.vuejs.org/guide/webpack.html#chaining-advanced)
      chainWebpack: config => {
        config
          .plugin('define')
          .tap(([definitions]) => {
            // environment variables recognised by Vue CLI will automatically be
            // included (e.g. NODE_ENV, BASE_URL and VUE_APP_*), but all other
            // must be explicitly set here
            definitions['process.env.MY_VAR'] = JSON.stringify(process.env.MY_VAR)
            return [definitions]
          })
      }
    },
  },
}
```

In this case, `src/service-worker.js` will be built by webpack, then the manifest & workbox libs will be injected.

## Building manually

For debugging purposes, you can build your service worker manually. Note that the built service worker will *not* have it's precache manifest injected, or the workbox libs included - this takes place only when you call `vue-cli-service build`.

```
npx vue-cli-service build:sw
```
