"use strict";
angular.module("uk.ac.soton.ecs.videogular.plugins.questions", [])
	.directive(
		"vgPoll", ["VG_STATES",
			function(VG_EVENTS){
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
					},
					templateUrl: 'bower_components/videogular-questions/poll.html',
					link: function($scope, elem, attr, API) {
					}

				}
			}
		]
	)
	.directive(
		"vgQuiz", ["VG_STATES",
			function(VG_EVENTS){
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
					},
					templateUrl: 'bower_components/videogular-questions/quiz.html',
					link: function($scope, elem, attr, API) {
					}

				}
			}
		]
	)
	.directive(
		"vgQuestions", ["VG_STATES",
			function(VG_EVENTS){
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
						theme: "=vgQuestionsTheme",
					},
					templateUrl: 'bower_components/videogular-questions/questions.html',
					link: function($scope, elem, attr, API) {

						//shamelessly stolen from part of videogular's updateTheme function 
						$scope.updateTheme = function (value) {
							if (value) {
								var headElem = angular.element(document).find("head");
								headElem.append("<link rel='stylesheet' href='" + value + "'>");
							}
						};

						$scope.$watch(
							function() {
								return API.currentTime
							},
							function(newVal, oldVal){
								if (newVal !== 0 && newVal.getTime()>10000){
									API.pause();
									$scope.showLayer = true;
								}
							}
						);

						$scope.init = function () {
							$scope.showLayer = false;
							$scope.updateTheme($scope.theme);
						};

						$scope.init();
					}

				}
			}
		]
	);
	