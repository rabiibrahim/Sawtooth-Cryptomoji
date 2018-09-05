'use strict';

const { TransactionHandler } = require('sawtooth-sdk/processor/handler');
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const { encode, decode } = require('./services/encoding');
const { getSireAddress, getCollectionAddress, getMojiAddress } = require('./services/addressing');
const getPrng = require('./services/prng');
const FAMILY_NAME = 'cryptomoji';
const FAMILY_VERSION = '0.1';
const NAMESPACE = '5f4d76';
const ACTIONS = {
  CREATE_OWNER: 'CREATE_OWNER',
  CREATE_COLLECTION: 'CREATE_COLLECTION',
  SELECT_SIRE: 'SELECT_SIRE',
  BREED_MOJI: 'BREED_MOJI'
};

/**
 * A Cryptomoji specific version of a Hyperledger Sawtooth Transaction Handler.
 */
class MojiHandler extends TransactionHandler {
  /**
   * The constructor for a TransactionHandler simply registers it with the
   * validator, declaring which family name, versions, and namespaces it
   * expects to handle. We'll fill this one in for you.
   */
  constructor() {
    console.log('Initializing cryptomoji handler with namespace:', NAMESPACE);
    super(FAMILY_NAME, [FAMILY_VERSION], [NAMESPACE]);
  }

  /**
   * The apply method is where the vast majority of all the work of a
   * transaction processor happens. It will be called once for every
   * transaction, passing two objects: a transaction process request ("txn" for
   * short) and state context.
   *
   * Properties of `txn`:
   *   - txn.payload: the encoded payload sent from your client
   *   - txn.header: the decoded TransactionHeader for this transaction
   *   - txn.signature: the hex signature of the header
   *
   * Methods of `context`:
   *   - context.getState(addresses): takes an array of addresses and returns
   *     a Promise which will resolve with the requested state. The state
   *     object will have keys which are addresses, and values that are encoded
   *     state resources.
   *   - context.setState(updates): takes an update object and returns a
   *     Promise which will resolve with an array of the successfully
   *     updated addresses. The updates object should have keys which are
   *     addresses, and values which are encoded state resources.
   *   - context.deleteState(addresses): deletes the state for the passed
   *     array of state addresses. Only needed if attempting the extra credit.
   */
  apply(txn, context) {
    // Enter your solution here
    // (start by decoding your payload and checking which action it has)
    let decodedPayload = null;
    try {
      decodedPayload = decode(txn.payload);
    } catch (err) {
      throw new InvalidTransaction('unable to decode payload');
    }
    console.log(decodedPayload);

    switch (decodedPayload.action) {
      case ACTIONS.CREATE_OWNER:
        return createOwner(context, payload, txn.header.signerPublicKey);
      case ACTIONS.CREATE_COLLECTION:
        return createCollection(context, txn.header.signerPublicKey, txn.signature);
      case ACTIONS.SELECT_SIRE:
      return selectSire(context, txn.header.signerPublicKey);
      case ACTIONS.BREED_MOJI:
      default:
        throw new InvalidTransaction('unknown action' + decodedPayload.action);
    }
  }
}



const createOwner = (context, { name }, ownerKey) => {
  const address = getSireAddress(ownerKey);
  return context.getState([address]).then(state => {
    if (state[address].length > 0) {
      throw new InvalidTransaction('Owner already exist');
    }
    const update = {};
    update[address] = encode({ key: ownerKey, name });
    return context.setState(update);
  });
}
module.exports = MojiHandler;

// Creates an empty array of a certain size
const emptyArray = size => Array.apply(null, Array(size));

// Uses a PRNG function to generate a pseudo-random dna string
const makeDna = prng => {
  return emptyArray(9).map(() => {
    const randomHex = prng(2 ** (2 * 8)).toString(16);
    return ('0000' + randomHex).slice(-4);
  }).join('');
};

// Creates an array of new moji objects from a public key and a PRNG
const makeMoji = (publicKey, prng) => {
  return emptyArray(3).map(() => ({
    dna: makeDna(prng),
    owner: publicKey,
    sire: null,
    breeder: null,
    sired: [],
    bred: []
  }));
};

const createCollection = (context, publicKey, signature) => {
  const address = getCollectionAddress(publicKey);
  const prng = getPrng(signature);

  return context.getState([address]).then(state => {
    if (state[address].length > 0) {
      throw new InvalidTransaction('Collection already exist');
    }
    const updates = {};
    const mojiAddresses = [];
    const moji = makeMoji(publicKey, prng);

    moji.forEach(moji => {
      const address = getMojiAddress(publicKey, moji.dna);
      updates[address] = encode(moji);
      mojiAddresses.push(address);
    });

    updates[address] = encode({
      key: publicKey,
      moji: mojiAddresses.sort()
    });
    return context.setState(updates);
  });
}
