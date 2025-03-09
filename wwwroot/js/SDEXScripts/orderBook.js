async function fetchOrderBook() {
    try {
        const orderBook = await server.orderbook(usdcAsset, xlmAsset).call();

        // Display buy orders
        const buyOrders = orderBook.bids
            .slice(0, 20)
            .map(
                (order) => `
    <div class="order-item">
        <span>${parseFloat(order.amount).toFixed(6)}</span>
        <span class="buy-order">${(1 / parseFloat(order.price)).toFixed(4)}</span>
    </div>`
            )
            .join("");
        document.getElementById("buyOrders").innerHTML = buyOrders;

        // Display sell orders
        const sellOrders = orderBook.asks
            .slice(0, 20)
            .map(
                (order) => `
    <div class="order-item">
        <span class="sell-order">${(1 / parseFloat(order.price)).toFixed(4)}</span>
        <span>${parseFloat(order.amount).toFixed(2)}</span>
    </div>`
            )
            .join("");
        document.getElementById("sellOrders").innerHTML = sellOrders;
    } catch (error) {
        console.error("Error fetching order book:", error);
    }
}

// Fetch order book data every 10 seconds
fetchOrderBook();
setInterval(fetchOrderBook, 500);
