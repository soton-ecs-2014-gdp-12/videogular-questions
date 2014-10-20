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

	function questionResult(message, annotations) {
		var questionId = message.questionResult;
		var annotationId = message.annotation;
		var result = message.result;

		var annotation = annotations[annotationId];

		console.log("annotation questions");
		console.log(annotation.questions);

		var question;
		var questions = annotation.questions.slice(); // shallow copy

		while (questions.length !== 0) {
			console.log("looking to determine the next question");

			question = questions.shift();

			console.log("looking at question " + question.id);

			if (question.id === questionId) {
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

				// TOOD: Probably should give a deep copy of questions here
				var conditionResult = condition(annotation.questions, result);

				if (!conditionResult) {
					continue;
				}
			}

			// The parse and stringify is a crude but effective way of removing any
			// functions in the object
			postMessage({
				"showQuestion": JSON.parse(JSON.stringify(question))
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
