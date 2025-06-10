import { PublicKey, Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';

export const rayFee = new PublicKey('7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5');
export const tipAcct = new PublicKey('Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY');
export const RayLiqPoolv4 = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');

/*
export const connection = new Connection('https://api.mainnet-beta.solana.com', { // RPC URL HERE
    commitment: 'confirmed',
});
*/
export const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');  // For test purpose

export const pairID = "2QNuUP1jts3wEsvMH454w5GSYPiu34Nwo8UphnquTCmX";
// https://go.getblock.io/93a01e517d7d4c99a9ee4364cd3d34ad 

export const wallet = Keypair.fromSecretKey(
    bs58.decode(
        '3q2ejYJm7PaJXKVR4cZeffnDWkhSAURq6T7S2v1aQvX8b5cijvyP2XRS8mCnz9xRhnf51f2ypMLFk8ojkBWDNdY4' // PRIV KEY OF SOL SENDER
    )
);