"use strict";
angular.module("uk.ac.soton.ecs.videogular.plugins.questions", [])
	.directive(
		"vgQuestions", ["VG_STATES",
			function(VG_EVENTS){
				return {
					restrict: "E",
					require: "^videogular",
					scope: {

					},
					link: function(scope, elem, attr, API) {
						scope.$watch(
							function() {
								return API.currentTime
							},
							function(newVal, oldVal){
								if (newVal !== 0 && newVal.getTime()>10000){
									API.pause();
								}
							}
						);
					}

				}
			}
		]
	);