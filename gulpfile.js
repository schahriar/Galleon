var gulp = require('gulp');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var less = require('gulp-less');
var path = require('path');

gulp.task('less', function () {
  gulp.src('./seascape/public/stylesheets/*.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('./seascape/public/stylesheets/'));
});

gulp.task('watch', function() {
  var bundler = watchify(browserify('./seascape/public/scripts/master.js', watchify.args));

  var less = gulp.watch('./seascape/public/stylesheets/*.less',['less']);

  bundler.on('update', rebundle);
  bundler.on('time', function(time){
	gutil.log(gutil.colors.cyan('Browserify took: '),time,gutil.colors.red('ms'));
  });

  function rebundle() { 
    return bundler.bundle()
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source('./seascape/public/dist/bundle.js'))
      .pipe(streamify(uglify()))
      .pipe(gulp.dest('./'));
  }

  return rebundle();
});
