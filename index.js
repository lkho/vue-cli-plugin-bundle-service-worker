/*jslint node */

const path = require("path");
const build_SW = require("./src/build-sw.js");
const BundleServiceWorkerPlugin = require("./src/BundleServiceWorkerPlugin.js");
const Config = require("webpack-chain");
const {merge} = require("webpack-merge");
const PLUGIN_NAME = require("./package.json").name;
const DefinePlugin = require("webpack/lib/DefinePlugin");
const resolve_client_env = require(
    "@vue/cli-service/lib/util/resolveClientEnv"
);

module.exports = function (api, options) {
    const {pwa, outputDir, pluginOptions} = options;
    if (!pwa || !pwa.workboxOptions) {
        throw new Error("pwa.workboxOptions is missing");
    }
    if (pwa.workboxPluginMode !== "InjectManifest") {
        throw new Error(
            "Only pwa.workboxPluginMode \"InjectManifest\" is supported"
        );
    }

// Defer to the PWA plugin's config.

    const sw_src = api.resolve(pwa.workboxOptions.swSrc);

// Default to the filename of swSrc, ala workbox plugin.

    const sw_dest = pwa.workboxOptions.swDest || path.basename(sw_src);
    const target_dir = api.resolve(outputDir);

// Configure webpack.

    const chainable_config = new Config();
    let sw_config = null;
    chainable_config.mode(
        process.env.NODE_ENV
    ).entry(
        "index"
    ).add(
        sw_src
    ).end(
    ).output.path(
        target_dir
    ).filename(
        sw_dest
    ).end(
    ).plugin(
        "define"
    ).use(DefinePlugin, [resolve_client_env(options)]);
    sw_config = chainable_config.toConfig();

// Apply user modifications to the webpack config.

    if (pluginOptions && pluginOptions[PLUGIN_NAME]) {
        const {configureWebpack, chainWebpack} = pluginOptions[PLUGIN_NAME];
        if (chainWebpack) {
            chainWebpack(chainable_config);
            sw_config = chainable_config.toConfig();
        }
        if (configureWebpack) {
            if (typeof configureWebpack === "function") {
                const res = configureWebpack(sw_config);
                if (res) {
                    sw_config = merge(sw_config, res);
                }
            } else {
                sw_config = merge(sw_config, configureWebpack);
            }
        }
    }

    api.registerCommand(
        "build:sw",
        {
            description: "Builds service worker",
            usage: "vue-cli-service build:sw"
        },
        function (args) {
            return build_SW(
                Object.assign({}, args, {webpackConfig: sw_config})
            );
        }
    );

    api.chainWebpack(function (webpack_config) {
        const target = process.env.VUE_CLI_BUILD_TARGET;
        if (target && target !== "app") {
            return;
        }
        webpack_config.when(
            process.env.NODE_ENV === "production",
            function (config) {
// freeze the config chain at this point, just before adding our plugin.
                sw_config = Object.assign(config.toConfig(), sw_config);
                config.plugin(
                    "bundle-service-worker"
                ).use(BundleServiceWorkerPlugin, [
                    {webpackConfig: sw_config}
                ]).before(
                    "workbox"
                );
                config.plugin(
                    "workbox"
                ).init(

// Use .init instead of .tap, as it seems the args are not available for tap
// when this is called.

                    function (Plugin, [options]) {

// Inject manifest into the built service worker.

                        options.swSrc = path.resolve(target_dir, sw_dest);
                        return new Plugin(options);
                    }
                );
            }
        );
    });
};

module.exports.defaultModes = {
    "build:sw": "production"
};
