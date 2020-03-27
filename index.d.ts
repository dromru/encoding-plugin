import * as webpack from 'webpack';

declare namespace EncodingPlugin {
  interface Options {
    /**
     * Target encoding https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings
     */
    encoding: string;

    /**
     * RegExp or array of RegExps to filter processed files
     *
     * Default: /(\.js|\.css)($|\?)/i
     */
    test?: RegExp | RegExp[];

    /**
     * RegExp or array of RegExps to filter processed files
     *
     * Default: undefined
     */
    include?: RegExp | RegExp[];

    /**
     * RegExp or array of RegExps to filter processed files
     *
     * Default: undefined
     */
    exclude?: RegExp | RegExp[];
  }
}

declare class EncodingPlugin extends webpack.Plugin {
  constructor(encodingOrOptions: string | EncodingPlugin.Options);
  apply(compiler: webpack.Compiler): void;
}

export = EncodingPlugin;
