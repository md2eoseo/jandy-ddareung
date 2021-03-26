const { createProxyMiddleware } = require("http-proxy-middleware");
module.exports = function (app) {
  app.use(
    createProxyMiddleware("/api", {
      target: "https://naveropenapi.apigw.ntruss.com",
      changeOrigin: true,
      pathRewrite: { "^/api/": "/" },
    })
  );
};
