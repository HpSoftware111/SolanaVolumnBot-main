import {
    swapInstruction,
} from '@raydium-io/raydium-sdk';
import {
    PublicKey,
    Transaction
} from '@solana/web3.js';
import { connection, wallet } from '../config.js';
import PromptSync from 'prompt-sync';
import { loadKeypairs } from './createWallets.js';

const prompt = PromptSync();

async function getTokenAccountsByOwner(ownerPubkey, tokenMintAddress) {

    // Token Program ID
    const tokenProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

    // Mint Public Key for the specific token (e.g., WSOL)
    const mintPublicKey = new PublicKey(tokenMintAddress);

    // Fetch token accounts by owner
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPubkey, {
        programId: tokenProgramId,
        mint: mintPublicKey // Filter by mint address
    });

    return tokenAccounts.value[0];
}

async function SwapIn(keypair) {
    const programId = new PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");
    const payer = wallet.publicKey;
    const poolId = new PublicKey("2QNuUP1jts3wEsvMH454w5GSYPiu34Nwo8UphnquTCmX");
    const ammconfigId = new PublicKey("D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2");
    const inputTokenAccount = await getTokenAccountsByOwner(keypair.publicKey, "So11111111111111111111111111111111111111112");
    const outputTokenAccount = await getTokenAccountsByOwner(keypair.publicKey, "7WfUQNHUCZgkZXf7vFo2Gm8VPcLF4buV87APp5DAueFD");
    const inputMint = new PublicKey("So11111111111111111111111111111111111111112");
    const outputMint = new PublicKey("7WfUQNHUCZgkZXf7vFo2Gm8VPcLF4buV87APp5DAueFD");
    const tickArray = [];
    const observationId = new PublicKey("7fhCLWDyHPfpz8QE9QU9Bw9FJ84GYhhfN1k3x2dZ6mz6");
    const tokenAccountInfo = inputTokenAccount.account.data.parsed.info;
    const amount = tokenAccountInfo.tokenAmount.uiAmount;
    const otherAmountThresold = new BN(1);
    const sqrtPriceLimitX64 = new BN('0xffffffffffffffffffffffffffffffff', 'hex');
    const isBaseInput = true
    const tx = swapInstruction(programId, payer, poolId, ammconfigId, inputTokenAccount, outputTokenAccount, inputMint, outputMint, tickArray, observationId, amount, otherAmountThresold, sqrtPriceLimitX64, isBaseInput);
    const transaction = new Transaction().add(tx);
    const res = await connection.sendTransaction(transaction, [wallet, loadKeypairs()[0]], { preflightCommitment: 'confirmed' });
    console.log(res);
}

async function SwapOut(keypair) {
    const programId = new PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");
    const payer = wallet.publicKey;
    const poolId = new PublicKey("2QNuUP1jts3wEsvMH454w5GSYPiu34Nwo8UphnquTCmX");
    const ammconfigId = new PublicKey("D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2");
    const inputTokenAccount = await getTokenAccountsByOwner(keypair.publicKey, "So11111111111111111111111111111111111111112");
    const outputTokenAccount = await getTokenAccountsByOwner(keypair.publicKey, "7WfUQNHUCZgkZXf7vFo2Gm8VPcLF4buV87APp5DAueFD");
    const inputMint = new PublicKey("So11111111111111111111111111111111111111112");
    const outputMint = new PublicKey("7WfUQNHUCZgkZXf7vFo2Gm8VPcLF4buV87APp5DAueFD");
    const tickArray = [];
    const observationId = new PublicKey("7fhCLWDyHPfpz8QE9QU9Bw9FJ84GYhhfN1k3x2dZ6mz6");
    const tokenAccountInfo = outputTokenAccount.account.data.parsed.info;
    const amount = tokenAccountInfo.tokenAmount.uiAmount;
    const otherAmountThresold = new BN(1);
    const sqrtPriceLimitX64 = new BN('0xffffffffffffffffffffffffffffffff', 'hex');
    const isBaseInput = false
    const tx = swapInstruction(programId, payer, poolId, ammconfigId, inputTokenAccount, outputTokenAccount, inputMint, outputMint, tickArray, observationId, amount, otherAmountThresold, sqrtPriceLimitX64, isBaseInput);
    const transaction = new Transaction().add(tx);
    const res = await connection.sendTransaction(transaction, [wallet, loadKeypairs()[0]], { preflightCommitment: 'confirmed' });
    console.log(res);
}

export async function makeVolumn() {
    let roundCount = 3;
    do {
        if (roundCount == NaN || roundCount < 0) {
            console.log("The round count have to be positive integer.");
        }
        roundCount = parseInt(prompt("Please input the count that you want execute swap(Ex. 5): "));
    } while (!roundCount);
    const keypairs = loadKeypairs();
    for (let curRound = 0; curRound < roundCount; curRound++) {
        console.log(`Round ${curRound + 1} started!`);
        for (let i = 0; i < keypairs.length; i++) {
            await SwapIn(keypairs[i]);
            await SwapOut(keypairs[i]);
        }
        console.log(`Round ${curRound + 1} finished!`);
    }

    console.log("Swap has finished succesfully!");
}