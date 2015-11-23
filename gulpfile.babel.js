const gulp = require('gulp')
    , gulpif = require('gulp-if')
    , babel = require('gulp-babel')
    , rimraf = require('rimraf')

gulp.task('clean', (done) => {
  rimraf(__dirname + '/{generators-test,generators}/**/*', done)
})

gulp.task('build:generator', () => {
  const condition = (vinyl) => {
    const file = vinyl.relative
    return file.slice(-3) === '.js' && file.indexOf('templates') < 0
  }

  return gulp.src('src/**/*')
    .pipe(gulpif(condition, babel()))
    .pipe(gulp.dest('generators'))
})

gulp.task('build:test', () => {
  const condition = (vinyl) => {
    const file = vinyl.relative
    return file.slice(-3) === '.js' && file.indexOf('fixtures') < 0
  }

  return gulp.src('test/**/*')
    .pipe(gulpif(condition, babel()))
    .pipe(gulp.dest('generators-test'))
})

gulp.task('build', ['build:generator', 'build:test'])
