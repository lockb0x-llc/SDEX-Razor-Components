const { Asset, Server, Keypair, TransactionBuilder, Operation, BASE_FEE, Horizon } = StellarSdk;

async function fetchExchangeData() {
    try {
        const response = await fetch(
            "https://api.coincap.io/v2/assets/stellar"
        );
        const data = await response.json();

        const {
            marketCapUsd,
            volumeUsd24Hr,
            supply,
            priceUsd,
            changePercent24Hr,
        } = data.data;

        // Format Market Cap
        const formattedMarketCap = formatMarketCap(marketCapUsd);
        document.getElementById("exchangeMarketCap").textContent =
            formattedMarketCap;

        // Format Exchange Volume (24Hr XLM)
        const formattedVolumeXLM = volumeUsd24Hr
            ? formatNumberWithUnits(volumeUsd24Hr)
            : "-";
        document.getElementById("exchangeVolumeXLM").textContent =
            `${formattedVolumeXLM} USD`;

        // Format Supply
        const formattedSupply = supply ? formatNumberWithUnits(supply) : "-";
        document.getElementById("exchangeSupply").textContent = formattedSupply;

        // Format Current Price (1 XLM in USD)
        const formattedPrice = priceUsd
            ? `$${parseFloat(priceUsd).toFixed(6)}`
            : "-";
        document.getElementById("currentPrice").textContent = formattedPrice;

        // Format Change (24Hr)
        const formattedChange = changePercent24Hr
            ? formatChange(changePercent24Hr)
            : "-";
        document.getElementById("priceChange").innerHTML = formattedChange;
    } catch (error) {
        console.error("Error fetching exchange data:", error);
    }
}

function formatMarketCap(marketCap) {
    const number = parseFloat(marketCap);
    if (isNaN(number)) return "-";
    if (number >= 1e12) return (number / 1e12).toFixed(2) + " T";
    if (number >= 1e9) return (number / 1e9).toFixed(2) + " B";
    if (number >= 1e6) return (number / 1e6).toFixed(2) + " M";
    return number.toLocaleString();
}

function formatNumberWithUnits(number) {
    const num = parseFloat(number);
    if (isNaN(num)) return "-";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + " T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + " B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + " M";
    return num.toFixed(2);
}

function formatChange(changePercent) {
    const change = parseFloat(changePercent);
    const sign = change >= 0 ? "▲" : "▼";
    const colorClass = change >= 0 ? "change-up" : "change-down";
    const formattedChange = `${sign} ${Math.abs(change).toFixed(2)}%`;

    return `<span class="${colorClass}">${formattedChange}</span>`;
}

async function fetchOnChainData() {
    try {
        const orderBook = await server.orderbook(usdcAsset, xlmAsset).call();

        // Debugging: Log the raw order book data to check for any issues
        console.log("Raw Order Book:", orderBook);

        // Process Bids and Asks
        const bids = processOrders(orderBook.bids, true);
        const asks = processOrders(orderBook.asks, false);

        // Debugging: Log processed bids and asks
        console.log("Processed Bids:", bids);
        console.log("Processed Asks:", asks);

        // Calculate On-Chain Volume (Total XLM volume from all bids and asks)
        const onChainVolume = calculateOnChainVolume(orderBook);
        console.log("Calculated On-Chain Volume:", onChainVolume); // Debugging volume

        document.getElementById("onChainVolume").textContent =
            `${onChainVolume} XLM`;

        // Check if we have valid bids and filter out invalid values
        const validBids = bids.filter(
            (bid) => !isNaN(bid.price) && bid.price > 0
        );
        console.log("Valid Bids:", validBids); // Debugging valid bids

        // If there are no valid bids, we can't calculate the high
        if (validBids.length === 0) {
            console.error("No valid bids found!");
            document.getElementById("highPrice").textContent = "-";
            return;
        }

        // Get the highest bid from the valid bids
        const high = Math.max(...validBids.map((bid) => bid.price));
        console.log("Calculated Highest Bid:", high); // Debugging log for the highest bid

        // Check for asks, and calculate the reciprocal for the lowest ask
        const low =
            asks.length > 0 ? Math.min(...asks.map((ask) => ask.price)) : "-";
        console.log("Calculated Lowest Ask:", low); // Debugging log for the lowest ask

        // Apply reciprocal to the low price (for sell orders)
        const reciprocalLow = low !== "-" ? (1 / low).toFixed(6) : "-"; // Reciprocal for low
        const formattedHigh = high !== "-" ? (1 / high).toFixed(6) : "-"; // Format the highest bid

        // Update the display for On-Chain High and Low
        document.getElementById("highPrice").textContent = `$${formattedHigh}`; // Display highest bid
        document.getElementById("lowPrice").textContent = `$${reciprocalLow}`; // Display reciprocal of lowest ask
    } catch (error) {
        console.error("Error fetching on-chain data:", error);
    }
}

function processOrders(orders, isBid) {
    // Process and return orders as valid price/amount objects
    return orders.map((order) => ({
        price: isBid ? parseFloat(order.price) : parseFloat(order.price),
        cumulativeVolume: parseFloat(order.amount),
    }));
}

function calculateOnChainVolume(orderBook) {
    // Calculate the total XLM volume from bids and asks
    const totalBidsVolume = orderBook.bids.reduce(
        (total, bid) => total + parseFloat(bid.amount),
        0
    );
    const totalAsksVolume = orderBook.asks.reduce(
        (total, ask) => total + parseFloat(ask.amount),
        0
    );

    const totalVolume = totalBidsVolume + totalAsksVolume;
    return totalVolume.toFixed(2); // Round total volume to 2 decimal places
}

function init() {
    fetchExchangeData();
    fetchOnChainData();
    setInterval(fetchOnChainData, 1500); // Update every 0.5 seconds
    setInterval(fetchExchangeData, 500); // Update every 5 seconds for exchange data
}

init();
