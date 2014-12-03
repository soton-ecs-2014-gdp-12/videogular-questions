/* jshint worker: true */
/* global XMLHttpRequest */
/*
Events from videogular-questions

sent at the beginning with general vg-questions config
{
	config: {
		pollserverUrl: ...,
		...
	}
} 

sent when a particular annotation is reached in the video
{
  annotationStart: annotationId
}

sent when a question is answered
{
  questionResult: questionId,
  annotation: annotationid
  response: ...
}

{
  resultFinished: resultid,
  annotation: annotationid
}

Messages from the WebWorker

update the list of annotations
{
  annotations: [
    annotation...
  ]
}

show a question
{
  showQuestion: aQuestion
}

show some results
{
  showResults: someResults
}

end the annotation
{
  endAnnotation: annotations
}

set the video time
{
  setTime: time (time is seconds from the start of the video)
}
*/

(function() {
	"use strict";

	// update the list of annotations that the frontend has
	function publishAnnotations(annotations) {
		var response = {
			annotations: []
		};

		for (var id in annotations) {
			response.annotations.push({
				id: id,
				time: annotations[id].time
			});
		}

		postMessage(response);
	}

	// called when the frontend reaches an annotation in the video
	function annotationStart(message, annotations) {
		var id = message.annotationStart;
		var annotation = annotations[id];

		showNextItem(null, id, annotations);
	}

	function submitPollResult(response, annotationId, questionId) {
		var xhr = new XMLHttpRequest();
		var toSend = JSON.stringify({questionResult:questionId, annotation:annotationId, result:response});
		xhr.open("POST",self.pollServerUrl + "vote" ,true);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(toSend);
	}

	function getPollResults(annotationId, questionId, callback) {
		var xhr = new XMLHttpRequest();

		var url = self.pollServerUrl + "results/" + annotationId + "/" + questionId;

		xhr.onload = function() {
			callback(JSON.parse(this.responseText));
		}
		xhr.open("GET", url, true);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send();
	}

	function configSet(configData) {
		if(typeof configData.config.pollServerUrl !== 'undefined'){
			self.pollServerUrl = configData.config.pollServerUrl;
		}
	}

	// called when the user answers a question
	function itemResult(message, annotations) {
		var previousItem = {};

		var annotationId = message.annotation;

		if ("response" in message) {
			// questionResult
			previousItem.id = message.questionResult;
			previousItem.response = message.response;
			previousItem.type = "question";
		} else {
			previousItem.id = message.resultFinished;
			previousItem.type = "result";
		}

		showNextItem(previousItem, annotationId, annotations);
	}

	function showNextItem(previousItem, annotationId, annotations) {
		var annotation = annotations[annotationId];

		var item;
		var items = annotation.items.slice(); // shallow copy

		if (previousItem !== null) {
			while (items.length !== 0) {
				item = items.shift();

				if (item.id === previousItem.id) {
					if (previousItem.type === "question") {
						// attach the response given to the question, as this is used in the
						// action and condition functions
						item.response = previousItem.response;

						if (item.recordsResponse) {
							submitPollResult(previousItem.response, annotationId, previousItem.id);
						}
					}

					// determine if any actions need to be performed
					if ("action" in item) {
						item.action(new Questions(annotation.items), video);
					}

					break;
				}
			}
		}

		if (items.length === 0) {
			postMessage({
				"endAnnotation": annotationId
			});

			return;
		}

		// find the next item to display
		while (items.length !== 0) {
			item = items.shift();

			if ("condition" in item) {
				var conditionResult = item.condition(new Questions(annotation.items));

				if (!conditionResult) {
					continue;
				}
			}

			if ("questionId" in item) {
				getPollResults(annotationId, item.questionId, function(results) {
					console.log("results");
					console.log(results);

					var safeItem = getJSONItem(item)
					safeItem.results = results;

					var question = null;
					outerLoop:
					for (var a in annotations) {
						var searchAnnotation = annotations[a];
						for (var i in searchAnnotation.items) {
							var testQuestion = searchAnnotation.items[i];

							if (testQuestion.id === item.questionId) {
								question = testQuestion;
								break outerLoop;
							}
						}
					}

					if (question === null) {
						console.error("could not find question with id " + item.questionId);
					}

					if (question.type === "single") {
						question.options.forEach(function(option) {
							if (!(option.name in results)) {
								results[option.name] = 0;
							}
						});

						safeItem.correctAnswer = question.correctAnswer;
					} else if (question.type === "multiple") {
						question.options.forEach(function(option) {
							if (!(option.name in results)) {
								results[option.name] = 0;
							}
						});

						safeItem.correctAnswer = question.correctAnswer;
					} else {
						console.error("unhandled results type " + question.type);
					}

					safeItem.type = question.type;
					safeItem.question = question.question;

					postMessage({
						"showResults": safeItem
					});
				});
			} else {
				postMessage({
					"showQuestion": getJSONItem(item)
				});
			}

			return;
		}

		// if this point has been reached, the annotation has ended as all the
		// conditions on the remaining items evaluated to false.
		postMessage({
			"endAnnotation": annotationId
		});
	}

	// video object passed to the action function
	var video = {
		setTime: function(time) {
			postMessage({
				setTime: time
			});
		},
	};

	// custom class used in the action and condition functions
	function Questions(items) {
		var self = this;
		items.forEach(function(question) {
			var q = JSON.parse(JSON.stringify(question));

			question = new Question();

			for (var p in q) {
				question[p] = q[p];
			}

			self.push(question);
		});

		this.get = function(id) {
			for (var i in this) {
				var question = this[i];
				if (question.id === id) {
					return question;
				}
			}
		};
	}
	Questions.prototype = Array.prototype;

	// custom class used in the action and condition functions
	function Question() {
		this.isCorrect = function() {
			if (typeof(this.correctAnswer) === "undefined") {
				return;
			}

			return this.correctAnswer === this.response;
		};
		this.isNotCorrect = function() {
			return !this.isCorrect();
		};
	}

	// returns a representation of a item suitable for sending to the
	// fronted. The message passing interface cannot send objects that contain
	// functions.
	function getJSONItem(item) {
		return JSON.parse(JSON.stringify(item));
	}

	self.loadAnnotations = function(annotations) {
		publishAnnotations(annotations);

		var handlers = {
			"annotationStart": annotationStart,
			"questionResult": itemResult,
			"resultFinished": itemResult,
			"config": configSet
		};

		onmessage = function(e) {  // jshint ignore:line
			var message = e.data;
			var id, annotation;

			for (var key in handlers) {
				if (key in message) {
					handlers[key](message, annotations);
					break;
				}
			}
		};
	};
})();
