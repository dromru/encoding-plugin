# Webpack Encoding Plugin

 [![codecov](https://codecov.io/gh/dromru/encoding-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/dromru/encoding-plugin) [![npm](https://img.shields.io/npm/v/encoding-plugin.svg)](https://www.npmjs.com/package/encoding-plugin)

Take control over the encoding of emitted `webpack` assets.
This can be useful, if the delivering webserver enforces a specific content-type,
so that your code is not interpreted as utf-8 by the browser.

> ℹ️ **EncodingPlugin v2 only works with Webpack 5 and above. Use v1 for Webpack <= 4.**

## Getting Started

Install package:

```console
$ yarn add --dev encoding-plugin
```

Add the plugin to your `webpack` config. For example:

``` js
const EncodingPlugin = require('encoding-plugin');

module.exports = {
  plugins: [
    new EncodingPlugin({
      encoding: 'iso-8859-1',
    }),
  ],
};
```

## Options

|                         Name                          |                   Type                    |          Default          | Description                                                                          |
| :---------------------------------------------------: | :---------------------------------------: | :-----------------------: | :----------------------------------------------------------------------------------- |
|             **[`encoding`](#encoding)**               |                `{String}`                 |        `undefined`        | Target encoding                                                                      |
|                  **[`test`](#test)**                  | `{String\|RegExp\|Array<String\|RegExp>}` | `/(\.js|\.css)(\?.*)?$/i` | Include all assets that pass test assertion                                          |
|               **[`include`](#include)**               | `{String\|RegExp\|Array<String\|RegExp>}` |        `undefined`        | Include all assets matching any of these conditions                                  |
|               **[`exclude`](#exclude)**               | `{String\|RegExp\|Array<String\|RegExp>}` |        `undefined`        | Exclude all assets matching any of these conditions                                  |
|              **[`filename`](#filename)**              |           `{String\|Function}`            |        `undefined`        | The target asset filename                                                            |
| **[`patchWebpackBootstrap`](#patchWebpackBootstrap)** |                `{Boolean}`                |           `true`          | Whether to replace `utf-8` to target encoding from `webpack` runtime code or not     |

### `encoding`

Type: `String`
Default: `undefined`

The Plugin uses [iconv-lite](https://www.npmjs.com/package/iconv-lite) to handle the encoding.
A list of supported encodings can be found [here](https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings)

**webpack.config.js**

``` js
module.exports = {
  plugins: [
    new EncodingPlugin({
      encoding: 'iso-8859-1',
    }),
  ],
};
```

### `test`

Type: `String|RegExp|Array<String|RegExp>`
Default: `/(\.js|\.css)(\?.*)?$/i`

Include all assets that pass test assertion.

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new EncodingPlugin({
      encoding: 'iso-8859-1',
      test: /\.js(\?.*)?$/i,
    }),
  ],
};
```

### `include`

Type: `String|RegExp|Array<String|RegExp>`
Default: `undefined`

Include all assets matching any of these conditions.

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new EncodingPlugin({
      encoding: 'iso-8859-1',
      include: /\/includes/,
    }),
  ],
};
```

### `exclude`

Type: `String|RegExp|Array<String|RegExp>`
Default: `undefined`

Exclude all assets matching any of these conditions.

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new EncodingPlugin({
      encoding: 'iso-8859-1',
      exclude: /\/excludes/,
    }),
  ],
};
```

### `filename`

Type: `String|Function`
Default: `undefined`

The target asset filename.

#### `String`

For example we have `assets/scripts/main.js?foo=bar#hash`:

`[path]` is replaced with the directories to the original asset, included trailing `/` (`assets/scripts/`).

`[file]` is replaced with the path of original asset (`assets/scripts/main.js`).

`[base]` is replaced with the base (`[name]` + `[ext]`) of the original asset (`main.js`).

`[name]` is replaced with the name of the original asset (`main`).

`[ext]` is replaced with the extension of the original asset, included `.` (`.js`).

`[query]` is replaced with the query of the original asset, included `?` (`?foo=bar`).

`[fragment]` is replaced with the fragment (in the concept of URL it is called `hash`) of the original asset (`#hash`).

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new EncodingPlugin({
      encoding: 'iso-8859-1',
      filename: "[path][name].iso-8859-1[ext]",
    }),
  ],
};
```

#### `Function`

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new EncodingPlugin({
      encoding: 'iso-8859-1',
      filename(pathData) {
        // The `pathData` argument contains all placeholders - `path`/`name`/`ext`/etc
        // Available properties described above, for the `String` notation
        if (/\.css$/.test(pathData.file)) {
          return "assets/stylesheets/[path][name].iso-8859-1[ext]";
        }

        return "assets/scripts/[path][name].iso-8859-1[ext]";
      },
    }),
  ],
};
```

### `patchWebpackBootstrap`

Type: `Boolean`
Default: `true`

Whether to replace `utf-8` to target encoding from `webpack` runtime code or not.

**webpack.config.js**

```js
module.exports = {
  plugins: [
    new EncodingPlugin({
      encoding: 'iso-8859-1',
      patchWebpackBootstrap: true,
    }),
  ],
};
```

Example Webpack runtime code:

**patchWebpackBootstrap: false**
```js
/******/ 				script = document.createElement('script');
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
```

**patchWebpackBootstrap: true**
```js
/******/ 				script = document.createElement('script');
/******/ 				script.charset = 'iso-8859-1';
/******/ 				script.timeout = 120;
```

## webpack-dev-server

To use non-utf-8 encoding with webpack-dev-server, you must set the appropriate charset like so:

``` JavaScript
devServer:  {
   headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/javascript; charset=windows-1251'
   }
   // ...
}
```

## License

MIT
