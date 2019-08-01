/**
 * @jest-environment node
 */

const SOURCE_CHARSET = 'utf-8';
const TARGET_CHARSET = 'windows-1251';

const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const pathlib = require('path');
const EncodingPlugin = require('../EncodingPlugin');
const encoding = require('encoding');

const fixture = (path = '') => pathlib.join(__dirname, '__fixtures__', path);
const dist = (path = '') => pathlib.join(process.cwd(), 'dist', path);

const compile = config =>
  new Promise((resolve, reject) => {
    const fs = new MemoryFS();
    const compiler = webpack({
      output: {
        publicPath: '',
        path: dist(),
      },
      optimization: {
        minimize: false,
      },
      plugins: [new EncodingPlugin(TARGET_CHARSET)],
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
        .then(fs => fs.readFileSync(dist('main.js')))
        .then(buf => encoding.convert(buf, SOURCE_CHARSET, TARGET_CHARSET).toString(SOURCE_CHARSET))
    ).resolves.toMatchSnapshot();
  });
});
