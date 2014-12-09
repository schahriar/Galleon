var gulp = require('gulp');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var browserify = require('browserify');
var uglify = require('gulp-uglify');

gulp.task('watch', function() {
  var bundler = watchify(browserify('./seascape/public/scripts/master.js', watchify.args));

  // Optionally, you can apply transforms
  // and other configuration options on the
  // bundler just as you would with browserify
  // bundler.transform('brfs');

  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
      // log errors if they happen
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source('bundle.js'))
	  .pipe(uglify())
      .pipe(gulp.dest('./seascape/public/dist'));
  }

  return rebundle();
});
