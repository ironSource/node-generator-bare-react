'use strict';

const path = require('path')
    , ConfigStore = require('configstore')
    , after = require('after')
    , latest = require('latest-version')
    , paramCase = require('param-case')
    , pascalCase = require('pascal-case')
    , camelCase = require('camel-case')
    , colors = require('chalk')

const { name: moduleName, bugs } = require('../../package.json')
    , { Base } = require('yeoman-generator')

function paramCasePath(path) {
  return path.split(/[\/\\]+/).map(paramCase).filter(k=>k).join('/')
}

function bool(val, def) {
  return typeof val === 'boolean' ? val : !!def
}

function listChoices(choices) {
  return choices.slice(0,-1).join(', ') + ' or ' + choices[choices.length-1]
}

function looseBoolean(value, notSet) {
  if (typeof value === 'boolean') {
    return value
  } else if (typeof value === 'string') {
    value = value.toLowerCase()
    return value === 'true' || value === '1' || value[0] === 'y'
  } else if (typeof value === 'number') {
    return value === 1
  } else {
    return notSet
  }
}

// Don't allow empty strings, and take
// the first of "--name a --name b".
function strictString(value, notSet) {
  if (Array.isArray(value)) return strictString(value[0], notSet)
  if (typeof value !== 'string') return notSet

  value = value.trim()
  return value === '' ? notSet : value
}

function validateBoolean(b) {
  return typeof b === 'boolean' || 'Must be a boolean'
}

const STYLES = {
  'es6': 'import React from \'react\'; class X extends Component',
  'es6-functional': 'const React = require(\'react\'); class X extends Component',
  'es5': 'var React = require(\'react\'); React.createClass(..)'
}

const TYPES = [ 'app', 'component', 'higher-order-component' ]
const FLAGS = [ 'router', 'pureRender', 'bootstrap' ]
const REMEMBER = [ 'dest', 'esnext', 'modules' ].concat(FLAGS)

const STRING_OPTIONS = {
  type: listChoices(TYPES),
  dest: 'Destination directory',
  name: 'Component or app name',
  style: 'Deprecated: ' + listChoices(Object.keys(STYLES))
}

const MODULE_FORMATS =
  { commonjs: { name: 'CommonJS'
              , snippet: `const assign = require('object-assign')` }
  , es6:      { name: 'ES6 modules'
              , snippet: `import assign from 'object-assign'` }}

