/*jslint node, devel */

const webpack = require("webpack");

module.exports = function ({webpackConfig, silent}) {
    return new Promise(function (resolve, reject) {
        return webpack(webpackConfig, function (err, stats) {
            if (err) {
                return reject(err);
            }
            if (!silent) {
                console.log(
                    stats.toString({colors: true})
                );
            }
            return (
                stats.hasErrors()
                ? reject("Service worker build failed with errors.")
                : resolve()
            );
        });
    });
};
