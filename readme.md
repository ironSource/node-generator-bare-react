# generator-bare-react

**Generator for [React](https://github.com/facebook/react) apps and components.** Does not create a full project, but scaffolds a `lib/components/my-component.js` and `lib/index.js` in ES5 or ES6, optionally including [React Router](https://rackt.github.io/react-router), [React Bootstrap](http://react-bootstrap.github.io/) and [pure render](https://github.com/gaearon/react-pure-render). If a `package.json` exists in the working directory, react and react-dom 0.14 will be installed, as well as the latest react-router, react-bootstrap and react-pure-render. If those modules are already installed, regardless of version, they will be skipped.

[![npm status](http://img.shields.io/npm/v/generator-bare-react.svg?style=flat-square)](https://www.npmjs.org/package/generator-bare-react)  [![Dependency status](https://img.shields.io/david/ironSource/node-generator-bare-react.svg?style=flat-square)](https://david-dm.org/ironSource/node-generator-bare-react)

## usage

```
cd my-project
yo bare-react [options]
```

## requirements for ES6

If you're using Babel 5, the following features must be enabled in `.babelrc`.

```json
{
  "optional": [
    "es7.objectRestSpread",
    "es7.classProperties",
    "es7.decorators"
  ]
}
```

*Documentation PRs are welcome for Babel 6 or other transpilers and build systems.*

### options

Almost all options map directly to questions; if you specify an option then the relevant question(s) will be skipped. Note as well that the generator remembers your answers, so not specifying any options is just as quick. For more details on these options, run the generator and follow the wizard to get familiar.

- type: "app" or "component"
- dest: relative destination directory (its segments will be [param-cased](https://github.com/blakeembrey/param-case))
- name: component or app name
- esnext (boolean): Use ES6+ features
- modules: module format (ES6 only), case insensitive: "ES6" or "CommonJS"
- state: Where to define initial state (ES6 only). Can be "none", "class" (class property: `state = ..`) or "constructor" (`this.state = ..`).
- router, pure-render, bootstrap (boolean): add React Router, pure render and/or React Bootstrap, respectively. To disable a feature, specify `--no-router`.
- enable, disable: Toggle multiple features, as an array or comma-separated string. More useful for subgenerators (see below) than in the CLI (`--router --bootstrap` is shorter than `--enable router,bootstrap`). But if it tickles your fancy, you can even do `--enable router --enable bootstrap`.
- append (boolean): for apps only. If true, the generated code creates a mountNode (`div`) and appends it to body. Defaults to false, meaning it renders into `#container`.
- style: "es5", "es6", or "es6-functional" (deprecated)
- help/h: print options and usage
- skipCache: do not remember prompt answers
- skipInstall: do not automatically install dependencies

### examples

```
yo bare-react --no-esnext --type app --name Dashboard --dest lib
yo bare-react --router --pure-render --no-bootstrap
yo bare-react --esnext --modules CommonJS --state class
```

## install

Install Yeoman and generator-bare-react globally with [npm](https://npmjs.org):

```
npm install -g yo generator-bare-react
```

## use as subgenerator

Install bare-react locally and call [composeWith](http://yeoman.io/authoring/composability.html) in your generator. Like on the command line, specify options to skip questions. You can call `composeWith` multiple times within a single session to generate multiple components. Some questions (like whether to use ES6) will then be asked just once.

```js
// Generates lib/components/popup.js and lib/index.js
this.composeWith('bare-react'
  , { options:  { type: 'app'
                , dest: 'lib'
                , name: 'Popup'
                , router: false
                , skipInstall: this.options.skipInstall
                , skipCache: this.options.skipCache }}
  , { local: require.resolve('generator-bare-react')
    , link: 'strong' })

// Generates lib/components/popup-child.js
this.composeWith('bare-react'
  , { options:  { type: 'component'
                , dest: 'lib'
                , name: 'PopupChild'
                , enable: ['router', 'pureRender']
                , skipInstall: this.options.skipInstall
                , skipCache: this.options.skipCache }}
  , { local: require.resolve('generator-bare-react')
    , link: 'strong' })
```

## changelog

### 2.0.0

- Renders into `#container` by default
- Uses the same template for app and component
- ES6 modules are opt-in
- The `style` (es5/es6/es6-functional) option is replaced with `esnext` (boolean) and `modules` (es6/commonjs)
- ES6 only: one can choose where state gets defined (class property, in the constructor, or not at all)
- The generated component includes an example event handler, with [autobind-decorator](https://www.npmjs.com/package/autobind-decorator) for ES6.

## license

[MIT](http://opensource.org/licenses/MIT) © [ironSource](http://www.ironsrc.com/)
