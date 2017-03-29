var mongoose = require('mongoose');
var db = mongoose.connection;

// Database Init.
var mongoUsername = (process.env.MONGOUSER || "TestDBUser");
var mongoPassword = (process.env.MONGOPASS || "TestDBPass");
var mongoDatabase = (process.env.MONGODATA || "bitboss");
var mongoNumb = (process.env.MONGONUMB || "");
var mongoPort = (process.env.MONGOPORT || "");
var mongoUri = (process.env.ISHEROKU === "1" ? "mongodb://" + mongoUsername + ":" + mongoPassword + "@ds" + mongoNumb + mongoPort + ".mlab.com:" + mongoPort + "/" + mongoDatabase : "localhost:56789/" + mongoDatabase);

function ConnectWithRetry() {
    return mongoose.connect(mongoUri, function (err) {
        if (err) {
            console.log("Database failed to connect on startup. Retrying in 5 seconds: " + err);
            setTimeout(ConnectWithRetry, 5000);
        }
    });
}

// DB Events
db.on('error', function (err) {

    if (err) console.log("Database error: " + err);
});
db.on('open', function (callback) {

    console.log("Database connected.");
});
db.on('reconnected', function (callback) {

    console.log("Database reconnected.");
});
db.on('disconnected', function (callback) {

    console.log("Database disconnected.");
});

// Database Schemas
var settingsSchema = {

    sound: Boolean,
    trans: Boolean,
    chroma: Boolean,
    persistence: Boolean,
    bossHealing: Boolean,
    avtrHidden: Boolean,
    hpMode: String,
    hpInit: Number,
    hpMult: Number,
    hpIncr: Number,
    hpAmnt: Number,
    colorBg: String,
    colorHb: String,
    colorHm: String,
    colorHf: String,
    colorTx: String
};

var userSchema = mongoose.Schema({

    userid: String,
    lastAccess: Number,
    partner: Boolean,
    settings: settingsSchema
});

userSchema.set('autoIndex', false);
userSchema.set('collection', 'users');

var User = mongoose.model('User', userSchema);

// Begin connection attempts.
ConnectWithRetry();
console.log("Database connecting. URI: " + mongoUri);

module.exports = {

    Database: db,
    User: User
};