// lib/parser.js — turns raw HTTP text into a structured request object.
//
// An HTTP request looks like this:
//
//   GET /api/users?page=1 HTTP/1.1      <- request line
//   Host: localhost:3000                <- header
//   Content-Type: application/json      <- header
//                                       <- empty line (separates headers from body)
//   {"name":"john"}                     <- body (optional)
//
// Our job: break all of this into a convenient object to work with.

/**
 * Parses a query string like "page=1&sort=name" into { page: '1', sort: 'name' }.
 */
function parseQuery(queryString) {
  const query = {};
  if (!queryString) return query;

  for (const pair of queryString.split('&')) {
    const [key, value] = pair.split('=');
    // decodeURIComponent handles encoded characters like %20 (space) in the URL.
    query[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  return query;
}

/**
 * Parses all headers into an object. Header names are lowercased because per
 * the HTTP spec they are case-insensitive (this is also what Express does).
 */
function parseHeaders(headerLines) {
  const headers = {};
  for (const line of headerLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).toLowerCase().trim();
      const value = line.slice(colonIndex + 1).trim();
      headers[key] = value;
    }
  }
  return headers;
}

/**
 * The main function: receives the raw request text and returns a structured
 * object, or null if the request is invalid.
 */
function parseRequest(raw) {
  // The body can itself contain \r\n\r\n, so we split only on the first occurrence.
  const separatorIndex = raw.indexOf('\r\n\r\n');
  if (separatorIndex === -1) return null; // incomplete / invalid request

  const headerSection = raw.slice(0, separatorIndex);
  const body = raw.slice(separatorIndex + 4); // 4 = length of "\r\n\r\n"

  const lines = headerSection.split('\r\n');

  // First line: "METHOD PATH HTTP/VERSION"
  const requestLine = lines[0].split(' ');
  if (requestLine.length < 3) return null;

  const [method, fullPath, version] = requestLine;

  // Separate the path from the query string (after the ?)
  const questionIndex = fullPath.indexOf('?');
  const path = questionIndex === -1 ? fullPath : fullPath.slice(0, questionIndex);
  const queryString = questionIndex === -1 ? '' : fullPath.slice(questionIndex + 1);

  const headers = parseHeaders(lines.slice(1));

  return {
    method: method.toUpperCase(),
    path,
    query: parseQuery(queryString),
    headers,
    body,
    version,
    params: {}, // filled in later by the router (for routes like /users/:id)
  };
}

module.exports = { parseRequest };
