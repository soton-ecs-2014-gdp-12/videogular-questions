/* jshint browser: true, devel: true */
(function(){
"use strict";
angular.module("uk.ac.soton.ecs.videogular.plugins.questions", ['angularCharts'])
	.factory("webWorkerFactory", function () {
		var webWorker = {};

		var handlers;

		webWorker.init = function(schema, pollServerURL) {
			webWorker.worker = new Worker(schema);
			webWorker.sendEvent({"config": pollServerURL});

			handlers = {
				"annotations": [],
				"showQuestion": [],
				"showResults": [],
				"endAnnotation": [],
				"setTime": []
			};

			webWorker.worker.addEventListener("message", function(e) {
				var data = e.data;
				console.log("message from worker");
				console.log(data);

				for (var key in handlers) {
					if (key in data) {
						console.log(handlers[key]);
						handlers[key].forEach(function(handler) {
							handler(data);
						});
						break;
					}
				}
			} ,false);
		};

		webWorker.addAnnotationsListUpdateCallback = function(callback) {
			handlers.annotations.push(callback);
		};

		webWorker.addEndAnnotationCallback = function(callback) {
			handlers.endAnnotation.push(callback);
		};

		webWorker.addShowQuestionCallback = function(callback) {
			handlers.showQuestion.push(callback);
		};

		webWorker.addSetTimeCallback = function(callback) {
			handlers.setTime.push(callback);
		};

		webWorker.addShowResultsCallback = function(callback) {
			handlers.showResults.push(callback);
		};

		webWorker.annotationStart = function(id) {
			console.log("send annotation start");
			var obj = {
				"annotationStart": id
			};
			webWorker.sendEvent(obj);
		};

		webWorker.questionResult = function(questionId, annotationid, response) {
			var obj =  {
				"questionResult": questionId,
				"annotation": annotationid,
				"response": response
			};

			console.log("calling send event");
			webWorker.sendEvent(obj);
		};

		webWorker.resultFinished = function(resultId, annotationId) {
			webWorker.sendEvent({
				resultFinished: resultId,
				annotation: annotationId
			});
		}

		webWorker.sendEvent = function(obj) {
			console.log("posting msg");
			webWorker.worker.postMessage(obj);
		};

		return webWorker;
	})
	.directive("vgQuestions", ["$http", "$compile", "webWorkerFactory", "$rootScope",
		function($http, $compile, webWorker, $rootScope) {
			return {
				restrict: "E",
				require: "^videogular",
				scope: {
					theme: "=vgQuestionsTheme",
					questions: "=vgQuestionsData",
					cuepoints: "=vgQuestionsCuepoints",
					pollServerUrl: "=vgPollServerUrl"
				},
				template: "",
				link: function($scope, elem, attr, API) {

					// shamelessly stolen from part of videogular's updateTheme function
					function updateTheme(value) {
						if (value) {
							var headElem = angular.element(document).find("head");
							headElem.append("<link rel='stylesheet' href='" + value + "'>");
						}
					}

					var shownAnnotations = {};

					$scope.$watch(
						function() {
							return API.currentTime;
						},
						function(newVal, oldVal) {
							if ($scope.annotations !== undefined && newVal !== 0 && oldVal !== 0 && newVal.getTime() !== oldVal.getTime()){
								for (var i = 0; i <= $scope.annotations.length - 1; i++) {
									var annotation = $scope.annotations[i];

									if (annotation.id in shownAnnotations) {
										continue;
									}

									var stopTime = $scope.annotations[i].time;

									if (newVal.getTime()>stopTime*1000) {
										shownAnnotations[annotation.id] = true;

										API.pause();
										console.log("time was reached -> " + newVal.getTime() + "was" + oldVal.getTime());
										webWorker.annotationStart($scope.annotations[i].id);
										$scope.currentAnnotation = $scope.annotations[i].id;
										return;
									}
								}
							}
						}
					);

					function addCuepoints(annotationList) {
						if (typeof $scope.cuepoints !== 'undefined') {
							$scope.cuepoints.points = $scope.cuepoints.points || [];

							for (var i in annotationList) {
								$scope.cuepoints.points.push({ time: annotationList[i].time });
							}
						}
					}

					var questionDirectives = {
						"single": "<vg-question-single></vg-question-single>",
						"multiple": "<vg-question-multiple></vg-question-multiple>",
						"stars": "<vg-question-stars></vg-question-stars>",
						"text": "<vg-question-text></vg-question-text>",
						"range": "<vg-question-range></vg-question-range>"
					};

					var resultsDirectives = {
						"single": "<vg-results-single></vg-results-single>",
						"multiple": "<vg-results-multiple></vg-results-multiple>"
					};

					var init = $scope.init = function() {
						$scope.shouldShow = {annotation : false};
						updateTheme($scope.theme);

						shownAnnotations = {};

						console.log("sending poll server url "+ $scope.pollServerUrl);
						webWorker.init($scope.questions, {
							"pollServerUrl": $scope.pollServerUrl
						});
						webWorker.addAnnotationsListUpdateCallback(
							function(data){
								console.log("I just got some new times to stop at");
								console.log(data);

								$scope.annotations = data.annotations;

								addCuepoints($scope.annotations);
							}
						);
						webWorker.addShowQuestionCallback(
							function(data){
								console.log("I just got some a question to show");
								console.log(data);
								$rootScope.$broadcast('analytics','show_question', data);
								document.getElementsByTagName('vg-controls')[0].style.display = 'none';

								elem.empty();

								$scope.questionData = data.showQuestion;

								var type = data.showQuestion.type;

								if (typeof(type) === "undefined" || !(type in questionDirectives)) {
									console.error("unknown question type " + type);
								}

								var directive = questionDirectives[type];

								var el = $compile(directive)($scope);
								elem.append(el);
							}
						);
						webWorker.addEndAnnotationCallback(
							function(data){
								console.log("Ending the annotation");
								$rootScope.$broadcast('analytics','end_question', data);
								document.getElementsByTagName('vg-controls')[0].style.display = '';
								elem.empty();

								API.play();
							}
						);
						webWorker.addSetTimeCallback(
							function(data){
								console.log("Setting time");
								API.seekTime(data.setTime);
							}
						);
						webWorker.addShowResultsCallback(
							function(data){
								console.log("I just got a results to show");
								console.log(data);
								$rootScope.$broadcast('analytics','show_results', data);

								elem.empty();

								$scope.resultsData = data.showResults;

								var type = data.showResults.type;

								if (typeof(type) === "undefined" || !(type in resultsDirectives)) {
									console.error("unknown results type " + type);
								}

								var directive = resultsDirectives[type];

								var el = $compile(directive)($scope);
								elem.append(el);
							}
						);
					};

					$scope.$on('submitted', function(event, args){
						$rootScope.$broadcast('analytics','submitted_question', args);
						webWorker.questionResult($scope.questionData.id, $scope.currentAnnotation, args.result);
					});

					$scope.$on('skipped',
						function(args){
						$rootScope.$broadcast('analytics','skipped_question', args);
						webWorker.questionResult($scope.questionData.id, $scope.currentAnnotation, "skipped");
						}
					);

					$scope.$on('continue', function(event, args){
						$rootScope.$broadcast('analytics','continue_question', args);
						webWorker.resultFinished($scope.resultsData.id, $scope.currentAnnotation);
					});

					$scope.$watch(
						function() {
							return $scope.questions;
						},
						function(newVal, oldVal) {
							init();
						}
					);
				},
			};
		}
	])

	// Question type directives
	.directive("vgQuestionMultiple", function() {
		return {
			restrict: "E",
			templateUrl: 'bower_components/videogular-questions/question-multiple.html',
			link: function($scope, elem, attr) {

				$scope.init = function() {
				};

				$scope.onSubmitClick = function(event){
					var options = $scope.questionData.options;
					var result = [];

					options.forEach(function(option) {
						if (option.chosen) {
							result.push(option.name);
						}
					});

					$scope.$emit('submitted', {
						result: result
					});
				};

				$scope.onSkipClick = function(event){
					$scope.$emit('skipped');
				};

				$scope.onSubmitDisabled = function(event){

					var numberChosen = 0;

					for(var i = 0; i < $scope.questionData.options.length; i++) {
						if($scope.questionData.options[i].chosen) {
							numberChosen++;
						}
					}

					if(numberChosen < $scope.questionData.min) {
						return true;
					}else if(numberChosen > $scope.questionData.max) {
						return true;
					}else{
						return false;
					}
				};

				$scope.init();
			},
		};
	})
	.directive("vgQuestionSingle", function() {
		return {
			restrict: "E",
			templateUrl: 'bower_components/videogular-questions/question-single.html',
			link: function($scope, elem, attr) {

				$scope.init = function() {
				};

				$scope.onSubmitClick = function(event){
					$scope.$emit('submitted', {
						result: $scope.questionData.chosen
					});
				};

				$scope.onSkipClick = function(event){
					$scope.$emit('skipped');
				};

				$scope.onSubmitDisabled = function(event){
					return !$scope.questionData.chosen;
				};

				$scope.init();
			},
		};
	})
	.directive("vgQuestionStars", function() {
		return {
			restrict: "E",
			templateUrl: 'bower_components/videogular-questions/question-stars.html',
			link: function($scope, elem, attr) {

				$scope.init = function() {
					var x = 1;
					$scope.stars = [];
					while(x < $scope.questionData.max + 1) {
						$scope.stars.push(x);
						x++;
					}
					$scope.questionData.rating = 0;
				};

				$scope.onSubmitClick = function(event){
					$scope.$emit('submitted',{});
				};

				$scope.onSkipClick = function(event){
					$scope.$emit('skipped');
				};

				$scope.onSubmitDisabled = function(event){
					if($scope.questionData.rating < $scope.questionData.min) {
						return true;
					}else if($scope.questionData.rating > $scope.questionData.max) {
						return true;
					}else{
						return false;
					}
				};

				$scope.init();
			}
		};
	})
	.directive("vgQuestionText", function() {
		return {
			restrict: "E",
			templateUrl: 'bower_components/videogular-questions/question-text.html',
			link: function($scope, elem, attr) {

				$scope.init = function() {
				};

				$scope.onSubmitClick = function(event){
					$scope.$emit('submitted', {
						result: $scope.questionData.chosen
					});
				};

				$scope.onSkipClick = function(event){
					$scope.$emit('skipped');
				};

				$scope.onSubmitDisabled = function(event){
					return !$scope.questionData.chosen;
				};

				$scope.init();
			},
		};
	})
	.directive("vgQuestionRange", function() {
		return {
			restrict: "E",
			templateUrl: 'bower_components/videogular-questions/question-range.html',
			link: function($scope, elem, attr) {

				$scope.init = function() {
				};

				$scope.onSubmitClick = function(event){
					$scope.$emit('submitted', {
						result: $scope.questionData.chosen
					});
				};

				$scope.onSkipClick = function(event){
					$scope.$emit('skipped');
				};

				$scope.onSubmitDisabled = function(event){
					return !$scope.questionData.chosen;
				};

				$scope.init();
			},
		};
	})

	// Utility directives for vgQuestions
	.directive("vgQuestionSubmit", function() {
		return {
			restrict: "E",
			scope: {
			},
			template: '<button class="btn btn-primary" type="button" ng-disabled="$parent.onSubmitDisabled()" ng-click="$parent.onSubmitClick()">Submit</button>',
			link: function($scope, elem, attr) {

				$scope.init = function() {
				};

				$scope.init();
			},
		};
	})
	.directive("vgQuestionSkip", function() {
		return {
			restrict: "E",
			scope: {
			},
			template: '<button class="btn btn-primary" type="button" ng-click="$parent.onSkipClick()">Skip</button>',
			link: function($scope, elem, attr) {

				$scope.init = function() {
				};

				$scope.init();
			},
		};
	})

	// Results directives
	.directive("vgResultsSingle", function() {
		return {
			restrict: "E",
			templateUrl: 'bower_components/videogular-questions/results-single.html',
			link: function($scope, elem, attr) {

				$scope.chartType = 'bar';

				var data = [];
				for (var x in $scope.resultsData.results) {
					data.push({
						x: x,
						y: [$scope.resultsData.results[x]]
					});
				}

				$scope.results = {
					data: data
				};

				$scope.onContinueClick = function(event){
					$scope.$emit('continue');
				};
			},
		};
	})

	.directive("vgResultsMultiple", function() {
		return {
			restrict: "E",
			templateUrl: 'bower_components/videogular-questions/results-multiple.html',
			link: function($scope, elem, attr) {

				$scope.chartType = 'bar';

				var data = [];
				for (var x in $scope.resultsData.results) {
					data.push({
						x: x,
						y: [$scope.resultsData.results[x]]
					});
				}

				$scope.results = {
					data: data
				};

				$scope.onContinueClick = function(event){
					$scope.$emit('continue');
				};
			},
		};
	})

	// Utility directives for results
	.directive("vgResultsContinue", function() {
		return {
			restrict: "E",
			scope: {
			},
			template: '<button class="btn btn-primary" type="button" ng-click="$parent.onContinueClick()">Continue</button>'
		};
	})

	// General utility directives
	.directive("vgBox", function() {
		return {
			restrict: "E",
			transclude: true,
			scope: {
				header: '@'
			},
			templateUrl: 'bower_components/videogular-questions/box.html'
		};
	})
})();
