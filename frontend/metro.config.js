const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, "toReversed", {
    value: function () {
      return [...this].reverse();
    },
    writable: true,
    configurable: true,
  });
}

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
