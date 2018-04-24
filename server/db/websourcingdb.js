"use strict";

const ObjectID = require('mongodb').ObjectID;
const DB_NAME = 'websourcing';
const DB_PAGELOADS_COLL = 'pageloads';

function WebSourcingDb(client) {
  if (!client)
    return;
  this.client = client;
  this.pageloadsCollection = client.db(DB_NAME).collection(DB_PAGELOADS_COLL);
}

// Returns a Promise
WebSourcingDb.prototype.createPageload = function(pl) {
  var site, version;
  ({site='', version=''} = pl);
  var pl = {
    site,
    version,
    timestamp: new Date(),
    entries: [],
  }
  return this.pageloadsCollection.insertOne(pl);
}

WebSourcingDb.prototype.insertPerfEntry = function(id, data) {
  var p = new Promise(function(resolve, reject) {
    if (!ObjectID.isValid(id)) {
      reject('Invalid ObjectID format');
    } else {
      resolve();
    }
  });

  return p.then(
    () => {
      return this.pageloadsCollection.update(
        {_id: ObjectID(id)},
        {$push: {entries: data}}
      );
    }
  );
}

module.exports = WebSourcingDb;
