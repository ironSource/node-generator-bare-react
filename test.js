var tapMerge = require('tap-merge')
  , multi = require('multistream')
  , through2 = require('through2')
  , spawn = require('cross-spawn-async')
  , resolve = require('path').resolve
  , glob = require('glob')
  , after = require('after')
  , minimist = require('minimist')

var argv = minimist(process.argv.slice(2), {
  string: 'runner',
  default: {
    runner: 'node'
  }
})

var runner = argv.runner
  , patterns = argv._
  , files = []
  , cwd = process.cwd()

var next = after(patterns.length, function run() {
  multi(files.map(function(file) {
    var stream = through2()

    setImmediate(function() {
      var opts = { stdio: ['ignore', 'pipe', process.stderr] }
      spawn(runner, [file], opts).stdout.pipe(stream)
    })

    return stream
  })).pipe(tapMerge()).pipe(process.stdout)
})

patterns.forEach(function collect(pattern) {
  glob(pattern, function(err, results) {
    results && results.forEach(function(file) {
      files.push(resolve(cwd, file))
    })

    next(err)
  })
})
