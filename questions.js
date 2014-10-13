(function(){
"use strict";
angular.module("uk.ac.soton.ecs.videogular.plugins.questions", ['angularCharts'])
	.directive(
		"vgQuestionSubmit", ["VG_STATES",
			function(VG_EVENTS) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
					},
					template: '<button class="btn btn-primary" type="button" ng-click="$parent.onSubmitClick()">Submit</button>',
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
							$scope.$emit('submitted');
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
					};

					$scope.onSubmitClick = function(event){
						$scope.$emit('submitted');
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
							$scope.$emit('submitted');
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
						questionData: "=vgQuestionData",
					},
					templateUrl: 'bower_components/videogular-questions/question.html',
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
		"vgAnnotation", ["VG_STATES",
			function(VG_EVENTS) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
						annotationData: "=vgAnnotationData",
					},
					templateUrl: "bower_components/videogular-questions/annotation.html",
					link: function($scope, elem, attr, API) {

						$scope.shouldRenderQuestion = function(question){
							return ($scope.idThatShouldBeShown === question.id);
						};

						$scope.init = function() {
							var spacing = 1;
							if($scope.annotationData.options.showResults){
								spacing = 2;
							}
							$scope.questions = [];
							for (var i = 0; i <= $scope.annotationData.questions.length - 1; i++) {
								$scope.questions[i*spacing] = $scope.annotationData.questions[i];
								$scope.questions[i*spacing].id = i*spacing;
								if($scope.annotationData.options.showResults){
									$scope.questions[i*spacing+1] = {id:i*spacing+1};
								}
							}
							$scope.idThatShouldBeShown = 0;
						};

						$scope.test = function(a){
							if (a.question)
								return "question"
							else
								return "result"
						}

						$scope.$on('submitted', 
							function(args){
								$scope.idThatShouldBeShown++;
								if ($scope.questions.length<=$scope.idThatShouldBeShown){
									$scope.$emit('annotationEnd', $scope.annotationData);
								}
							}
						);

						$scope.init();
					},
				};
			}
		]
	)
	.directive(
		"vgQuestions", ["VG_STATES", "$http",
			function(VG_EVENTS, $http) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
						theme: "=vgQuestionsTheme",
						questions: "=vgQuestionsData"
					},
					template: "<vg-annotation ng-repeat='annotation in annotations' ng-if='shouldRenderAnnotation(annotation)' vg-annotation-data='annotation'></vg-annotation>",
					link: function($scope, elem, attr, API) {

						// shamelessly stolen from part of videogular's updateTheme function
						function updateTheme(value) {
							if (value) {
								var headElem = angular.element(document).find("head");
								headElem.append("<link rel='stylesheet' href='" + value + "'>");
							}
						}

						$scope.$watch(
							function() {
								return API.currentTime;
							},
							function(newVal, oldVal) {
								if ($scope.annotations !== undefined && newVal !== 0){
									for (var i = 0; i <= $scope.annotations.length - 1; i++) {
										var stopTime = $scope.annotations[i].time;
										if (!$scope.annotations[i].shown){
											if (newVal.getTime()>stopTime*1000 && newVal.getTime()<(stopTime+1)*1000) {
												API.pause();
												$scope.annotations[i].show = true;
												return;
											}
										}
									}
								}
							}
						);

						function parseQuestionData(data) {
							$scope.annotations = data;
						}

						$scope.shouldRenderAnnotation = function(annotation) {
							return annotation.show;
						};

						$scope.init = function() {
							updateTheme($scope.theme);
							$http.get($scope.questions).success(
								function(data) {
									parseQuestionData(data);
								}
							);
						};

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
