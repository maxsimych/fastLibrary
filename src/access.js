const MongoClient = require('mongodb').MongoClient;
const redis = require('redis');
const promisifyAll = require('util-promisifyall');
const redisClient = promisifyAll(redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  retry_strategy: (options) => {
    if (options.error) {
        if (options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error
            // and flush all commands with a individual error
            return new Error('The server refused the connection');
        }
        if (options.error.code === 'ECONNRESET') {
            return new Error('The server reset the connection');
        }
        if (options.error.code === 'ETIMEDOUT') {
            return new Error('The server timeouted the connection');
        }
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
        // End reconnecting after a specific timeout and flush all commands
        // with a individual error
        console.error('Retry time exhausted')
        return new Error('Retry time exhausted');
    }
    if (options.attempt > 15) {
        // End reconnecting with built in error
        console.error('Retry attempt exceed')
        return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  }}));
const mongoUrl = `mongodb://${process.env.MONGODB_HOST || 'localhost'}:27017/fastlibrary`;
const mongoClient = new MongoClient(mongoUrl, { useNewUrlParser: true });



(async () => {
  await mongoClient.connect();
  const mongoDb = mongoClient.db('fastlibrary');

  module.exports.saveBook = async (title,author,text) => {
    return await mongoDb.collection('text').insertOne({
      title: title,
      author: author,
      text: text
    });
  };
  module.exports.findBookByTitle = async (title) => {
    const result = await mongoDb.collection('text').findOne({
      title: title
    });
    if (!result) return null;
    return result;
  };
  module.exports.findBookByTitleCached = async (title) => {
    const result = await redisClient.getAsync(title);
    if (result) return JSON.parse(result)
    else {
      const result = await mongoDb.collection('text').findOne({
          title: title
      });
      if (!result) return null
      else {
        if(await redisClient.setAsync(title, JSON.stringify(result))) {
          return result;
        } else {throw Error}
      }
    }
  };
  module.exports.updateBookByTitle = async(title, author, text) => {
    const result = (await mongoDb.collection('text').findOneAndUpdate({title: title}, {$set: {
      title: title,
      author: author,
      text: text
    }}, {returnOriginal: false})).value;
    console.log(result);
    if (result) {
      const isExists = await redisClient.existsAsync(title);
      if (isExists) await redisClient.setAsync(title, JSON.stringify(result));
    };
    return result;
  };
})();

