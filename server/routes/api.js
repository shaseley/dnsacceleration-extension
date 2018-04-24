"use strict";

const express = require('express');
const assert = require('assert');
const WebSourcingDb = require('../db/websourcingdb');

function Api(client) {
  if (!client)
    throw new Error("Api(): Client must not be null");

  var db = new WebSourcingDb(client);
  this.router = express.Router();

  // POST /api/pageload
  // 
  // Creates a new entry and returns the id to be used for subsequent updates.
  this.router.post('/pageload', (req, res) => {
    if (!req.body.site) {
      res.sendStatus(400);
      return;
    }

    // TODO: we don't trust body.
    db.createPageload({
      site: req.body['site'],
      version: req.body['version'],
    }).then(
      (result) => {
        res.json({"id": result.insertedId});
      },
      (error) => {
        res.sendStatus(500);
      }
    );
  });

  // POST /api/pageload/<pageload_id>/entry
  //
  // Add a webperf API entry blob for a particular page load.
  this.router.post('/pageload/:pageloadId/entry', (req, res) => {
    // TODO: we don't trust body.
    var data = req.body;
    db.insertPerfEntry(req.params.pageloadId, data)
      .then(
        () => res.sendStatus(200),
        (e) => {
          console.log(e);
          res.sendStatus(404);
        }
      );
  });
}

module.exports = Api;
