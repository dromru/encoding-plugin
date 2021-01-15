const MIN_BABEL_VERSION = 7;
const [TARGET_NODE_VERSION] = require('./package.json').engines.node.match(
  /\d+\.\d+\.\d+/
);

module.exports = (api) => {
  api.assertVersion(MIN_BABEL_VERSION);
  api.cache(true);

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: TARGET_NODE_VERSION,
          },
        },
      ],
    ],
  };
};
