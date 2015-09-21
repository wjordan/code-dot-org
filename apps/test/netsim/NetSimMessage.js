/* jshint
 funcscope: true,
 newcap: true,
 nonew: true,
 shadow: false,
 unused: true,
 eqeqeq: true
 */
'use strict';
/* global describe, beforeEach, it */

var testUtils = require('../util/testUtils');
var NetSimTestUtils = require('../util/netsimTestUtils');
var NetSimMessage = require('@cdo/apps/netsim/NetSimMessage');
var NetSimEntity = require('@cdo/apps/netsim/NetSimEntity');

var assert = testUtils.assert;
var assertOwnProperty = testUtils.assertOwnProperty;
var assertTableSize = NetSimTestUtils.assertTableSize;
var fakeShard = NetSimTestUtils.fakeShard;

describe("NetSimMessage", function () {
  var testShard, messageTable;

  beforeEach(function () {
    testShard = fakeShard();
    messageTable = testShard.messageTable;
  });

  it("uses the message table", function () {
    var message = new NetSimMessage(testShard);
    assert(message.getTable() === testShard.messageTable);
  });

  it("implements MessageData", function () {
    var message = new NetSimMessage(testShard);

    assertOwnProperty(message, 'fromNodeID');
    assert.equal(message.fromNodeID, undefined);

    assertOwnProperty(message, 'toNodeID');
    assert.equal(message.toNodeID, undefined);

    assertOwnProperty(message, 'simulatedBy');
    assert.equal(message.simulatedBy, undefined);

    assertOwnProperty(message, 'payload');
    assert.equal(message.payload, "");

    assertOwnProperty(message, 'extraHopsRemaining');
    assert.equal(message.extraHopsRemaining, 0);

    assertOwnProperty(message, 'visitedNodeIDs');
    assert.deepEqual(message.visitedNodeIDs, []);
  });

  describe("isValid static check", function () {
    it("is minimally valid with a payload", function () {
      assert(!NetSimMessage.isValid({}));
      assert(NetSimMessage.isValid({ payload: '' }));
    });

    it("passes given a default-constructed NetSimMessage", function () {
      assert(NetSimMessage.isValid(new NetSimMessage()));
    });
  });

  it("converts MessageRow.base64Payload to local binary payload", function () {
    var message = new NetSimMessage(testShard, {
      fromNodeID: 1,
      toNodeID: 2,
      simulatedBy: 2,
      base64Payload: {
        string: "kg==",
        len: 7
      },
      extraHopsRemaining: 3,
      visitedNodeIDs: [4]
    });
    assert.equal(message.payload, "1001001");
  });

  it("gracefully converts a malformed base64Payload to empty string", function () {
    var message = new NetSimMessage(testShard, {
      base64Payload: {
        string: "totally not a base64 string",
        len: 7
      },
    });
    assert.equal(message.payload, '');
  });

  describe("static method send", function () {
    it("adds an entry to the message table", function () {
      messageTable.refresh(function (err, rows) {
        assert(rows.length === 0, "Table is empty");
      });

      NetSimMessage.send(testShard, { payload: '' }, function () {});

      messageTable.refresh(function (err, rows) {
        assert(rows.length === 1, "Table has one row");
      });
    });

    it("Puts row values in remote table", function () {
      var fromNodeID = 1;
      var toNodeID = 2;
      var simulatedBy = 2;
      var base64Payload = {
        string: "kg==",
        len: 7
      };
      var extraHopsRemaining = 3;
      var visitedNodeIDs = [4];

      NetSimMessage.send(
          testShard,
          {
            fromNodeID: fromNodeID,
            toNodeID: toNodeID,
            simulatedBy: simulatedBy,
            payload: '1001001',
            extraHopsRemaining: extraHopsRemaining,
            visitedNodeIDs: visitedNodeIDs
          },
          function () {});

      messageTable.refresh(function (err, rows) {
        var row = rows[0];
        assert.equal(row.fromNodeID, fromNodeID);
        assert.equal(row.toNodeID, toNodeID);
        assert.equal(row.simulatedBy, simulatedBy);
        assert.deepEqual(row.base64Payload, base64Payload);
        assert.equal(row.extraHopsRemaining, extraHopsRemaining);
        assert.deepEqual(row.visitedNodeIDs, visitedNodeIDs);
      });
    });

    it("Returns no error to its callback when successful", function () {
      NetSimMessage.send(testShard, { payload: '' }, function (err) {
        assert(err === null, "Error is null on success");
      });
    });

    it("Returns error to its callback when given a non-binary String as a payload", function () {
      var returnedError;
      NetSimMessage.send(testShard, {
        fromNodeID: 1,
        toNodeID: 2,
        simulatedBy: 2,
        payload: 'some non-binary payload',
        extraHopsRemaining: 3,
        visitedNodeIDs: [4]
      }, function (err) {
        returnedError = err;
      });
      assert(returnedError instanceof TypeError, "Did not return expected TypeError");
    });
  });

  it("can be instatiated from remote row", function () {
    var testRow;

    // Create a message row in remote table
    // The source payload that generates this Base64Payload is "1001001"
    messageTable.create({
      fromNodeID: 1,
      toNodeID: 2,
      simulatedBy: 2,
      base64Payload: {
        string: "kgA=",
        len: 7
      },
      extraHopsRemaining: 3,
      visitedNodeIDs: [4]
    }, function (err, row) {
      testRow = row;
    });
    assert(testRow !== undefined, "Failed to create test row");

    // Instantiate message
    var message = new NetSimMessage(testShard, testRow);
    assert.equal(message.fromNodeID, 1);
    assert.equal(message.toNodeID, 2);
    assert.equal(message.simulatedBy, 2);
    assert.equal(message.payload, '1001001');
    assert.equal(message.extraHopsRemaining, 3);
    assert.deepEqual(message.visitedNodeIDs, [4]);
  });

  it("can be removed from the remote table with destroy()", function () {
    var testRow;

    // Create a message row in remote table
    messageTable.create({}, function (err, row) {
      testRow = row;
    });
    assert(testRow !== undefined, "Failed to create test row");

    // Call destroy()
    var message = new NetSimMessage(testShard, testRow);
    message.destroy();

    // Verify that message is gone from the remote table.
    var rowCount = Infinity;
    messageTable.refresh(function (err, rows) {
      rowCount = rows.length;
    });
    assert.equal(rowCount, 0);
  });

  describe("destroyEntities on messages", function () {
    it("deletes all messages passed to it", function () {
      NetSimMessage.send(
          testShard,
          {
            fromNodeID: 1,
            toNodeID: 2,
            simulatedBy: 2,
            payload: '001'
          },
          function () {});
      NetSimMessage.send(
          testShard,
          {
            fromNodeID: 1,
            toNodeID: 2,
            simulatedBy: 2,
            payload: '010'
          },
          function () {});
      NetSimMessage.send(
          testShard,
          {
            fromNodeID: 1,
            toNodeID: 2,
            simulatedBy: 2,
            payload: '100'
          },
          function () {});
      assertTableSize(testShard, 'messageTable', 3);

      var messages;
      messageTable.refresh(function (err, rows) {
        messages = rows.map(function (row) {
          return new NetSimMessage(testShard, row);
        });
      });
      assert.equal(3, messages.length);
      assert(messages[0] instanceof NetSimMessage);

      NetSimEntity.destroyEntities(messages, function () {});
      assertTableSize(testShard, 'messageTable', 0);
    });
  });

  describe("MessageRow", function () {

    it("has expected row structure and default values", function () {
      var message = new NetSimMessage(testShard);
      var row = message.buildRow();

      assertOwnProperty(row, 'fromNodeID');
      assert.equal(row.fromNodeID, undefined);

      assertOwnProperty(row, 'toNodeID');
      assert.equal(row.toNodeID, undefined);

      assertOwnProperty(row, 'simulatedBy');
      assert.equal(row.simulatedBy, undefined);

      assertOwnProperty(row, 'base64Payload');
      assert.deepEqual(row.base64Payload, {
        string: "",
        len: 0
      });

      assertOwnProperty(row, 'extraHopsRemaining');
      assert.equal(row.extraHopsRemaining, 0);

      assertOwnProperty(row, 'visitedNodeIDs');
      assert.deepEqual(row.visitedNodeIDs, []);
    });

    it("converts local binary payload to base64 before creating row", function () {
      var base64Payload = {
        string: "kg==",
        len: 7
      };
      var message = new NetSimMessage(testShard, {
        fromNodeID: 1,
        toNodeID: 2,
        simulatedBy: 2,
        base64Payload: base64Payload,
        extraHopsRemaining: 3,
        visitedNodeIDs: [4]
      });
      var row = message.buildRow();
      assert.equal(row.base64Payload.string, base64Payload.string);
      assert.equal(row.base64Payload.len, base64Payload.len);
    });


  });


});
