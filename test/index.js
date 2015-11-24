'use strict';

const test = require('tape')
    , fs = require('fs')
  , { join } = require('path')
    , run = require('./util/runner')('generators/app')

function longtermStub(def = {}) {
  const longterm = {...def}

  return {
    get: (k) => longterm[k],
    set: (k, v) => { longterm[k] = v },
    all: longterm
  }
}

test('defaults', (t) => {
  t.plan(2)

  run({ options: { skipCache: true, shortterm: false }}, (err, ctx) => {
    t.notOk(err)

    const expected = {
      type: 'app',
      name: 'App',
      dest: 'lib',
      modules: 'commonjs',
      pureRender: true,
      bootstrap: false,
      router: true,
      esnext: true,
      append: false,
      paramName: 'app'
    }

    t.deepEqual(ctx.generator.ctx, expected)
  })
})

test('longterm', (t) => {
  t.plan(5)

  run({ options: { shortterm: false, longterm: longtermStub() } }, (err, ctx) => {
    t.notOk(err)
    t.deepEqual(ctx.generator.longterm.all, {
      bootstrap: false,
      dest: 'lib',
      esnext: true,
      modules: 'commonjs',
      pureRender: true,
      router: true
    }, 'longterm contains defaults')
  })

  const longterm = { dest: 'lib/app', modules: 'es6', bootstrap: true }
      , options  = { shortterm: false
                   , longterm: longtermStub(longterm)
                   , name: 'Beep bop' }

  run({ options }, (err, ctx) => {
    t.notOk(err)
    t.deepEqual(ctx.generator.longterm.all, {
      bootstrap: true,
      dest: 'lib/app',
      esnext: true,
      modules: 'es6',
      pureRender: true,
      router: true
    }, 'longterm merged defaults')

    const answers = {
      type: 'app',
      name: 'BeepBop',
      dest: 'lib/app',
      modules: 'es6',
      pureRender: true,
      bootstrap: true,
      router: true,
      esnext: true,
      append: false,
      paramName: 'beep-bop'
    }

    t.deepEqual(ctx.generator.ctx, answers, 'longterm overwrites answers')
  })
})

test('shortterm', (t) => {
  t.plan(4*3)

  const options = { longterm: longtermStub() }

  run({ options, prompts: { dest: 'src/src', type: 'component' } }, (err, ctx) => {
    t.notOk(err)
    t.equal(ctx.generator.ctx.dest, 'src/src')
    t.equal(ctx.generator.ctx.type, 'component')
    t.equal(ctx.generator.ctx.pureRender, true)

    run({ options }, (err, ctx) => {
      t.notOk(err)
      t.equal(ctx.generator.ctx.dest, 'src/src')
      t.equal(ctx.generator.ctx.type, 'app')
      t.equal(ctx.generator.ctx.pureRender, true)

      ctx.generator.shortterm.pureRender = undefined

      run({ options, prompts: { pureRender: false } }, (err, ctx) => {
        t.notOk(err)
        t.equal(ctx.generator.ctx.dest, 'src/src')
        t.equal(ctx.generator.ctx.type, 'app')
        t.equal(ctx.generator.ctx.pureRender, false)
      })
    })
  })
})

test('saves dependencies', (t) => {
  t.plan(2)

  run({ options: { force: true, skipCache: true, shortterm: false } }, (err) => {
    t.notOk(err)

    let expected = ['react', 'react-dom', 'react-pure-render', 'react-router']
      , pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      , actual = Object.keys(pkg.dependencies)

    t.deepEqual(actual.sort(), expected.sort())
  }).inTmpDir((dir, done) => {
    fs.writeFile(join(dir, 'package.json'), '{}', done)
  })
})
