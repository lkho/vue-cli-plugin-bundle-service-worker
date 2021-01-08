/*jslint node */

const build_SW = require("./build-sw");

module.exports = function BundleServiceWorkerPlugin({webpackConfig}) {
    return {
        apply(compiler) {
            compiler.hooks.emit.tapPromise(
                "vue-cli:bundle-service-worker-plugin",
                function () {
                    if (process.env.VUE_CLI_MODERN_BUILD) {

// Avoid building the service worker twice.

                        return;
                    }
                    return build_SW({webpackConfig});
                }
            );
        }
    };
};
