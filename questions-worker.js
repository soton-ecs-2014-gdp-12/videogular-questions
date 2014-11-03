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
  result: ...
}

{
  resultFinished: questionid|annotationid
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

		var firstQuestion = annotation.questions[0];

		postMessage({
			showQuestion: firstQuestion
		});
	}

	function submitPollResult(response, annotationId, questionId) {
		var xhr = new XMLHttpRequest();
		var toSend = JSON.stringify({questionResult:questionId, annotation:annotationId, result:response});
		xhr.open("POST",self.pollServerUrl,true);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(toSend);	
	}

	function configSet(configData) {
		if(configData.config.pollServerUrl != undefined){
			self.pollServerUrl = configData.config.pollServerUrl;
		}
	}

	// called when the user answers a question
	function questionResult(message, annotations) {
		var questionId = message.questionResult;
		var annotationId = message.annotation;
		var response = message.response;

		var annotation = annotations[annotationId];

		var question;
		var questions = annotation.questions.slice(); // shallow copy

		while (questions.length !== 0) {
			question = questions.shift();

			if (question.id === questionId) {
				// attach the response given to the question, as this is used in the
				// action and condition functions
				question.response = response;

				if (question.recordsResponse){
					submitPollResult(response, annotationId, questionId);
				}

				// determine if any actions need to be performed
				if ("action" in question) {
					question.action(new Questions(annotation.questions), video);
				}

				break;
			}
		}

		if (questions.length === 0) {
			postMessage({
				"endAnnotation": annotationId
			});

			return;
		}

		// find the next question to display
		while (questions.length !== 0) {
			question = questions.shift();

			if ("condition" in question) {
				var conditionResult = question.condition(new Questions(annotation.questions));

				if (!conditionResult) {
					continue;
				}
			}

			postMessage({
				"showQuestion": getJSONQuestion(question)
			});

			return;
		}

		// if this point has been reached, the annotation has ended as all the
		// conditions on the remaining questions evaluated to false.
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
		}
	}

	// custom class used in the action and condition functions
	function Questions(questions) {
		var self = this;
		questions.forEach(function(question) {
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
		}
	}
	Questions.prototype = Array.prototype;

	// custom class used in the action and condition functions
	function Question() {
		this.isCorrect = function() {
			if (typeof(this.correctAnswer) === "undefined") {
				return;
			}

			return this.correctAnswer === this.response;
		}
		this.isNotCorrect = function() {
			return !this.isCorrect();
		}
	}

	// returns a representation of a question suitable for sending to the
	// fronted. The message passing interface cannot send objects that contain
	// functions.
	function getJSONQuestion(question) {
		return JSON.parse(JSON.stringify(question));
	}

	self.loadAnnotations = function(annotations) {
		publishAnnotations(annotations);

		var handlers = {
			"annotationStart": annotationStart,
			"questionResult": questionResult,
			"config": configSet
		};

		onmessage = function(e) {
			var message = e.data;
			var id, annotation;

			for (var key in handlers) {
				if (key in message) {
					handlers[key](message, annotations);
					break;
				}
			}
		};
	}
})();
