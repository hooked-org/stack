var http = require('http')
var i = 0;
http.createServer(function (req, res) {
  if (req.method.toLowerCase() == 'post') {
    let data = ''
    req.on('data', chunk => {
      data += chunk
    })
    req.on('end', () => {
      console.log(i++ + " | POST - " + data)
      res.end()
    });
  } else {
    res.end()
  }
}).listen(8009)
