import { LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction } from "@solana/spl-token";
import PromptSync from "prompt-sync";
import { loadKeypairs } from "./createWallets.js";
import { connection, tipAcct, wallet } from "../config.js";

const prompt = PromptSync();

export async function sendSOLWSOL() {

    //Get input of solAmount
    console.log("This SOL is only used for transaction fees...");
    let solAmount = 0.1;
    do {
        if (solAmount == NaN || solAmount < 0) {
            console.log("The SOL amount have to be positive number.");
        }
        solAmount = parseFloat(prompt("Please enter amount of SOL you want distribute (Ex. 0.1): "));
    } while (!solAmount);

    //Get input of tipAmount
    let tipAmount = 0.001;
    do {
        if (tipAmount == NaN || tipAmount < 0) {
            console.log("The tip amount have to be positive number.");
        }
        tipAmount = prompt("Jito tip in Sol (Ex. 0.01): ");
    } while (!tipAmount);

    //Get keypairs and calculated required amount of SOL
    const keypairs = loadKeypairs();
    const walletCount = keypairs.length;
    const requiredSOLAmount = (parseFloat(solAmount) + parseFloat(tipAmount)) * walletCount;
    console.log("Required SOL Amount : " + requiredSOLAmount);
    const balance = await connection.getBalance(wallet.publicKey);
    const balanceSol = balance / LAMPORTS_PER_SOL;
    console.log("Your current balance is", balanceSol);
    if (balanceSol < requiredSOLAmount) {  // Check the balance of your wallet
        console.log("You have not enough SOL.");
        return;
    }

    //Send SOL to wallets
    await sendBundle(keypairs.map(keypair => keypair.publicKey), solAmount, tipAmount);

    //Get input of wsolAmount
    let wsolAmount = 0.1;
    do {
        if (wsolAmount == NaN || wsolAmount < 0) {
            console.log("The WSOL amount have to be positive number.");
        }
        solAmount = parseFloat(prompt("Please enter amount of WSOL you want distribute (Ex. 0.1): "));
    } while (!wsolAmount);

    //Send WSOL to wallets
    await sendWSOLBundle(keypairs, wsolAmount);
}

async function createWSOLTransaction(keypair, wsolAmount) {
    try {
        const wsolMintAddress = new PublicKey('So11111111111111111111111111111111111111112');
        const grumpMintAddress = new PublicKey('7WfUQNHUCZgkZXf7vFo2Gm8VPcLF4buV87APp5DAueFD');
        const recipientPublicKey = keypair.publicKey;
        // Fetch the token accounts for the wallet and recipient
        const senderTokenAccount = await getAssociatedTokenAddress(wsolMintAddress, wallet.publicKey);
        const recipientTokenAccount = await getAssociatedTokenAddress(wsolMintAddress, recipientPublicKey);
        const recipientGruTokenAccount = await getAssociatedTokenAddress(grumpMintAddress, recipientPublicKey);

        const transaction = new Transaction();

        // Check if the sender has an associated token account, and create one if not
        const senderTokenAccountInfo = await connection.getAccountInfo(senderTokenAccount);
        if (!senderTokenAccountInfo) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    senderTokenAccount,
                    wallet.publicKey,
                    wsolMintAddress
                )
            );
        }

        // Check if the recipient has an associated token account, and create one if not
        const recipientTokenAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
        if (!recipientTokenAccountInfo) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    recipientTokenAccount,
                    recipientPublicKey,
                    wsolMintAddress
                )
            );
        }

        const recipientGruTokenAccountInfo = await connection.getAccountInfo(recipientGruTokenAccount);
        if (!recipientGruTokenAccountInfo) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    recipientGruTokenAccount,
                    recipientPublicKey,
                    grumpMintAddress
                )
            );
        }

        // Add the transfer instruction to the transaction
        transaction.add(
            createTransferInstruction(
                senderTokenAccount,
                recipientTokenAccount,
                wallet.publicKey, // Signer
                wsolAmount * LAMPORTS_PER_SOL,
                [],
                TOKEN_PROGRAM_ID
            )
        );

        // Fetch the recent blockhash and set it to the transaction
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;

        // Sign the transaction
        await transaction.sign(wallet);

        return transaction;
    } catch (error) {
        console.error('Error creating WSOL transaction:', error);
    }
}

async function sendWSOLBundle(keypairs, wsolAmount) {
    try {
        const transactions = [];

        for (const recipient of keypairs) {
            const txn = await createWSOLTransaction(recipient, wsolAmount);
            transactions.push(txn);
        }

        // Serialize transactions and prepare for sending
        const signedTransactions = transactions.map((txn) => txn.serialize());

        // Send the transactions as a bundle
        const signatures = await Promise.all(
            signedTransactions.map((txn) => connection.sendRawTransaction(txn))
        );

        console.log('Transactions sent with signatures:', signatures);
    } catch (error) {
        console.error('Error sending transactions:', error);
    }
}

async function sendBundle(recipientPublicKeys, solAmount, jitoTip) {
    try {
        const transactions = [];

        for (const recipient of recipientPublicKeys) {
            const txn = await createSOLTransaction(recipient, solAmount, jitoTip);
            transactions.push(txn);
        }

        // Serialize transactions and prepare for sending
        const signedTransactions = transactions.map((txn) => txn.serialize());

        // Send the transactions as a bundle
        const signatures = await Promise.all(
            signedTransactions.map((txn) => connection.sendRawTransaction(txn))
        );

        console.log('Transactions sent with signatures:', signatures);
    } catch (error) {
        console.error('Error sending transactions:', error);
    }
}

async function createSOLTransaction(recipient, solAmount, jitoTip) {
    const { blockhash } = await connection.getLatestBlockhash();

    const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: wallet.publicKey
    }).add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: recipient,
            lamports: solAmount * LAMPORTS_PER_SOL,
        })
    );

    // Adding Jito tip as a fee payer
    transaction.add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: tipAcct, // Replace with Jito validator or recipient
            lamports: jitoTip * LAMPORTS_PER_SOL,
        })
    );

    // Sign the transaction
    transaction.sign(wallet);

    return transaction;
}