const self = module.exports = class ReactGenerator extends Base {
  static getLongtermMemory() {
    return self.longterm || (self.longterm = new ConfigStore(moduleName))
  }

  static getShorttermMemory() {
    return self.shorttime || (self.shorttime = Object.create(null))
  }

  constructor(args, options, config) {
    super(args, options, config)

    this.longterm = self.getLongtermMemory()
    this.shortterm = self.getShorttermMemory()

    this.desc(
       'Generator for React apps and components. Skip questions '
     + 'by specifying options.\n\nExamples:'
     + '\n  yo bare-react --no-esnext --type app --name Dashboard --dest lib'
     + '\n  yo bare-react --router --pure-render --no-bootstrap'
     + '\n  yo bare-react --esnext --modules CommonJS'
    )

    Object.keys(STRING_OPTIONS).forEach(option => {
      this.option(option, {
        type: 'String',
        desc: STRING_OPTIONS[option]
      })

      this.options[option] = strictString(this.options[option], undefined)
    })

    // "--esnext" or "--no-esnext" or "--esnext true"
    this.option('esnext', {
      type: 'Boolean',
      desc: `Use ES6+ features`
    })

    this.options.esnext = looseBoolean(this.options.esnext, undefined)

    // "--modules es6"
    this.option('modules', {
      type: 'String',
      desc: 'Module format, case insensitive: ES6 or CommonJS'
    })

    let modules
      = this.options.modules
      = strictString(this.options.modules, undefined)

    if (this.options.esnext === false) this.options.modules = 'commonjs'
    else if (modules !== undefined) {
      this.options.modules = modules.toLowerCase()
    }

    // TODO: parse and implement
    this.option('children', { desc: 'Reserved for future use' })

    // "--a" or "--no-a" or "--a true"
    FLAGS.forEach(option => {
      this.option(option, {
        type: 'Boolean',
        desc: `Enable ${option}`
      })

      this.options[option] = looseBoolean(this.options[option], undefined)
    })

    // "--enable a --enable b" or "--enable a b"
    ;['enable', 'disable'].forEach( (option, i) => {
      let example = i === 0 ? ' ("a,b")' : ''

      this.option(option, {
        desc: `${pascalCase(option)} multiple flags${example}`
      })

      let value = this.options[option]

      if (typeof value === 'string') {
        value = this.options[option] = value.split(/[ ,;\/|]+/)
      } else if (!Array.isArray(value)) {
        this.options[option] = undefined
        return
      }

      value.forEach(flag => {
        flag = camelCase(flag)
        if (FLAGS.indexOf(flag) >= 0 && this.options[flag] === undefined) {
          this.options[flag] = option === 'enable'
        }
      })
    })

    this.option('append', {
      type: 'Boolean',
      desc: 'For apps: append a mountNode to body prior to rendering'
    })

    this.options.append = looseBoolean(this.options.append, false)

    if (this.options.style !== undefined) {
      let style = this.options.style
        , str = JSON.stringify(style)

      this.log.info('The "style" option has been removed.')

      if (style === 'es6') {
        this.options.esnext = true
        this.options.modules = 'es6'
      } else if (style === 'es6-functional') {
        this.options.esnext = true
        this.options.modules = 'commonjs'
      } else if (style === 'es5') {
        this.options.esnext = false
        this.options.modules = 'commonjs'
      } else {
        this.log.info('I could not convert the invalid value %s for you.', str)
        return this.env.error(
          'Invalid value for option "style". '+
          'Please specify "esnext" and "modules" instead.'
        )
      }

      this.log.info('I\'ve converted the value %s to: ', str)

      let { modules, esnext } = this.options
      this.log.info({ esnext, modules })
    }
  }

  prompting() {
    // The question will be skipped if an option was provided
    // or if it was previously answered (during lifetime of module).
    // Values are not remembered if an option was provided.
    let overrideAnswers = {}
    let currentAnswers = (cb) => {
      return (promptAnswers) => cb({...overrideAnswers, ...promptAnswers})
    }

    let questions = [
      {
        type: 'list',
        name: 'type',
        choices: TYPES.map(type => {
          return { name: type.replace(/-/g, ' '), value: type }
        }),
        message: 'What do you want to create?',
        default: 'app',
        validate: (choice) => { // Used to validate option
          if (TYPES.indexOf(choice) >= 0) return true
          return 'Must be one of ' + JSON.stringify(TYPES)
        }
      },
      {
        name: 'name',
        message: currentAnswers(answers => {
          return `What would you like to name your ${answers.type}?`
        }),
        default: currentAnswers(answers => pascalCase(answers.type)),
        validate: (val) => {
          return pascalCase(val).length ? true : 'You have to provide a name'
        },
        filter: (val) => pascalCase(val)
      },
      {
        name: 'dest',
        message: currentAnswers(answers => {
          let { type, name } = answers
          let component = colors.yellow(`components/${paramCase(name)}.js`)
            , what = component

          if (type === 'app') {
            let renderer = colors.yellow(`${paramCase(name)}.js`)
            what = `renderer ${renderer} and ${component}`
          }

          return `Where do you want to place ${what}?`
        }),
        default: this.longterm.get('dest') || 'lib',
        validate: (val) => {
          return paramCasePath(val).length
            ? true
            : 'You have to provide a destination'
        },
        filter: paramCasePath
      },
      {
        type: 'confirm',
        name: 'esnext',
        message: 'Do you prefer ES6 over ES5?',
        default: bool(this.longterm.get('esnext'), true),
        validate: validateBoolean
      },
      {
        type: 'list',
        name: 'modules',
        when: (answers) => answers.esnext,
        message: 'Which module format do you prefer?',
        default: this.longterm.get('modules') || 'commonjs',
        choices: Object.keys(MODULE_FORMATS).map(key => {
          let { name, snippet } = MODULE_FORMATS[key]
          return { name: `${name}  ${colors.gray(snippet)}`, value: key }
        }),
        validate: (choice) => { // Used to validate option
          let choices = Object.keys(MODULE_FORMATS)
          if (choices.indexOf(choice) >= 0) return true
          return 'Must be one of ' + JSON.stringify(choices)
        }
      },
      {
        type: 'confirm',
        name: 'pureRender',
        message: 'Do you wish to use pure render components?',
        default: bool(this.longterm.get('pureRender'), true),
        validate: validateBoolean
      },
      {
        type: 'confirm',
        name: 'router',
        message: 'Do you need React Router?',
        default: bool(this.longterm.get('router'), true),
        validate: validateBoolean
      },
      {
        type: 'confirm',
        name: 'bootstrap',
        message: 'Would you like some React Bootstrap?',
        default: bool(this.longterm.get('bootstrap'), true),
        validate: validateBoolean
      }
    ]

    let allNames = []

    // Skip and validate overrides and previously answered questions
    let filterNoop = (v) => v
    questions = questions.filter(q => {
      let { name, validate, filter = filterNoop } = q

      let remembered = this.shortterm[name]
        , option = this.options[name]

      allNames.push(name)

      if (option != null) {
        this._assertIsValidOption(name, option, validate)
        overrideAnswers[name] = filter(option)
        return false
      } else if (remembered != null) {
        if (!this._isValidOption(name, remembered, validate)) {
          this.log.info('Removing invalid previous answer %s', colors.gray(name))
          delete this.shortterm[name]
          return true
        } else {
          overrideAnswers[name] = filter(remembered)
          return false
        }
      }

      return true
    })

    let done = this.async()
    this.prompt(questions, (answers) => {
      let { skipCache, append } = this.options

      allNames.forEach(name => {
        if (overrideAnswers[name] != null) {
          answers[name] = overrideAnswers[name]
        } else if (answers[name] != null && REMEMBER.indexOf(name) >= 0 && !skipCache) {
          this.shortterm[name] = answers[name]
          this.longterm.set(name, answers[name])
        }
      })

      answers.append = append
      this.ctx = answers

      done()
    })
  }

  _assertIsValidOption(name, value, validate) {
    let valid = validate(value)
    if (valid !== true) {
      this.env.error(`Invalid value for option "${name}": ${valid}`)
    }
  }

  _isValidOption(name, value, validate) {
    return validate(value) === true
  }

  writing() {
    let { ctx } = this
      , { dest, type, name, esnext, router, pureRender, bootstrap } = ctx

    let paramName = ctx.paramName = paramCase(name)
      , suffix = esnext ? 'es6' : 'es5'

    let copy = (tpl, path) => {
      this.fs.copyTpl
        ( this.templatePath(tpl)
        , this.destinationPath(`${dest}/${path}`)
        , ctx )
    }

    if (type === 'app') {
      copy(router ? 'render-router.ejs' : 'render.ejs', 'index.js')
      copy(`components/component-${suffix}.ejs`, `components/${paramName}.js`)
    } else if (type === 'component') {
      copy(`components/component-${suffix}.ejs`, `components/${paramName}.js`)
    } else if (type === 'higher-order-component') {
      this.log.info('Not yet implemented: higher order component')
    }

    let deps = { 'react': '~0.14.0', 'react-dom': '~0.14.0' }

    if (router) deps['react-router'] = null // use latest
    if (pureRender) deps['react-pure-render'] = null
    if (bootstrap) deps['react-bootstrap'] = null

    this._saveDependencies(deps, this.async())
  }

  _saveDependencies(deps, opts, done) {
    if (typeof opts === 'function') done = opts, opts = {}

    let group = opts && opts.dev ? 'devDependencies' : 'dependencies'

    if (Array.isArray(deps)) {
      let obj = Object.create(null)
      deps.forEach(dep => obj[dep] = null)
      deps = obj
    }

    let pkg = this.fs.readJSON('package.json', false)

    if (!pkg) {
      this.log.error(`Cannot install ${group} because package.json is missing`)
      return setImmediate(done)
    }

    // Will run during the 'install' phase of the run loop.
    if (!self.hasInstallScheduled && !this.options.skipInstall) {
      self.hasInstallScheduled = true
      this.npmInstall()
    }

    let output = pkg[group] || {}
      , names = Object.keys(deps)

    let next = after(names.length, err => {
      if (err) return done(err)

      pkg[group] = output
      this.fs.writeJSON('package.json', pkg)

      done()
    })

    names.forEach(dep => {
      let wished = deps[dep]
      let { version: installed } = this.fs.readJSON(this.destinationPath(`node_modules/${dep}/package.json`), {})

      if (wished || installed) {
        output[dep] = wished || ('~' + installed)
        return setImmediate(next)
      }

      latest(dep, (err, version) => {
        if (err) this.log.error('Could not fetch version of %s, please save manually: %s', dep, err)
        else output[dep] = '~' + version
        next()
      })
    })
  }
}
