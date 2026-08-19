const { MongoClient, ServerApiVersion } = require('mongodb');

// global, because it is not in any curly braces
let client = null; 
/**
 * 
 * @param {String} uri Connection String
 * @param {String} dbname  Name of the database
 * @returns 
 */
async function connect(uri, dbname) {
    if (client) {
        // select the database provided by dbname
        return client.db(dbname);
    }

    // create a new client if it doesn't exist
    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1
        }
    });

    await client.connect();
    return client.db(dbname);
}

module.exports = {
    connect

}