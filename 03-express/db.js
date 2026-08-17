const {MongoClient, ServerApiVersion} = require('mongodb');

let client = null;
async function connect(uri, dbname) {
    if (client) {
        return client.db(dbname)
    }

    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1
        }
    })

    await client.connect();
    console.log("Connected to MongoDB");

    // client.db is to select current database
    return client.db(dbname);
}

// share the connect function with other JavaScript files
module.exports = { connect };