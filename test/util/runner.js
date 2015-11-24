const { resolve } = require('path')
    , { test: helpers } = require('yeoman-generator')

// Because Yeoman changes working directory, get it early
const CWD = process.cwd()
    , noop = () => {}
    , unhandled = (err) => { if (err) throw err }
    , methods = [ 'withOptions'
                , 'withPrompts'
                , 'withArguments'
                , 'withLocalConfig'
                , 'withGenerators'
                , 'on' ]

module.exports = function runner(opts) {
  if (typeof opts === 'string') opts = { root: opts }

  const { root = '.', queue = [], ...sharedSpec } = opts || {}

  function next(fn = queue.shift()) {
    if (fn) setImmediate(fn)
    else queue.running = false
  }

  return function run(generator = '.', spec = {}, done = unhandled) {
    if (typeof generator === 'function') { // (done)
      done = generator, generator = '.'
    } else if (typeof generator !== 'string') { // (spec[, done])
      done = spec || unhandled, spec = generator, generator = '.'
    } else if (typeof spec === 'function') { // (generator, done)
      done = spec, spec = {}
    }

    const merged = {...sharedSpec, ...spec}
      , { options, prompts, args, config, generators, ...rest } = merged
        , path = resolve(CWD, root, generator)
        , unknown = Object.keys(rest)
        , init = []

    if (unknown.length) {
      throw new Error('Unknown run spec(s): ' + unknown.join(', '))
    }

    function start() {
      const ctx = helpers.run(path)
          , end = (err) => { ctx._run = noop, next(), done(err, ctx) }

      // Shorthands
      if (options) ctx.withOptions(options)
      if (prompts) ctx.withPrompts(prompts)
      if (args) ctx.withArguments(args)
      if (config) ctx.withLocalConfig(config)
      if (generators) ctx.withGenerators(generators)

      ctx.on('end', end).on('error', end)

      // Add error handling to async(): abort on error
      const async = ctx.async.bind(ctx)

      ctx.async = () => {
        let done = async()
        return (err) => {
          if (err) end(err)
          else done()
        }
      }

      init.forEach(fn => fn(ctx, merged))
    }

    if (!queue.running) {
      queue.running = true
      next(start)
    } else {
      queue.push(start)
    }

    const proxy = (fn) => ( init.push(fn), proxy )

    // Make inTmpDir and inDir asynchronous by default
    proxy.inTmpDir = (fn) => {
      init.push(ctx => ctx.inTmpDir(absolute => {
        fn(absolute, ctx.async())
      }))

      return proxy
    }

    proxy.inDir = (dir, fn) => {
      init.push(ctx => ctx.inDir(dir, (absolute) => {
        fn(absolute, ctx.async())
      }))

      return proxy
    }

    // Forward the rest as-is
    methods.forEach(method => {
      proxy[method] = (...args) => {
        init.push(ctx => ctx[method].apply(ctx, args))
        return proxy
      }
    })

    return proxy
  }
}
