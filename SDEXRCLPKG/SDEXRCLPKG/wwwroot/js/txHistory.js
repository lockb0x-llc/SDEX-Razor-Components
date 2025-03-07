const { Asset, Server, Keypair, TransactionBuilder, Operation, BASE_FEE, Horizon } = StellarSdk;

document
    .getElementById("transactionForm")
    .addEventListener("submit", async (event) => {
        event.preventDefault();

        // Gather form inputs
        const publicKey = document.getElementById("publicKey").value.trim();
        const sortOrder = document.getElementById("sortOrder").value;

        // Reset message
        const message = document.getElementById("message");
        message.textContent = "Fetching transactions...";
        message.style.color = "black";

        try {
            const { Horizon } = window.StellarSdk;

            // Testnet setup
            //const server = new Horizon.Server('https://horizon-testnet.stellar.org');

            // Fetch transactions
            let transactions = await server
                .transactions()
                .forAccount(publicKey)
                .order(sortOrder)
                .call();

            // Display transactions
            const transactionList = document.getElementById("transactionList");
            transactionList.innerHTML = "";

            transactions.records.forEach((tx) => {
                const transactionItem = document.createElement("div");
                transactionItem.className = "transaction-item";

                // Format date to a human-readable format
                const date = new Date(tx.created_at);
                const formattedDate = date.toLocaleString();

                transactionItem.innerHTML = `
                        <span>ID:</span> <a href="https://horizon.stellar.org/transactions/${tx.id}" target="_blank">${tx.id.substring(0, 6)}...</a>
                        <span>Date:</span> ${formattedDate}
                        <span>Price:</span> ${tx.fee_charged / 10000000} XLM
                    `;
                transactionList.appendChild(transactionItem);
            });

            message.style.color = "green";
            message.textContent = "Transactions fetched successfully!";
        } catch (error) {
            message.style.color = "red";
            message.textContent = `Error: ${error.message}`;
            console.error("Full error:", error);
        }
    });
