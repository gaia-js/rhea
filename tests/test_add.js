var rhea = require('../index');

// rhea.init('127.0.0.1', 4503, 'nodejs-test');

Promise.all([
  rhea.submit('controller.invocation', {
    operator: '/test'
  }, 1),
  new Promise(function (resolve, reject) {
    var item = new rhea.ProfileItem("controller.timeout", {
      operator: '/test/test2'
    });
    setTimeout(function () {
      item.submit().then(function (bytes) {
        resolve(bytes);
      }).catch(function (err) {
        reject(err);
      });
    }, 760);
  })
]).then(function (result) {
  result.forEach((bytes) => {
    console.debug(bytes + ' bytes sent');
  });

  process.exit(0);
}).catch(function (err) {
  err.forEach((e) => {
    console.error(e);
  });
});