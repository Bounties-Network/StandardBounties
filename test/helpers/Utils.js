/* global assert */

const HttpProvider = require('ethjs-provider-http');
const EthRPC = require('ethjs-rpc');
const ethRPC = new EthRPC(new HttpProvider('http://localhost:7545'));


function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('out of gas') || strError.includes('revert');
}

function ensureException(error) {
    assert(isException(error), error.toString());
}
async function increaseTime (seconds) {
  new Promise((resolve, reject) => ethRPC.sendAsync({
    method: 'evm_increaseTime',
    params: [seconds],
  }, (err) => {
    if (err) {
      console.log(err); reject(err);
    }
    resolve();
  }))
    .then(() => new Promise((resolve, reject) => ethRPC.sendAsync({
      method: 'evm_mine',
      params: [],
    }, (err) => {
      if (err) {
        console.log(err); reject(err);
      }
      resolve();
    })));
}

module.exports = {
    zeroAddress: '0x0000000000000000000000000000000000000000',
    isException: isException,
    ensureException: ensureException,
    increaseTime: increaseTime
};
