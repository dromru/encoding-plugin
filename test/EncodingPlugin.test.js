/**
 * @jest-environment node
 */

import EncodingPlugin from '../src/index';

const SOURCE_CHARSET = 'utf-8';
const TARGET_CHARSET = 'windows-1251';

const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const pathlib = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const encoding = require('encoding');

const fixture = (path = '') => pathlib.join(__dirname, 'fixtures', path);
const dist = (path = '') => pathlib.join(process.cwd(), 'dist', path);
const decode = (buf) =>
  encoding
    .convert(buf, SOURCE_CHARSET, TARGET_CHARSET)
    .toString(SOURCE_CHARSET);
const readDist = (path) => (fs) => fs.readFileSync(dist(path));

const compile = ({ plugins, ...config }, pluginConfig) =>
  new Promise((resolve, reject) => {
    const fs = new MemoryFS();
    const webpackConfig = {
      ...config,
      mode: 'production',
      output: {
        publicPath: '',
        path: dist(),
        ...config.output,
      },
      optimization: {
        minimize: false,
        ...config.optimization,
      },
      plugins: [
        ...(plugins || []),
        new EncodingPlugin({ ...pluginConfig, encoding: TARGET_CHARSET }),
      ],
    };
    const compiler = webpack(webpackConfig);
    compiler.outputFileSystem = fs;
    compiler.run((err, stats) => {
      if (process.env.VERBOSE) console.log(stats.toString()); // eslint-disable-line no-console
      if (err || stats.hasErrors()) {
        // eslint-disable-next-line no-console
        console.log(err);
        if (stats.hasErrors()) {
          // eslint-disable-next-line no-console
          console.log(stats.toString());
        }
        reject(err);
      }
      resolve(fs);
    });
  });

describe('EncodingPlugin', () => {
  it('simple', async () => {
    const config = {
      entry: fixture('test-entry.js'),
    };

    await expect(
      compile(config).then(readDist('main.js')).then(decode)
    ).resolves.toMatchSnapshot();
  });

  it('`utf-8` in runtime scripts should be replaced', async () => {
    const config = {
      entry: fixture('async.js'),
    };

    await expect(
      compile(config).then(readDist('main.js')).then(String)
    ).resolves.toMatchSnapshot();
  });

  it('`utf-8` in runtime scripts related to preload should be replaced', async () => {
    const config = {
      entry: fixture('async-import-preload-entry.js'),
    };

    await expect(
      compile(config).then(readDist('main.js')).then(String)
    ).resolves.toMatchSnapshot();
  });

  it('default test rule is js/css, emitted files are mjs/css', async () => {
    const filenameJs = 'main.mjs';
    const filenameCss = 'main.css';
    const config = {
      entry: fixture('mjs-css.js'),
      output: {
        filename: filenameJs,
      },
      plugins: [new MiniCssExtractPlugin({ filename: filenameCss })],
      module: {
        rules: [
          {
            test: /\.css$/,
            use: [MiniCssExtractPlugin.loader, 'css-loader'],
          },
        ],
      },
    };

    await expect(
      compile(config).then((fs) =>
        [
          String(readDist(filenameJs)(fs)), // no decoding
          decode(readDist(filenameCss)(fs)),
        ].join('\n\n')
      )
    ).resolves.toMatchSnapshot();
  });
});
