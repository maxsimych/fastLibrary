const app = require('./src/app');

(async() => {
  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`listening to port ${port}`);
})();

process.on('unhandledRejection', (error) => {
  console.error(error);
  process.exit(1);
})