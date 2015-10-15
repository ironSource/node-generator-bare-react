# generator-bare-react

**Generator for [React](https://github.com/facebook/react) apps and components.** Does not create a full project, but scaffolds a `lib/components/my-component.js` and `lib/index.js` in ES5 or ES6, optionally including [React Router](https://rackt.github.io/react-router), [React Bootstrap](http://react-bootstrap.github.io/) and [pure render](https://github.com/gaearon/react-pure-render). If a `package.json` exists in the working directory, react and react-dom 0.14 will be installed, as well as the latest react-router, react-bootstrap and react-pure-render. If those modules are already installed, regardless of version, they will be skipped.

[![npm status](http://img.shields.io/npm/v/generator-bare-react.svg?style=flat-square)](https://www.npmjs.org/package/generator-bare-react)  [![Dependency status](https://img.shields.io/david/vweevers/node-generator-bare-react.svg?style=flat-square)](https://david-dm.org/vweevers/node-generator-bare-react)

## usage

```
cd my-project
yo bare-react [options]
```

### options

Specify an option like `--name MyComponent` to skip that question. For more details on these options, run the generator and follow the wizard to get familiar.

```
--type          # app or component
--dest          # Destination directory
--name          # Component or app name
--style         # es6, es6-functional or es5
--router        # Enable or disable (--no-router) and skip question
--pureRender    # Enable or disable pureRender
--bootstrap     # Enable or disable bootstrap
--enable        # Enable multiple flags ("a,b")
--disable       # Disable multiple flags
--append        # For apps: append a mountNode to body prior to rendering
--help  -h      # Print the generator's options and usage
--skip-cache    # Do not remember prompt answers
--skip-install  # Do not automatically install dependencies
```

## install

Install Yeoman and generator-bare-react globally with [npm](https://npmjs.org):

```
npm install -g yo generator-bare-react
```

## use as subgenerator

Install bare-react locally and call [composeWith](http://yeoman.io/authoring/composability.html) in your generator. Like on the command line, specify options to skip questions. You can call `composeWith` multiple times within a single session to generate multiple components. Some questions (like which code style to use) will then be asked just once.

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
                , skipInstall: this.options.skipInstall
                , skipCache: this.options.skipCache }}
  , { local: require.resolve('generator-bare-react')
    , link: 'strong' })
```

## license

[MIT](http://opensource.org/licenses/MIT) © [ironSource](http://www.ironsrc.com/)
