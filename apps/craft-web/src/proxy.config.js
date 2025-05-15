module.exports = {
  '/api': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    logLevel: 'info'
  },
  '/api-go': {
    target: 'http://localhost:8080',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/api-go': '/api-go'
    },
    timeout: 120000,
    proxyTimeout: 120000
  },
  '/socket.io': {
    target: 'http://localhost:3000',
    secure: false,
    ws: true,
    changeOrigin: true,
    timeout: 120000,
    proxyTimeout: 120000
  },
  '/assets': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    timeout: 120000,
    proxyTimeout: 120000
  },
  '/': {
    target: 'http://localhost:4200',
    secure: false,
    changeOrigin: true,
    pathRewrite: {
      '^/': ''
    },
    bypass: function(req, res, proxyOptions) {
      if (req.headers.accept && req.headers.accept.indexOf('html') !== -1) {
        return '/index.html';
      }
    },
    timeout: 120000,
    proxyTimeout: 120000
  }
};