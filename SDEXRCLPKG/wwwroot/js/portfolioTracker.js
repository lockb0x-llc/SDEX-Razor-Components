const { Asset, Server, Keypair, TransactionBuilder, Operation, BASE_FEE, Horizon } = StellarSdk;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("portfolioForm");
    const publicKeyInput = document.getElementById("stellarPublicKey");

    // Check if publicKey input element exists
    if (publicKeyInput) {
        console.log("Public key input element found");
    } else {
        console.log("Public key input element not found");
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Retrieve the publicKey value
        const publicKey = publicKeyInput.value.trim();
        console.log("Retrieved Public Key:", publicKey); // Debugging line

        // Validate if the publicKey is entered
        if (!publicKey || publicKey === "") {
            const message = document.getElementById("message");
            message.style.color = "red";
            message.textContent = "Please enter a valid Stellar public key.";
            return;
        }

        // Reset message and fetch data
        const message = document.getElementById("message");
        message.textContent = "Fetching portfolio...";
        message.style.color = "black";

        try {
            if (!/^G[A-Z2-7]{55}$/.test(publicKey)) {
                throw new Error("Invalid Stellar public key format.");
            }

            const accountResponse = await server
                .accounts()
                .accountId(publicKey)
                .call();

            // Clear portfolio div
            const portfolioDiv = document.getElementById("portfolio");
            portfolioDiv.innerHTML = "";

            // Display balances
            accountResponse.balances.forEach((balance) => {
                const assetType =
                    balance.asset_type === "native"
                        ? "XLM"
                        : balance.asset_code;
                const balanceItem = document.createElement("div");
                balanceItem.className = "portfolio-item";
                balanceItem.innerHTML = `<span>${assetType}:</span> ${balance.balance}`;
                portfolioDiv.appendChild(balanceItem);
            });

            message.style.color = "green";
            message.textContent = "Portfolio updated successfully!";
        } catch (error) {
            message.style.color = "red";
            message.textContent = `Error: ${error.message}`;
            console.error("Error during account fetch:", error);
        }
    });
});
