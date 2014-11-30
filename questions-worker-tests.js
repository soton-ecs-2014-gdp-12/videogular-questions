
describe('questions-worker', function(){

  it('it should give 0 annotations for empty', function() {
    var flag = false;

    runs(function() {
      var worker = new Worker("/base/tests/empty.js");

      worker.onmessage = function (event) {
        console.log(event.data);

        expect([].length).toBe(0);

        flag = true;
      };

      worker.postMessage({});
    });

    waitsFor(function() {
      return flag;
    }, 1000);
  });
});
