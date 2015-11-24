'use strict';

const test = require('tape')
    , fs = require('fs')
  , { join } = require('path')
    , run = require('./util/runner')('generators/app')

test('saves dependencies', (t) => {
  t.plan(2)

  run({ options: { force: true, skipCache: true } }, (err) => {
    t.notOk(err)

    let expected = ['react', 'react-dom', 'react-pure-render', 'react-router']
      , pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      , actual = Object.keys(pkg.dependencies)

    t.deepEqual(actual.sort(), expected.sort())
  }).inTmpDir((dir, done) => {
    fs.writeFile(join(dir, 'package.json'), '{}', done)
  })
})
