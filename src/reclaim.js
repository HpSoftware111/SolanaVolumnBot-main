import { Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { loadKeypairs } from "./createWallets.js";
import { connection, wallet } from "../config.js";

export async function reclaim() {
    const keypairs = loadKeypairs();
    const transactions = [];
    for (let i = 0; i < keypairs.length; i++) {
        const tx = await createSOLReclaimTransaction(keypairs[i]);
        transactions.push(tx);
    }
    // Serialize transactions and prepare for sending
    const signedTransactions = transactions.map((txn) => txn.serialize());

    // Send the transactions as a bundle
    const signatures = await Promise.all(
        signedTransactions.map((txn) => connection.sendRawTransaction(txn))
    );

    console.log('Tranactions sent with signature : ', signatures);

    await WSOLReclaim(keypairs);
}

async function createSOLReclaimTransaction(keypair) {
    const { blockhash } = await connection.getLatestBlockhash();
    const amount = await connection.getBalance(keypair.publicKey);

    const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: wallet.publicKey // Account paying for transaction fees
    }).add(
        SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: wallet.publicKey,
            lamports: amount // `amount` should be in lamports
        })
    );

    // Sign the transaction with the keypair of the account sending the tokens
    transaction.sign(keypair, wallet);

    return transaction;
}

async function WSOLReclaim(keypairs) {
    try {
        const wsolMintAddress = new PublicKey('So11111111111111111111111111111111111111112');
        const transactions = [];

        for (const keypair of keypairs) {
            const senderTokenAccount = await getAssociatedTokenAddress(wsolMintAddress, keypair.publicKey);
            const recipientTokenAccount = await getAssociatedTokenAddress(wsolMintAddress, wallet.publicKey);

            // Create a new transaction for each keypair
            const transaction = new Transaction();

            // Add the transfer instruction to the transaction
            transaction.add(
                createTransferInstruction(
                    senderTokenAccount,
                    recipientTokenAccount,
                    keypair.publicKey, // Signer
                    await connection.getTokenAccountBalance(senderTokenAccount), // Amount to transfer
                    [],
                    TOKEN_PROGRAM_ID
                )
            );

            // Fetch the recent blockhash and set it to the transaction
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            // Sign the transaction
            await transaction.sign(keypair);

            transactions.push(transaction);
        }

        // Serialize and send all transactions
        const signatures = await Promise.all(
            transactions.map(async (tx) => {
                const serializedTx = tx.serialize();
                return connection.sendRawTransaction(serializedTx, { skipPreflight: false });
            })
        );

        console.log('Transactions sent with signatures:', signatures);
    } catch (error) {
        console.error('Error creating or sending WSOL transactions:', error);
    }
}
