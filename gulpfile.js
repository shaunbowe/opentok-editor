var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

gulp.task('default', function(){
    gulp.src('src/*.js')
        .pipe(jshint())
        .pipe(concat('opentok-editor.js'))
        .pipe(gulp.dest('./'))
        .pipe(uglify({preserveComments: "some"}))
        .pipe(rename('opentok-editor.min.js'))
        .pipe(gulp.dest('./'));
});