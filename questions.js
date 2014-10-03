"use strict";
angular.module("uk.ac.soton.ecs.videogular.plugins.questions", [])
	.directive(
		"vgPoll", ["VG_STATES",
			function(VG_EVENTS){
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
						pollData : "=vgPollData"
					},
					templateUrl: 'bower_components/videogular-questions/poll.html',
					link: function($scope, elem, attr, API) {
						$scope.$watch('pollData', function(newVal, OldVal) {
							//newVal is currently the time
							$scope.question = newVal.questions[0].question;
							$scope.options = newVal.questions[0].options;
						})
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
		"vgQuestions", ["VG_STATES", "$http",
			function(VG_EVENTS, $http){
				return {
					restrict: "E",
					require: "^videogular",
					scope: {
						theme: "=vgQuestionsTheme",
						questions: "=vgQuestionsData"
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
								if (newVal !== 0 && newVal.getTime()>$scope.stopTime*1000){
									API.pause();
									$scope.pollData = $scope.dataStore[0];
									$scope.showLayer = true;
								}
							}
						);

						$scope.parseQuestionData = function(data){
							$scope.stopTime = data[0].time;
							$scope.dataStore = data;
						}

						$scope.init = function() {
							$scope.showLayer = false;
							$scope.updateTheme($scope.theme);
							$http.get($scope.questions).success( 
								function(data){
									$scope.parseQuestionData(data);
								}
							);
						};

						$scope.init();
					}

				}
			}
		]
	);
	