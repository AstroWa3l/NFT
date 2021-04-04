const cardano = require('./cardano')

const mint = ({ name, image }) => {

    console.log(`start minting: ${name}`);

    const createTransaction = (tx) => {
        let raw = cardano.transactionBuildRaw(tx);
        let fee = cardano.transactionCalculateMinFee({
            ...tx,
            txBody: raw,
        });
        tx.txOut[0].amount.lovelace -= fee;
        return cardano.transactionBuildRaw({ ...tx, fee });
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
    const ASSET_NAME = policy + `.${name}`;

    const metadata = {
        1: {
            [policy]: {
                [name]: {
                    "name": name,
                    "image": image,
                    "authors": [
                        {
                            "name": "Wael",
                            "website": "https://ada-pi.io",
                            "logo": "ipfs://QmWVjjXitTeBdeCBP4gevE4KJ8uzJekUQoxFBQCVLHFcAv"
                        },
                        {
                            "name": "Olivier",
                            "website": "https://pool.sublayer.io",
                            "logo": "ipfs://QmcpYUrqHiP1JLXjKNRftnGdKfqvXNnttpt8MPVgqsrjgn"
                        }
                    ]
                }
            }
        }
    }


    const invalidAfter = cardano.queryTip().slot + 10000

    let tx = {
        invalidAfter,
        txIn: wallet.balance().utxo,
        txOut: [
            {
                address: wallet.paymentAddr,
                amount: { ...wallet.balance().amount, [ASSET_NAME]: 1 },
            },
        ],
        mint: [{ action: "mint", amount: 1, token: ASSET_NAME }],
        metadata,
        witnessCount: 2,
    };

    // console.log(JSON.stringify(tx, null, 2))

    let raw = createTransaction(tx);
    let signed = signTransaction(wallet, raw, mintScript);
    let txHash = cardano.transactionSubmit(signed);
    console.log(`minting done: ${name}`);
    console.log(txHash);
}

const inputs = [
    // { name: "PiPurple", image: "ipfs://QmdsGwHo9EqqA6pFCKs64p7P4HWJVfHksa8abmw8FMCrjn" },
    // { name: "PiShocker", image: "ipfs://QmXBKhFYF3qUoBFRtD9VFgsYQeqdiyyDCRLZMwYpvp6iQ7" },
    // { name: "PiTrippy", image: "ipfs://QmPLfAD1MLFyrv5eeYrxbwC9Nkwn628vCgFbW2VX9mgg7w" },
    // { name: "PiWater", image: "ipfs://QmX9Z26ezUz5AfVHGaFX72XixV46iBNpnn9LsDG4RSt3nx" },
]


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function main() {

    for (const input of inputs) {

        console.log(input)
        mint(input)
        await sleep(30 * 1000)
    }

}

main()

