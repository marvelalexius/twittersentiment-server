const Twitter = require('twitter');
const Sentiment = require('sentiment');

module.exports = (app, io) => {
    const twitter = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    const sentiment = new Sentiment();

    let socketconnection = null; 
    let twitterstream = null;

    const analyzeSentiment = data => ({
        ...data,
        sentiment: sentiment.analyze(data.text),
    });

    const startStream = (search, retweets) => {
        console.log(`Starting stream with search: ${search}`);

        twitter.stream(
            'statuses/filter',
            { track: search },
            (stream) => {
                stream.on('data', tweet => {
                    if (!retweets) {
                        if (tweet.retweeted_status === undefined) {
                            socketconnection.emit('tweets', analyzeSentiment(tweet));
                        }
                    } else {
                        socketconnection.emit('tweets', analyzeSentiment(tweet));
                    }
                });
                stream.on('error', error => console.log(`There was an error ${error}`));

                twitterstream = stream;
            }
        );
    };

    io.on('connection', socket => {
        socketconnection = socket;
        console.log('client connected');
        socket.on('disconnect', () => console.log('client disconnected'));
    });

    app.post('/start', (req, res) => {
        const {search, retweets} = req.body;
        
        if (twitterstream !== null) {
            twitterstream.destroy();
        }

        startStream(search, retweets);
    });

    app.post('/stop', (req, res) => {
        console.log('destroying streams');
        twitterstream.destroy();
        res.status(200).json({message: 'stream destroyed'});
    });
};