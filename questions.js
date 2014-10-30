(function(){
"use strict";
angular.module("uk.ac.soton.ecs.videogular.plugins.questions", ['angularCharts'])
	.factory("webWorkerFactory", function () {
		var webWorker = {};

		var handlers = {
			"annotations": [],
			"showQuestion": [],
			"showResults": [],
			"endAnnotation": [],
			"setTime": []
		};

		webWorker.init = function(schema, pollServerURL) {
			webWorker.worker = new Worker(schema);
			webWorker.sendEvent({"config": pollServerURL});

			webWorker.worker.addEventListener("message", function(e) {
				var data = e.data;
				console.log("message from worker");
				console.log(data);

				for (var key in handlers) {
					if (key in data) {
						handlers[key].forEach(
							function(callback){
								callback(data);
							}
						);

						break;
					}
				}
			} ,false);
		}

		webWorker.addAnnotationsListUpdateCallback = function(callback) {
			handlers.annotations.push(callback);
		}

		webWorker.addEndAnnotationCallback = function(callback) {
			handlers.endAnnotation.push(callback);
		}

		webWorker.addShowQuestionCallback = function(callback) {
			handlers.showQuestion.push(callback);
		}

		webWorker.addSetTimeCallback = function(callback) {
			handlers.setTime.push(callback);
		}

		webWorker.annotationStart = function(id) {
			console.log("send annotation start");
			var obj = {
				"annotationStart": id
			};
			webWorker.sendEvent(obj);
		}

		webWorker.questionResult = function(questionId, annotationid, response) {
			var obj =  {
				"questionResult": questionId,
				"annotation": annotationid,
				"response": response
			};

			console.log("calling send event");
			webWorker.sendEvent(obj);
		}

		webWorker.sendEvent = function(obj) {
			console.log("posting msg")
			webWorker.worker.postMessage(obj);
		}

		return webWorker
	})
	.directive(
		"vgQuestionSubmit", ["VG_STATES",
			function(VG_EVENTS) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
					},
					template: '<button class="btn btn-primary" type="button" ng-disabled="$parent.onSubmitDisabled()" ng-click="$parent.onSubmitClick()">Submit</button>',
					link: function($scope, elem, attr, API) {

						$scope.init = function() {
						};

						$scope.init();
					},
				};
			}
		]
	)
	.directive(
		"vgQuestionSkip", ["VG_STATES",
			function(VG_EVENTS) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
					},
					template: '<button class="btn btn-primary" type="button" ng-click="$parent.onSkipClick()">Skip</button>',
					link: function($scope, elem, attr, API) {

						$scope.init = function() {
						};

						$scope.init();
					},
				};
			}
		]
	)
	.directive(
		"vgQuestionMultiple", ["VG_STATES",
			function(VG_EVENTS) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
						questionData: "=vgQuestionData",
					},
					templateUrl: 'bower_components/videogular-questions/question-multiple.html',
					link: function($scope, elem, attr, API) {

						$scope.init = function() {
						};

						$scope.onSubmitClick = function(event){
							$scope.$emit('submitted');
						};

						$scope.onSkipClick = function(event){
							$scope.$emit('skipped');
						};

						$scope.onSubmitDisabled = function(event){
							for (var i = $scope.questionData.options.length - 1; i >= 0; i--) {
								if ($scope.questionData.options[i].chosen)
									return false;
							};
							return true;
						};

						$scope.init();
					},
				};
			}
		]
	)
	.directive(
		"vgQuestionSingle", ["VG_STATES",
			function(VG_EVENTS) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
						questionData: "=vgQuestionData",
					},
					templateUrl: 'bower_components/videogular-questions/question-single.html',
					link: function($scope, elem, attr, API) {

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
			}
		]
	)
	.directive(
	"vgQuestionStars", ["VG_STATES",
		function(VG_EVENTS) {
			return {
				restrict: "E",
				require: "^videogular",
				scope: {
					questionData: "=vgQuestionData",
				},
				templateUrl: 'bower_components/videogular-questions/question-stars.html',
				link: function($scope, elem, attr, API) {

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
						return $scope.questionData.rating === 0;
					};

					$scope.init();
				},
			};
		}
	]
)
	.directive(
	"vgQuestionText", ["VG_STATES",
		function(VG_EVENTS) {
			return {
				restrict: "E",
				require: "^videogular",
				scope: {
					questionData: "=vgQuestionData",
				},
				templateUrl: 'bower_components/videogular-questions/question-text.html',
				link: function($scope, elem, attr, API) {

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
		}
	]
)

	.directive(
	"vgQuestionRange", ["VG_STATES",
		function(VG_EVENTS) {
			return {
				restrict: "E",
				require: "^videogular",
				scope: {
					questionData: "=vgQuestionData",
				},
				templateUrl: 'bower_components/videogular-questions/question-range.html',
				link: function($scope, elem, attr, API) {

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
		}
	]
)

	.directive(
		"vgResult", ["VG_STATES",
			function(VG_EVENTS) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
						resultData: "=vgResultData",
					},
					templateUrl: 'bower_components/videogular-questions/result.html',
					link: function($scope, elem, attr, API) {

						$scope.init = function() {
						};

						$scope.onSubmitClick = function(event){
							$scope.$emit('submitted',{});
						};

						$scope.onSkipClick = function(event){
							$scope.$emit('skipped');
						};

						$scope.init();
					},
				};
			}
		]
	)
	.directive(
		"vgQuestion", ["VG_STATES",
			function(VG_EVENTS) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
					},
					templateUrl: 'bower_components/videogular-questions/question.html',
					link: function($scope, elem, attr, API) {

						$scope.init = function() {
						};

						$scope.$on('showQuestion', 
							function(event, args){
								console.log(args);
								$scope.questionData = args;
							}
						);

						$scope.$on('submitted', 
							function(event,args){
								event.stopPropagation();
								args.questionResult = $scope.questionData.id;
								$scope.$parent.$emit('submitted', args);
							}
						);

						$scope.init();
					},
				};
			}
		]
	)
	.directive(
		"vgAnnotation", ["VG_STATES",
			function(VG_EVENTS) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
					},
					templateUrl: "bower_components/videogular-questions/annotation.html",
					link: function($scope, elem, attr, API) {

						$scope.init = function() {
							$scope.shouldShow = {question:false, result:false};
						};

						$scope.$on('showQuestion', 
							function(event, args){
								$scope.shouldShow.question = true;
								$scope.questionData = args;
							}
						);

						$scope.$on('submitted', 
							function(event,args){
								event.stopPropagation();
								args.annotation = $scope.questionData.annotation;
								$scope.$parent.$emit('submitted', args);
							}
						);

						$scope.init();
					},
				};
			}
		]
	)
	.directive(
		"vgQuestions", ["VG_STATES", "$http", "webWorkerFactory",
			function(VG_EVENTS, $http, webWorker) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
						theme: "=vgQuestionsTheme",
						questions: "=vgQuestionsData",
						pollServerUrl: "=vgPollServerUrl"
					},
					template: "<vg-annotation ng-show='shouldShow.annotation'></vg-annotation>",
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

						function parseQuestionData(data) {
							$http.get("bower_components/videogular-questions/schema.json").success(
								function(schema) {
									var cleanData = JSON.parse(angular.toJson(data));
									var env = new jjv();
									env.addSchema('s', schema);
									var result = env.validate('s', data);

									if (result !== null) {
										console.warn("validation error");
										console.log(result);
									}

									$scope.annotations = data;
								}
							);
						}

						$scope.init = function() {
							$scope.shouldShow = {annotation : false};
							updateTheme($scope.theme);
							webWorker.init($scope.questions, {"pollServerUrl": $scope.pollServerUrl});
							webWorker.addAnnotationsListUpdateCallback(
								function(data){
									console.log("I just got some new times to stop at");
									console.log(data);
									$scope.annotations = data.annotations;
								}
							);
							webWorker.addShowQuestionCallback(
								function(data){
									console.log("I just got some a question to show");
									console.log(data);
									$scope.shouldShow.annotation = true;
									data.showQuestion.annotation = $scope.currentAnnotation;
									$scope.$broadcast('showQuestion', data.showQuestion);
									$scope.$apply();
								}
							);
							webWorker.addEndAnnotationCallback(
								function(data){
									console.log("Ending the annotation");
									$scope.shouldShow.annotation = false;
									$scope.$apply();
									API.play();
								}
							);
							webWorker.addSetTimeCallback(
								function(data){
									console.log("Setting time");
									API.seekTime(data.setTime);
								}
							);

							
						};

						$scope.$on('submitted', 
							function(event,args){
								console.log('submitted');
								console.log(args);
								webWorker.questionResult(args.questionResult, args.annotation, args.result);
							}
						);

						$scope.$on('skipped',
							function(args){
							}
						);

						$scope.$on('annotationEnd', 
							function(event, args){
								args.show = false;
								args.shown = true;
								API.play();
							}
						);

						$scope.init();
					},
				};
			}
		]
	);
})();
