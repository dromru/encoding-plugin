# Webpack Encoding Plugin

[![Greenkeeper badge](https://badges.greenkeeper.io/dromru/encoding-plugin.svg)](https://greenkeeper.io/) [![CircleCI](https://circleci.com/gh/dromru/encoding-plugin.svg?style=svg)](https://circleci.com/gh/dromru/encoding-plugin)

Take control over the encoding of emitted webpack assets.
This can be useful, if the delivering webserver enforces a specific content-type,
so that your js-code is not interpreted as utf-8 by the browser.

## Usage

Install package

    npm install encoding-plugin

Setup webpack config

``` javascript
const EncodingPlugin = require('encoding-plugin');
module.exports = {
  plugins: [
    new EncodingPlugin({
      encoding: 'iso-8859-1',
    }),
  ],
};
```

Additional options:

`test`, `include`, `exclude` RegExp or array of RegExps to filter processed files
(default `test` is `/(\.js|\.css)($|\?)/i`)

## Encodings

The Plugin uses [iconv-lite](https://www.npmjs.com/package/iconv-lite) to handle the encoding.
A list of supported encodings can be found [here](https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings)

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
