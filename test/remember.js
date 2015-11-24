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
