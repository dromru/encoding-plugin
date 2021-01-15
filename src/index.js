/* eslint-disable no-restricted-syntax */
import path from 'path';

import { validate } from 'schema-utils';
import serialize from 'serialize-javascript';
import encoder from 'encoding';

import schema from './options.json';

const RELATED_NAME = 'encoded';

class EncodingPlugin {
  constructor(options = {}) {
    validate(schema, options, {
      name: 'Encoding Plugin',
      baseDataPath: 'options',
    });

    const {
      encoding,
      test = /(\.js|\.css)(\?.*)?$/i,
      include,
      exclude,
      filename,
      patchWebpackBootstrap = true,
      deleteOriginalAssets = true,
    } = options;

    this.options = {
      encoding,
      test,
      include,
      exclude,
      filename,
      patchWebpackBootstrap,
      deleteOriginalAssets,
    };
  }

  runEncodingAlgorithm(input) {
    return new Promise((resolve, reject) => {
      let result;
      try {
        result = encoder.convert(input, this.options.encoding, 'UTF-8');
      } catch (e) {
        return reject(e);
      }
      return resolve(result);
    });
  }

  async convertAssets(compiler, compilation, assets) {
    const cache = compilation.getCache('EncodingWebpackPlugin');
    const assetsForMinify = (
      await Promise.all(
        Object.keys(assets).map(async (name) => {
          const { info, source } = compilation.getAsset(name);

          if (info.encoded) {
            return false;
          }

          if (
            !compiler.webpack.ModuleFilenameHelpers.matchObject.bind(
              // eslint-disable-next-line no-undefined
              undefined,
              this.options
            )(name)
          ) {
            return false;
          }

          if (info.related && info.related[RELATED_NAME]) {
            return false;
          }

          const cacheItem = cache.getItemCache(
            serialize({
              name,
              encoding: this.options.encoding,
            }),
            cache.getLazyHashedEtag(source)
          );
          const output = (await cacheItem.getPromise()) || {};

          let buffer;

          // No need original buffer for cached files
          if (!output.source) {
            if (typeof source.buffer === 'function') {
              buffer = source.buffer();
            } else {
              buffer = source.source();

              if (!Buffer.isBuffer(buffer)) {
                // eslint-disable-next-line no-param-reassign
                buffer = Buffer.from(buffer);
              }
            }

            if (buffer.length < this.options.threshold) {
              return false;
            }
          }

          return {
            name,
            source,
            info,
            buffer,
            output,
            cacheItem,
            relatedName: RELATED_NAME,
          };
        })
      )
    ).filter(Boolean);

    const { RawSource } = compiler.webpack.sources;
    const scheduledTasks = [];

    for (const asset of assetsForMinify) {
      scheduledTasks.push(
        (async () => {
          const {
            name,
            source,
            buffer,
            output,
            cacheItem,
            info,
            relatedName,
          } = asset;

          if (!output.source) {
            if (!output.encoded) {
              try {
                output.encoded = await this.runEncodingAlgorithm(buffer);
              } catch (error) {
                compilation.errors.push(error);
                return;
              }
            }
            output.source = new RawSource(output.encoded);
            await cacheItem.storePromise({ encoded: output.encoded });
          }

          let newFilename = this.options.filename;
          let newName = name;

          if (newFilename !== undefined) {
            const match = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(name);
            const [, replacerFile] = match;
            const replacerQuery = match[2] || '';
            const replacerFragment = match[3] || '';
            const replacerExt = path.extname(replacerFile);
            const replacerBase = path.basename(replacerFile);
            const replacerName = replacerBase.slice(
              0,
              replacerBase.length - replacerExt.length
            );
            const replacerPath = replacerFile.slice(
              0,
              replacerFile.length - replacerBase.length
            );
            const pathData = {
              file: replacerFile,
              query: replacerQuery,
              fragment: replacerFragment,
              path: replacerPath,
              base: replacerBase,
              name: replacerName,
              ext: replacerExt || '',
            };

            if (typeof newFilename === 'function') {
              newFilename = newFilename(pathData);
            }

            newName = newFilename.replace(
              /\[(file|query|fragment|path|base|name|ext)]/g,
              (p0, p1) => pathData[p1]
            );
          }

          const newInfo = { encoded: true };

          if (info.immutable && /(\[name]|\[base]|\[file])/.test(newFilename)) {
            newInfo.immutable = true;
          }

          if (this.options.deleteOriginalAssets) {
            if (this.options.deleteOriginalAssets === 'keep-source-map') {
              compilation.updateAsset(name, source, {
                related: { sourceMap: null },
              });
            }

            compilation.deleteAsset(name);
          } else {
            compilation.updateAsset(name, source, {
              related: { [relatedName]: newName },
            });
          }

          compilation.emitAsset(newName, output.source, newInfo);
        })()
      );
    }

    return Promise.all(scheduledTasks);
  }

  apply(compiler) {
    const pluginName = this.constructor.name;

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: pluginName,
          stage:
            compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER,
          additionalAssets: true,
        },
        (assets) => this.convertAssets(compiler, compilation, assets)
      );

      if (this.options.patchWebpackBootstrap) {
        ['jsonpScript', 'linkPreload'].forEach((id) => {
          const hook = compilation.mainTemplate.hooks[id];
          if (hook) {
            hook.tap(pluginName, (s) =>
              s.replace(/(["'])utf-8["']/gi, `$1${this.options.encoding}$1`)
            );
          }
        });
      }

      compilation.hooks.statsPrinter.tap(pluginName, (stats) => {
        stats.hooks.print
          .for('asset.info.encoded')
          .tap('encoding-webpack-plugin', (encoded, { green, formatFlag }) =>
            // eslint-disable-next-line no-undefined
            encoded ? green(formatFlag('encoded')) : undefined
          );
      });
    });
  }
}

export default EncodingPlugin;
