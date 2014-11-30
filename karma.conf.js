module.exports = function(config) {
  config.set({

    basePath : './',

    files : [
      'questions-worker-tests.js',
      {
        pattern: 'tests/*.js',
        included: false
      },
      {
        pattern: 'questions-worker.js',
        included: false
      }
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};
