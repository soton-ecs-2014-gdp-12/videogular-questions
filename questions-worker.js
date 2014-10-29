/*
Events from videogular-questions

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

	function publishAnnotations(annotations) {
		var thing = {
			annotations:[]
		};
		for (var id in annotations) {
			thing.annotations.push({
				id: id,
				time: annotations[id].time
			});
		}

		postMessage(thing);
	}

	function annotationStart(message, annotations) {
		id = message.annotationStart;

		annotation = annotations[id];

		var firstQuestion = annotation.questions[0];

		postMessage(
			{
				showQuestion: firstQuestion
			}
		);
	}

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

	function getJSONQuestion(question) {
		return JSON.parse(JSON.stringify(question));
	}

	function questionResult(message, annotations) {
		var questionId = message.questionResult;
		var annotationId = message.annotation;
		var response = message.response;

		var annotation = annotations[annotationId];

		var question;
		var questions = annotation.questions.slice(); // shallow copy

		while (questions.length !== 0) {
			console.log("looking to determine the next question");

			question = questions.shift();

			console.log("looking at question " + question.id);

			if (question.id === questionId) {
				// determine if any actions need to be performed

				question.response = response;

				if ("action" in question) {
					var fq = new Questions(annotation.questions);
					question.action(fq, {
						setTime: function(time) {
							postMessage({
								setTime: time
							});
						}
					});
				}

				break;
			}
		}

		console.log("checking for remaining questions");

		if (questions.length === 0) {
			console.log("no remaining questions");
			postMessage({
				"endAnnotation": annotationId
			});

			return;
		}

		while (questions.length !== 0) {
			question = questions.shift();

			if ("condition" in question) {
				var condition = question.condition;

				var fq = new Questions(annotation.questions);

				var conditionResult = condition(fq);

				if (!conditionResult) {
					continue;
				}
			}

			// The parse and stringify is a crude but effective way of removing any
			// functions in the object
			postMessage({
				"showQuestion": getJSONQuestion(question)
			});

			return;
		}

		postMessage({
			"endAnnotation": annotationId
		});
	}

	self.loadAnnotations = function(annotations) {
		publishAnnotations(annotations);

		var handlers = {
			"annotationStart": annotationStart,
			"questionResult": questionResult
		};

		onmessage = function(e) {
			var message = e.data;
			var id, annotation;

			console.log("message from page " + JSON.stringify(message));

			for (var key in handlers) {
				if (key in message) {
					handlers[key](message, annotations);
					break;
				}
			}
		};
	}
})();
