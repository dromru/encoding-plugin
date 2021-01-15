import { WebpackPluginInstance, Compiler } from 'webpack';

export = EncodingPlugin;

/**
 * Take control over the encoding of emitted `webpack` assets.
 */
declare class EncodingPlugin implements WebpackPluginInstance {
  constructor(options?: EncodingPlugin.Options);
  apply(compiler: Compiler): void;
}

declare namespace EncodingPlugin {
  /** Filtering rule as regex or string */
  type Rule = string | RegExp;

  /** Filtering rules */
  type Rules = Rule | ReadonlyArray<Rule>;

  interface FileInfo {
    /** original asset filename */
    file: string;
    query: string;
    fragment: string;
    /** path of the original asset */
    path: string;
    base: string;
    name: string;
    ext: string;
  }

  type FilenameFunction = (pathData: FileInfo) => string;

  interface Options {
    /**
     * Target encoding. A list of supported encodings can be found here: https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings
     */
    encoding: string;
    /**
     * Include all assets that pass test assertion.
     */
    test?: Rules;
    /**
     * Include all assets matching any of these conditions.
     */
    include?: Rules;
    /**
     * Exclude all assets matching any of these conditions.
     */
    exclude?: Rules;
    /**
     * The target asset filename.
     */
    filename?: string | FilenameFunction;
    /**
     * Whether to replace `utf-8` to target encoding from `webpack` runtime code or not.
     *
     * @default true
     */
    patchWebpackBootstrap?: boolean;
    /**
     * Whether to delete the original assets or not.
     *
     * @default true
     */
    deleteOriginalAssets?: boolean | 'keep-source-map';
  }
}
