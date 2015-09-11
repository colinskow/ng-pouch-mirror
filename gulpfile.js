var fs = require('fs');
var gulp = require('gulp');
var karma = require('karma').server;
var jshint = require('gulp-jshint');
var header = require('gulp-header');
var footer = require('gulp-footer');
var ngAnnotate = require('gulp-ng-annotate');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var gulpCopy = require('gulp-copy');
var del = require('del');

var pkg = require('./package.json');
var prefix = fs.readFileSync('./src/ng-pouch-mirror.prefix');
var suffix = fs.readFileSync('./src/ng-pouch-mirror.suffix');

gulp.task('default', ['lint']);

gulp.task('lint', function() {
  return gulp.src('./src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

// Tests coming soon
/* gulp.task('test', ['lint'], function (done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
}); */

gulp.task('clean:dist', ['lint'], function () {
  return del([
    'dist/**/*',
    '!dist/.git/**/*'
  ]);
});

gulp.task('copy', ['clean:dist'], function() {
  return gulp.src(['./README.md', './LICENSE', './bower.json'])
    .pipe(gulpCopy('./dist/'));
});

gulp.task('build', ['lint', 'clean:dist', 'copy'], function() {
  gulp.src('./src/*.js')
    .pipe(ngAnnotate())
    .pipe(header(prefix, { pkg : pkg } ))
    .pipe(footer(suffix))
    .pipe(gulp.dest('./dist/'))
    .pipe(sourcemaps.init())
    .pipe(uglify({output: {comments: /^!|@preserve|@license|@cc_on/i}, outSourceMap: true}))
    .pipe(rename({extname: '.min.js'}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'));
});



