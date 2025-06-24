module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@config': './src/config',
            '@hooks': './src/hooks',
            '@stores': './src/stores',
            '@utils': './src/utils',
            '@types': './src/types',
            '@navigation': './src/navigation',
          },
        },
      ],
    ],
  };
};
