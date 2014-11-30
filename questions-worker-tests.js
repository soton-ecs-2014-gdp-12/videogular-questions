
describe('questions-worker', function(){

  it('it should give 0 annotations for empty', function() {
    var flag = false;

    runs(function() {
      var worker = new Worker("/base/tests/empty.js");

      runScript(worker, [
        {
          recieve: {
            annotations: []
          }
        }
      ], function(err) {
        if (err) {
          console.error(err);
          return;
        }

        flag = true;
      });
    });

    waitsFor(function() {
      return flag;
    }, 1000);
  });

  it('it should correctly handle a multiple choice question', function() {
    var flag = false;

    runs(function() {
      var worker = new Worker("/base/tests/multiple.js");

      runScript(worker, [
        {
          recieve: {
            annotations: [
              {
                id: "first-question",
                time: 1
              }
            ]
          }
        },
        {
          send: {
            annotationStart: "first-question"
          }
        },
        {
          recieve: {
            showQuestion: {
              id: "first-question",
              type: "multiple",
              question: "What is the moon made of?",
              options: [
                {
                  name: "cheese"
                },
                {
                  name: "cheeese"
                },
                {
                  name: "cheeeeeese"
                }
              ],
              correctAnswer: "cheese"
            }
          }
        }
      ], function(err) {
        if (err) {
          console.error(err);
          return;
        }

        flag = true;
      });
    });

    waitsFor(function() {
      return flag;
    }, 1000);
  });
});

function runScript(worker, script, callback) {

  function sendAny() {
    while (script.length != 0) {

      var e = script[script.length - 1];

      if ("send" in e) {
        script.pop();
        worker.postMessage(e.send);
      } else {
        break;
      }
    }

    if (script.length === 0) {
      callback(null);
    }
  }

  script.reverse();

  worker.addEventListener("message", function(event) {

    if (script.length === 0) {
      callback("did not expect to recieve:\n" + JSON.stringify(event.data, null, 4));
      return;
    }

    var e = script.pop();

    if ("recieve" in e) {
      var expectedMessage = JSON.stringify(e.recieve, null, 4);
      var actualMessage = JSON.stringify(event.data, null , 4);

      if (expectedMessage !== actualMessage) {
        callback("message not as expected");
        return;
      }

      sendAny();
    } else {
      callback("did not expect to recieve:\n" + JSON.stringify(event.data, null, 4));
    }

    if (script.length === 0) {
      callback(null);
    }
  });

  sendAny();
}
