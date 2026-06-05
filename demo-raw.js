// demo-raw.js — the most basic demonstration: a TCP server speaking HTTP "by hand".
// Goal: understand that underneath HTTP there is just text traveling over a TCP connection.

const net = require('net');

const server = net.createServer((socket) => {
  // 'socket' is the connection with one client. It's a two-way stream:
  // we can read from it (data the client sent) and write to it (the response).

  socket.on('data', (chunk) => {
    // chunk is a Buffer (raw bytes). Convert it to text so we can see what arrived.
    console.log('--- The browser sent: ---');
    console.log(chunk.toString());

    // Now we build a valid HTTP response by hand.
    // Note: every line ends with \r\n, and there's an empty line before the body.
    const body = 'Hello from a raw TCP socket!';
    const response =
      'HTTP/1.1 200 OK\r\n' +
      'Content-Type: text/plain\r\n' +
      `Content-Length: ${Buffer.byteLength(body)}\r\n` +
      'Connection: close\r\n' +
      '\r\n' +
      body;

    socket.end(response); // send the response and close the connection
  });

  socket.on('error', (err) => console.error('Socket error:', err.message));
});

server.listen(3000, () => {
  console.log('Raw demo server listening on http://localhost:3000');
});
