'use strict';

const test = require('tape')
    , fs = require('fs')
  , { join } = require('path')
    , run = require('./util/runner')('generators/app')

test('defaults', (t) => {
  t.plan(2)

  run({ options: { skipCache: true }}, (err, ctx) => {
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
      paramName: 'app',
      state: 'none'
    }

    t.deepEqual(ctx.generator.ctx, expected)
  })
})
