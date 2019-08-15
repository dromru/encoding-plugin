/**
 * @jest-environment node
 */

const SOURCE_CHARSET = 'utf-8';
const TARGET_CHARSET = 'windows-1251';

const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const pathlib = require('path');
const EncodingPlugin = require('../EncodingPlugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const encoding = require('encoding');

const fixture = (path = '') => pathlib.join(__dirname, '__fixtures__', path);
const dist = (path = '') => pathlib.join(process.cwd(), 'dist', path);
const decode = buf => encoding.convert(buf, SOURCE_CHARSET, TARGET_CHARSET).toString(SOURCE_CHARSET);
const readDist = path => fs => fs.readFileSync(dist(path));

const compile = ({ plugins, ...config }, pluginConfig) =>
  new Promise((resolve, reject) => {
    const fs = new MemoryFS();
    const compiler = webpack({
      mode: 'production',
      output: {
        publicPath: '',
        path: dist(),
      },
      optimization: {
        minimize: false,
      },
      plugins: [
        ...(plugins ? plugins : []),
        new EncodingPlugin(pluginConfig ? { ...pluginConfig, encoding: TARGET_CHARSET } : TARGET_CHARSET),
      ],
      ...config
    });
    compiler.outputFileSystem = fs;
    compiler.run((err, stats) => {
      if (process.env.VERBOSE) console.log(stats.toString());
      if (err) reject(err);
      resolve(fs);
    });
  });

describe('EncodingPlugin', () => {
  it('simple', async () => {
    const config = {
      entry: fixture('test-entry.js'),
    };

    await expect(
      compile(config)
        .then(readDist('main.js'))
        .then(decode)
    ).resolves.toMatchSnapshot();
  });

  it('`utf-8` in runtime scripts should be replaced', async () => {
    const config = {
      entry: fixture('async.js'),
    };

    await expect(
      compile(config)
        .then(readDist('main.js'))
        .then(String)
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
      compile(config).then(fs => [
        String(readDist(filenameJs)(fs)), // no decoding
        decode(readDist(filenameCss)(fs))
      ].join('\n\n'))
    ).resolves.toMatchSnapshot();
  });
});
