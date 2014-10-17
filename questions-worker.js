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
  setTime: time
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
				"endAnnotation": annotationId
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
				"showQuestion": question
			});

			break;
		}
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
