import {
  Transaction,
  TransactionHeader,
  Batch,
  BatchHeader,
  BatchList
} from 'sawtooth-sdk/protobuf';
import { randomBytes, createHash } from 'crypto';
import { getPublicKey, sign } from './signing.js';
import { encode } from './encoding.js';
import { hash } from './addressing.js';


const FAMILY_NAME = 'cryptomoji';
const FAMILY_VERSION = '0.1';
const NAMESPACE = '5f4d76';

/**
 * A function that takes a private key and a payload and returns a new
 * signed Transaction instance.
 *
 * Hint:
 *   Remember ProtobufJS has two different APIs for encoding protobufs
 *   (which you'll use for the TransactionHeader) and for creating
 *   protobuf instances (which you'll use for the Transaction itself):
 *     - TransactionHeader.encode({ ... }).finish()
 *     - Transaction.create({ ... })
 *
 *   Also, don't forget to encode your payload!
 */
export const createTransaction = (privateKey, payload) => {
  // Enter your solution here
  const encodedPayload = encode(payload);
  const publicKey = getPublicKey(privateKey);
  const transactionHeaderBytes = TransactionHeader.encode({
    familyName: FAMILY_NAME,
    familyVersion: FAMILY_VERSION,
    inputs: [NAMESPACE],
    outputs: [NAMESPACE],
    signerPublicKey: publicKey,
    batcherPublicKey: publicKey,
    nonce: randomBytes(32).toString(),
    dependencies: [],
    payloadSha512: hash(encodedPayload)
  }).finish();

  const signature = sign(privateKey, transactionHeaderBytes);
  const transaction = Transaction.create({
    header: transactionHeaderBytes,
    headerSignature: signature,
    payload: encodedPayload
  });
  return transaction;
};

/**
 * A function that takes a private key and one or more Transaction instances
 * and returns a signed Batch instance.
 *
 * Should accept both multiple transactions in an array, or just one
 * transaction with no array.
 */
export const createBatch = (privateKey, transactions) => {
  // Your code here
  let trx;
  if (isArray(transactions)) {
    trx = transactions;
  } else {
    trx = [];
    trx.push(transactions);

  }

  function isArray(value) {
    return value && typeof value === 'object' && value.constructor === Array;
  }

  const publicKey = getPublicKey(privateKey);
  const batchHeaderBytes = BatchHeader.encode({
    signerPublicKey: publicKey,
    transactionIds: trx.map((txn) => txn.headerSignature),
  }).finish();

  const signature = sign(privateKey, batchHeaderBytes);

  return Batch.create({
    header: batchHeaderBytes,
    headerSignature: signature,
    transactions: trx
  });
};

/**
 * A fairly simple function that takes a one or more Batch instances and
 * returns an encoded BatchList.
 *
 * Although there isn't much to it, axios has a bug when POSTing the generated
 * Buffer. We've implemented it for you, transforming the Buffer so axios
 * can handle it.
 */
export const encodeBatches = batches => {
  if (!Array.isArray(batches)) {
    batches = [batches];
  }
  const batchList = BatchList.encode({ batches }).finish();

  // Axios will mishandle a Uint8Array constructed with a large ArrayBuffer.
  // The easiest workaround is to take a slice of the array.
  return batchList.slice();
};

/**
 * A convenince function that takes a private key and one or more payloads and
 * returns an encoded BatchList for submission. Each payload should be wrapped
 * in a Transaction, which will be wrapped together in a Batch, and then
 * finally wrapped in a BatchList.
 *
 * As with the other methods, it should handle both a single payload, or
 * multiple payloads in an array.
 */
export const encodeAll = (privateKey, payloads) => {
  // Your code here
  return encodeBatches(createBatch(privateKey, createTransaction(privateKey, payloads)));

};
