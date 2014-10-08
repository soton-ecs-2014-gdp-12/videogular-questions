(function(){
"use strict";
angular.module("uk.ac.soton.ecs.videogular.plugins.questions", ['angularCharts'])
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
							$scope.question = $scope.questionData.question;
							$scope.options = $scope.questionData.options;
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
		"vgAnnotation", ["VG_STATES",
			function(VG_EVENTS) {
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
						annotationData: "=vgAnnotationData",
					},
					template: "<vg-question ng-repeat='question in questions' ng-if='shouldRenderQuestion(question)' vg-question-data='question'></vg-question>",
					link: function($scope, elem, attr, API) {

						$scope.shouldRenderQuestion = function(question){
							return ($scope.idThatShouldBeShown === question.id);
						};

						$scope.init = function() {
							$scope.questions = $scope.annotationData.questions;
							for (var i = 0; i <= $scope.questions.length - 1; i++) {
								$scope.questions[i].id = i;
							}
							$scope.idThatShouldBeShown = 0;
						};

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
