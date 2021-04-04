const cardano = require('./cardano')

const createTransaction = (tx) => {
  let raw = cardano.transactionBuildRaw(tx);
  let fee = cardano.transactionCalculateMinFee({
    ...tx,
    txBody: raw,
  });
  tx.txOut[0].amount.lovelace -= fee;
  return cardano.transactionBuildRaw({...tx, fee});
};

const signTransaction = (wallet, tx, script) => {
  return cardano.transactionSign({
    signingKeys: [wallet.payment.skey, wallet.payment.skey],
    scriptFile: script,
    txBody: tx,
  });
};

let wallet = cardano.wallet("ADAPI");

let mintScript = {
  keyHash: cardano.addressKeyHash(wallet.name),
  type: "sig",
};

let policy = cardano.transactionPolicyid(mintScript);
const ASSET_NAME = policy + ".PiCoin0";

const invalidAfter = cardano.queryTip().slot + 10000

let tx = {
invalidAfter,
  txIn: wallet.balance().utxo,
  txOut: [
    {
      address: wallet.paymentAddr,
      amount: { ...wallet.balance().amount, [ASSET_NAME]: 0 },
    },
  ],
  mint: [{ action: "mint", amount: -1, token: ASSET_NAME }],
  witnessCount: 2,
};

// console.log(JSON.stringify(tx, null, 2))

let raw = createTransaction(tx);
let signed = signTransaction(wallet, raw, mintScript);
let txHash = cardano.transactionSubmit(signed);
console.log(txHash);