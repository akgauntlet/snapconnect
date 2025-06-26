const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Configure resolver to handle Firebase and AsyncStorage properly
config.resolver = {
  ...config.resolver,
  alias: {
    ...config.resolver?.alias,
    "@react-native-async-storage/async-storage": path.resolve(
      __dirname,
      "node_modules/@react-native-async-storage/async-storage",
    ),
  },
  resolverMainFields: ["react-native", "browser", "main"],
  platforms: ["ios", "android", "native", "web"],
};

// Configure transformer to handle import.meta for web
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Web-specific configuration to handle ES modules
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Handle import.meta polyfill for web
      if (req.url?.includes("?import.meta")) {
        res.setHeader("Content-Type", "application/javascript");
        res.end("export default {};");
        return;
      }
      return middleware(req, res, next);
    };
  },
};

// Reduce max workers to prevent memory issues
config.maxWorkers = 1;

module.exports = withNativeWind(config, { input: "./global.css" });
