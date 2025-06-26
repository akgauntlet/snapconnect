module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@services": "./src/services",
            "@config": "./src/config",
            "@hooks": "./src/hooks",
            "@stores": "./src/stores",
            "@utils": "./src/utils",
            "@types": "./src/types",
            "@navigation": "./src/navigation",
          },
        },
      ],
      // Transform import.meta statements for React Native Web compatibility
      function () {
        return {
          visitor: {
            MetaProperty(path) {
              if (
                path.node.meta.name === "import" &&
                path.node.property.name === "meta"
              ) {
                path.replaceWithSourceString("{}");
              }
            },
          },
        };
      },
    ],
  };
};
