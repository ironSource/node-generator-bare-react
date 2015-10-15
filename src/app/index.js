'use strict';

var path = require('path')
  , ConfigStore = require('configstore')
  , after = require('after')
  , latest = require('latest-version')
  , paramCase = require('param-case')
  , pascalCase = require('pascal-case')
  , colors = require('chalk')

var { name: moduleName, bugs } = require('../../package.json')
var { Base } = require('yeoman-generator')

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

const STYLES = {
  'es6': 'import React from \'react\'; class X extends Component',
  'es6-functional': 'var React = require(\'react\'); class X extends Component',
  'es5': 'var React = require(\'react\'); React.createClass(..)'
}

const TYPES = [ 'app', 'component', 'higher-order-component' ]
const FLAGS = [ 'router', 'pureRender', 'bootstrap' ]
const REMEMBER = [ 'dest', 'style' ].concat(FLAGS)

const STRING_OPTIONS = {
  type: listChoices(TYPES),
  dest: 'Destination directory',
  name: 'Component or app name',
  style: listChoices(Object.keys(STYLES))
}

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

    Object.keys(STRING_OPTIONS).forEach(option => {
      this.option(option, {
        type: 'String',
        desc: STRING_OPTIONS[option]
      })

      let value = this.options[option]

      if (Array.isArray(value)) value = this.options[option] = value[0]
      if (typeof value !== 'string' || value.trim() === '') {
        this.options[option] = undefined
      }
    })

    // TODO: parse and implement
    this.option('children', { desc: 'Reserved for future use' })

    // "--a" or "--no-a" or "--a true"
    FLAGS.forEach( (option, i) => {
      this.option(option, {
        type: 'Boolean',
        desc: i === 0
          ? `Enable or disable (--no-${option}) and skip question`
          : `Enable or disable ${option}`
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
        flag = flag.trim()
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
        choices: TYPES.map(type => ({ name: type.replace(/-/g, ' '), value: type })),
        message: 'What do want to create?',
        default: 'app',
        validate: (choice) => { // Used to validate option
          if (TYPES.indexOf(choice) >= 0) return true
          return 'Must be one of ' + JSON.stringify(TYPES)
        }
      },
      {
        name: 'name',
        message: currentAnswers((answers) => {
          if (answers.type === 'app') return 'What would you like to name your app?'
          else return 'What would you like to name your component?'
        }),
        default: currentAnswers((answers) => answers.type === 'app' ? 'App' : ''),
        validate: (val) => pascalCase(val.trim()).length ? true : 'You have to provide a name',
        filter: (val) => pascalCase(val.trim())
      },
      {
        name: 'dest',
        message: currentAnswers((answers) => {
          let { type, name } = answers
          let component = colors.yellow(`components/${name}.js`)
          
          if (type === 'app') {
            let renderer = colors.yellow(`${paramCase(name)}.js`)
            return `Where do you want to place renderer ${renderer} and ${component}?`
          } else {
            return `Where do you want to place ${component}?`
          }
        }),
        default: this.longterm.get('dest') || 'lib',
        validate: (val) => paramCasePath(val).length ? true : 'You have to provide a destination',
        filter: paramCasePath
      },
      {
        type: 'list',
        name: 'style',
        message: 'Which style do you prefer?',
        default: this.longterm.get('style') || 'es6',
        choices: Object.keys(STYLES).map(name => {
          let snippet = colors.gray(STYLES[name])
          return { name: `${name}  ${snippet}`, value: name }
        }),
        validate: (choice) => { // Used to validate option
          let choices = Object.keys(STYLES)
          if (choices.indexOf(choice) >= 0) return true
          return 'Must be one of ' + JSON.stringify(choices)
        }
      },
      {
        type: 'confirm',
        name: 'pureRender',
        message: 'Do you wish to use pure render components?',
        default: bool(this.longterm.get('pureRender'), true),
        validate: (b) => typeof b === 'boolean' || 'Must be a boolean'
      },
      {
        type: 'confirm',
        name: 'router',
        message: 'Do you need React Router?',
        default: bool(this.longterm.get('router'), true),
        validate: (b) => typeof b === 'boolean' || 'Must be a boolean'
      },
      {
        type: 'confirm',
        name: 'bootstrap',
        message: 'Would you like some React Bootstrap?',
        default: bool(this.longterm.get('bootstrap'), true),
        validate: (b) => typeof b === 'boolean' || 'Must be a boolean'
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
      this.ctx = new Context(answers)
      done()
    })
  }

  _assertIsValidOption(name, value, validate) {
    let valid = validate(value)
    if (valid !== true) {
      throw new Error(`Invalid value for option "${name}": ${valid}`)
    }
  }

  _isValidOption(name, value, validate) {
    return validate(value) === true
  }

  writing() {
    let { ctx } = this
    let { dest, type, name } = ctx

    let paramName = ctx.paramName = paramCase(name)

    let copy = (tpl, path) => {
      this.fs.copyTpl
        ( this.templatePath(tpl)
        , this.destinationPath(`${dest}/${path}`)
        , ctx )
    }

    if (type === 'app') {
      copy('app-render.js', 'index.js')
      copy('components/app.js', `components/${paramName}.js`)
    } else if (type === 'component') {
      copy('components/component.js', `components/${paramName}.js`)
    } else if (type === 'higher-order-component') {
      this.log.info('Not yet implemented: higher order component')
    }

    let deps = { 'react': '~0.14.0', 'react-dom': '~0.14.0' }

    if (ctx.router) deps['react-router'] = null // use latest
    if (ctx.pureRender) deps['react-pure-render'] = null
    if (ctx.bootstrap) deps['react-bootstrap'] = null

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

class Context {
  constructor(props) {
    Object.keys(props).forEach(k => { this[k] = props[k] })
  }

  imports(modules) {
    let single = [], multiple = []

    Object.keys(modules).forEach(module => {
      if (modules[module] === false) return

      let imports = modules[module]
        , main = imports[0] || false
        , rest = Array.isArray(imports[1]) && imports[1][0] ? imports[1] : false
        , resolved = module.replace(/\$paramName/g, this.paramName) // tmp hack

      if (main === false && rest === false) return

      if (this.style === 'es6') {
        // [A, [B, C]] => import A, { B, C }
        let imp = [main, rest ? '{ ' + rest.join(', ') + ' }' : '' ].filter(k=>k).join(', ')
        single.push(`import ${imp} from '${resolved}'`)
      } else {
        if (main || this.style === 'es5') {
          main = main || pascalCase(resolved.split(/\.?[\/\\]+/)[0])
          single.push(`${main} = require('${resolved}')`)
        }

        if (rest) {
          if (this.style === 'es5') {
            rest.forEach(imp => single.push(`${imp} = ${main}.${imp}`))
          } else {
            let imp = '{ ' + rest.join(', ') + ' }'
            let mod = main ? main : `require('${resolved}')`
            multiple.push(`${imp} = ${mod}`)
          }          
        }
      }
    })

    if (this.style === 'es6') return single.join('\n')

    let group = (a) => a.length ? 'var ' + a.join('\n  , ') : ''
    if (single.length <= 1) return [group(single), group(multiple)].filter(k=>k).join('\n')
    return [group(single), group(multiple)].filter(k=>k).join('\n\n')
  }
}
