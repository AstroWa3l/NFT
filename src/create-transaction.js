const cardano = require("./cardano")

//funded wallet
const sender = cardano.wallet("ADAPI");
console.log(
    "Balance of Sender wallet: " +
    cardano.toAda(sender.balance().amount.lovelace) +
    " ADA"
);

//receiver address
const receiver =
    "addr_test1qrmpfgxq6nrk7d57k7c68jd7jydeex0p9ml2pfy4rfz9ze49j5wfrz38hgau7mdx0klffmt8lt33dsnnjg3zg7rxh0ssg9rswn";

const ASSET_NAME = 'ec080d16da957a69851414095d4eab4c7077ee31fcb65d3817f3e5c1.ShitCoin0'

const invalidAfter = cardano.queryTip().slot + 10000

// create raw transaction
let txInfo = {
    invalidAfter,
    txIn: cardano.queryUtxo(sender.paymentAddr),
    txOut: [
        {
            address: sender.paymentAddr,
            amount: {
                lovelace: sender.balance().amount.lovelace - cardano.toLovelace(2),
            },
        }, //amount going back to sender
        {
            address: receiver,
            amount: {
                lovelace: cardano.toLovelace(2),
                [ASSET_NAME]: 1
            }
        }, //amount going to receiver
    ],
    metadata: { 1: { message: "With ❤️" } },
};
let raw = cardano.transactionBuildRaw(txInfo);

//calculate fee
let fee = cardano.transactionCalculateMinFee({
    ...txInfo,
    txBody: raw,
    witnessCount: 1,
});

//pay the fee by subtracting it from the sender utxo
txInfo.txOut[0].amount.lovelace -= fee;

//create final transaction
let tx = cardano.transactionBuildRaw({ ...txInfo, fee });

//sign the transaction
let txSigned = cardano.transactionSign({
    txBody: tx,
    signingKeys: [sender.payment.skey],
});

//broadcast transaction
let txHash = cardano.transactionSubmit(txSigned);
console.log("TxHash: " + txHash);