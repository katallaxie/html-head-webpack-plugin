export interface HtmlHeadElementsPluginOptions {

}

export class HtmlHeadElementsPlugin {

  public static RE_ENDS_WITH_BS = /\/$/;
  public compiler: any;

  constructor(public options: HtmlHeadElementsPluginOptions = <any>{}) { }

  public apply(compiler: any) {

    this.compiler = compiler;

    compiler.plugin('compilation', (nmf: any) => {
      nmf.options.htmlElements = nmf.options.htmlElement || {};
      nmf.plugin('html-webpack-plugin-before-html-generation', (htmlPluginData, cb) => {
        const options = this.options;
        if (options) {
          const publicPath = htmlPluginData.assets.publicPath;
          Object.keys(options).forEach((type) => {
            nmf.options.htmlElements[type] = this.getHtmlElementString(options[type], publicPath);
          });
        }
        cb(null, htmlPluginData);
      });
    });

  }

  public createTag(tagName, attrMap, publicPath) {
    publicPath = publicPath || '';

    // add trailing slash if we have a publicPath and it doesn't have one.
    if (publicPath && !HtmlHeadElementsPlugin.RE_ENDS_WITH_BS.test(publicPath)) {
      publicPath += '/';
    }

    const attributes = Object.getOwnPropertyNames(attrMap)
      .filter(function (name) { return name[0] !== '='; })
      .map(function (name) {
        let value = attrMap[name];

        if (publicPath) {
          // check if we have explicit instruction, use it if so (e.g: =herf: false)
          // if no instruction, use public path if it's href attribute.
          const usePublicPath = attrMap.hasOwnProperty('=' + name) ? !!attrMap['=' + name] : name === 'href';

          if (usePublicPath) {
            // remove a starting trailing slash if the value has one so we wont have //
            value = publicPath + (value[0] === '/' ? value.substr(1) : value);
          }
        }

        return name + '="' + value + '"';
      });

    return '<' + tagName + ' ' + attributes.join(' ') + '>';

  }

  public getHtmlElementString(dataSource, publicPath) {
    return Object.getOwnPropertyNames(dataSource)
      .map(function (name) {
        if (Array.isArray(dataSource[name])) {
          return dataSource[name].map(function (attrs) { return this.createTag(name, attrs, publicPath); });
        } else {
          return [this.createTag(name, dataSource[name], publicPath)];
        }
      })
      .reduce(function (arr, curr) {
        return arr.concat(curr);
      }, [])
      .join('\n\t');
  }

}
