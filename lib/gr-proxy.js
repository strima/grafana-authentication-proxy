/**
 * Proxies the request to graphite
 */
var http = require('http');

function proxyRequest(request, response, host, port, user, password, getProxiedRequestPath, isUI) {
  var filteredHeaders = {};
  Object.keys(request.headers).forEach(function(header) {
    if (header === 'host') {
      //most necessary:
      filteredHeaders[header] = host;
    } else if (header !== 'cookie' &&
        (isUI === true || (header !== 'referer' &&
               header !== 'user-agent' && header !== 'accept-language'))) {
      //avoid leaking unecessay info and save some room
      filteredHeaders[header] = request.headers[header];
    }
  });
  if (user) {
    var auth = 'Basic ' + new Buffer(user + ':' + password).toString('base64');
    filteredHeaders.authorization = auth;
  }

  var options =  {
    path: getProxiedRequestPath(request),
    method: request.method,
    hostname: host,
    port: port,
    headers: filteredHeaders
  };
  if (user) {
    options.auth = password ? user + ':' + password : user;
  }

  var proxyReq = http.request(options);

  proxyReq.addListener('error', function(err){
    response.status(500).send('Unable to process your request, ' + err.code);
    console.log('GRAPHITE Server Error: ' + err.code);
  });

  proxyReq.addListener('response', function(proxyResp) {
    var http10 = request.httpVersionMajor === 1 && request.httpVersionMinor < 1;
    if(http10 && proxyResp.headers['transfer-encoding'] !== undefined){
      //filter headers
      var headers = proxyResp.headers;
      delete proxyResp.headers['transfer-encoding'];
      var buffer = "";
      
      //buffer answer
      proxyResp.addListener('data', function(chunk) {
        buffer += chunk;
      });
      proxyResp.addListener('end', function() {
        headers['Content-length'] = buffer.length;//cancel transfer encoding "chunked"
        response.writeHead(proxyResp.statusCode, headers);
        response.write(buffer, 'binary');
        response.end();
      });
    } else {
      //send headers as received
      response.writeHead(proxyResp.statusCode, proxyResp.headers);
      
      //easy data forward
      proxyResp.addListener('data', function(chunk) {
        response.write(chunk, 'binary');
      });
      proxyResp.addListener('end', function() {
        response.end();
      });
    }
  });

  //proxies to SEND request to real server
  request.addListener('data', function(chunk) {
    proxyReq.write(chunk, 'binary');
  });
  request.addListener('end', function() {
    proxyReq.end();
  });
}

exports.configureGRProxy = function(app, grHost, grPort, grUser, grPassword, basePath) {
  app.use(basePath + "/__gr", function(request, response, next) {
    proxyRequest(request, response, grHost, grPort, grUser, grPassword,
      function getProxiedRequestPath(request) {
        return request.url;
      });
  });
};
