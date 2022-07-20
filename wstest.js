const { WebSocketServer } = require('ws')

const wss = new WebSocketServer({ port: 8008 })

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    ws.send('echo ' + data)
  });
  setInterval(() => {
    ws.send('ping')
  }, 1000)
  ws.send('hello')
});