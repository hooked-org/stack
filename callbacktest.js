var http = require('http')
http.createServer(function (req, res) {
  if (req.method.toLowerCase() == 'post') {
    let data = ''
    req.on('data', chunk => {
      data += chunk
    })
    req.on('end', () => {
      console.log("POST - " + data)
      res.end()
    });
  } else {
    res.end()
  }
}).listen(8009)
