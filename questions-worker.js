/*
Events from videogular-questions

sent when a particular annotation is reached in the video
{
  annotation-start: annotation-id
}

sent when a question is answered
{
  question-result: question-id,
  annotation: annotation-id
  result: ...
}

{
  result-finished: question-id|annotation-id
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
  show-question: a-question
}

show some results
{
  show-results: some-results
}

end the annotation
{
  end-annotation: annotations
}

set the video time
{
  set-time: time
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

	function annotationStart(message) {
		id = message.annotation-start;

		annotation = annotations[id];

		var firstQuestion = annotation.questions[0];

		postMessage(firstQuestion);
	}

	function questionResult(message, annotations) {
		var questionId = message.question-result;
		var annotationId = message.annotation;

		var annotation = annotations[annotationId];

		var question;
		var questions = annotation.questions.slice(); // shallow copy

		while (questions.length !== 0) {
			question = questions.pop();

			if (question.id === questionId) {
				break;
			}
		}

		if (questions.length === 0) {
			postMessage({
				"end-annotation": annotationId
			});
		}

		while (questions.length !== 0) {
			question = questions.pop();

			if ("condition" in quesiton) {
				var condition = question.condition;

				// TOOD: Probably should give a copy of questions here
				var conditionResult = condition(questions);

				if (!conditionResult) {
					continue;
				}
			}

			postMessage({
				"show-question": question
			});

			break;
		}
	}

	self.loadAnnotations = function(annotations) {
		publishAnnotations(annotations);

		var handlers = {
			"annotation-start": annotationStart,
			"question-result": questionResult
		};

		onmessage = function(e) {
			var message = e.data;
			var id, annotation;

			for (var key in handlers) {
				console.log("message from page");
				console.log(message);
				if (key in message) {
					handlers[key](message, annotations);
					break;
				}
			}
		};
	}
})();
