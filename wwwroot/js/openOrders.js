

const message = document.getElementById("message");
const ordersTable = document.getElementById("ordersTable");


const { Asset, Server, Keypair, TransactionBuilder, Operation, BASE_FEE, Horizon } = StellarSdk;

let keypair;
let publicKey;

document.getElementById("submitKeyButton").addEventListener("click", () => {
    const secretKeyInput = document.getElementById("secretKeyInput").value.trim();

    if (!secretKeyInput) {
        message.textContent = "Please enter a valid secret key.";
        message.style.color = "red";
        return;
    }

    try {
        keypair = Keypair.fromSecret(secretKeyInput);
        publicKey = keypair.publicKey();
        message.textContent = "Secret key accepted. Fetching orders...";
        message.style.color = "green";

        // Fetch orders once the key is set
        fetchOpenOrders();
        fetchLiquidity();
    } catch (error) {
        console.error("Invalid secret key:", error);
        message.textContent = "Invalid secret key. Please try again.";
        message.style.color = "red";
    }
});

// Fetching open orders
async function fetchOpenOrders() {
    if (!publicKey) {
        ordersTable.innerHTML = "<p>Please enter a valid secret key to load orders.</p>";
        return;
    }

    try {
        const response = await server.offers().forAccount(publicKey).call();

        const orders = response.records.filter(order => parseFloat(order.amount) > 0); // Remove fulfilled orders
        if (orders.length === 0) {
            ordersTable.innerHTML = "<p>No open orders found.</p>";
            return;
        }

        let tableHTML = `
<table>
    <thead>
        <tr>
            <th>Order ID</th>
            <th>Selling</th>
            <th>Buying</th>
            <th>Amount</th>
            <th>Price</th>
            <th>Action</th>
        </tr>
    </thead>
    <tbody>
        `;

        orders.forEach(order => {
        const formattedPrice = parseFloat(order.price).toFixed(7);
        const reciprocalPrice = (1 / parseFloat(order.price)).toFixed(7);
        const isSellingNative = order.selling.asset_type === "native";
        const isBuyingNative = order.buying.asset_type === "native";

        const displayPrice = isSellingNative || !isBuyingNative
        ? formattedPrice
        : reciprocalPrice;

        tableHTML += `
        <tr>
            <td>${order.id}</td>
            <td>${formatAsset(order.selling)}</td>
            <td>${formatAsset(order.buying)}</td>
            <td>${order.amount}</td>
            <td>${displayPrice}</td>
            <td>
                <button class="cancel" onclick="cancelOrder('${order.id}', '${order.selling.asset_type}', '${order.buying.asset_type}', '${order.selling.asset_code}', '${order.buying.asset_code}', '${order.selling.asset_issuer}', '${order.buying.asset_issuer}', this)">Cancel</button>
            </td>
        </tr>
        `;
        });

        tableHTML += `
    </tbody>
</table>`;
        ordersTable.innerHTML = tableHTML;
    } catch (error) {
        console.error("Error fetching orders:", error);
        ordersTable.innerHTML = `<p>Error loading orders: ${error.message}</p>`;
    }
}


        // Format the asset data
        function formatAsset(asset) {
            return asset.asset_type === "native" ? "XLM" : asset.asset_code;
        }

        // Cancel the order
        async function cancelOrder(orderId, sellingAssetType, buyingAssetType, sellingAssetCode, buyingAssetCode, sellingAssetIssuer, buyingAssetIssuer, button) {
            try {
                message.textContent = "Cancelling order...";
                message.style.color = "black";

                button.disabled = true; // Disable button to prevent duplicate submissions

                const account = await server.loadAccount(publicKey);

                const selling = sellingAssetType === "native"
                    ? Asset.native()
                    : new Asset(sellingAssetCode, sellingAssetIssuer);

                const buying = buyingAssetType === "native"
                    ? Asset.native()
                    : new Asset(buyingAssetCode, buyingAssetIssuer);

                const transaction = new TransactionBuilder(account, {
                    fee: BASE_FEE,
                    networkPassphrase: NETWORK_PASSPHRASE
                })
                .addOperation(Operation.manageSellOffer({
                    selling,
                    buying,
                    amount: "0", // Cancel the offer
                    price: "1",  // Price is irrelevant for cancellation
                    offerId: orderId
                }))
                .setTimeout(30)
                .build();

                transaction.sign(keypair);
                await server.submitTransaction(transaction);

                message.textContent = "Order cancelled successfully!";
                message.style.color = "green";

                fetchOpenOrders(); // Refresh the list of orders after cancellation
            } catch (error) {
                console.error("Error cancelling order:", error);
                message.textContent = `Error cancelling order: ${error.message}`;
                message.style.color = "red";
                button.disabled = false; // Re-enable button in case of error
            }
        }

        // Fetching the liquidity of the order book on SDEX
        async function fetchLiquidity() {
            try {
                const orderBook = await server.orderbook(usdcAsset, xlmAsset).call();

                // Log the best bids and asks (liquidity)
                console.log("Best Bid Orders (Buy Orders):", orderBook.bids);
                console.log("Best Ask Orders (Sell Orders):", orderBook.asks);

                // Display the liquidity in the console
                if (orderBook.bids.length > 0) {
                    console.log(`Best bid price for XLM/USDC: ${orderBook.bids[0].price} for ${orderBook.bids[0].amount} XLM`);
                } else {
                    console.log("No bids available.");
                }

                if (orderBook.asks.length > 0) {
                    console.log(`Best ask price for XLM/USDC: ${orderBook.asks[0].price} for ${orderBook.asks[0].amount} XLM`);
                } else {
                    console.log("No asks available.");
                }
            } catch (error) {
                console.error("Error fetching liquidity:", error);
            }
        }

        // Auto-refresh every 10 seconds for open orders and liquidity
        setInterval(() => {
            fetchOpenOrders();
            fetchLiquidity();
        }, 10000);

        // Initial fetch
        fetchOpenOrders();
        fetchLiquidity();
