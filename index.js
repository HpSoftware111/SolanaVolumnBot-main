import { createWallets } from "./src/createWallets.js";
import { simulateVolumeBot } from "./src/simulateVolumnBot.js";
import { sendSOLWSOL } from "./src/distribute.js";
import { makeVolumn } from "./src/bot.js";
import { reclaim } from "./src/reclaim.js";
import promptSync from "prompt-sync";

const prompt = promptSync();

async function main() {
    let running = true;

    while (running) {
        console.log("Menu:");
        console.log("1. Create Wallets");
        console.log("2. Distribute SOL/WSOL");
        console.log("3. Simulate Volume");
        console.log("4. Start Volume");
        console.log("5. Reclaim SOL/WSOL");
        console.log("6. Check Balances");
        console.log("Type 'exit' to quit.");

        const answer = prompt("Choose an option or 'exit': "); // Use prompt-sync for user input

        switch (answer) {
            case "1":
                await createWallets();
                break;
            case "2":
                await sendSOLWSOL();
                break;
            case "3":
                await simulateVolumeBot();
                break;
            case "4":
                await makeVolumn();
                break;
            case "5":
                await reclaim();
                break;
            case "exit":
                running = false;
                break;
            default:
                console.log("Invalid option, please choose again.");
        }
    }

    console.log("Exiting...");
    process.exit(0);
}

main().catch((err) => {
    console.error("Error:", err);
});