
const { Asset, Server, Keypair, TransactionBuilder, Operation, BASE_FEE, Horizon } = StellarSdk;
let baseFee = 100; // Default base fee in stroops (100 stroops = 0.0001 XLM)
let xlmPriceUSD = 0; // To store the current price of XLM in USD

// Fetch the current network fee stats from the testnet
async function fetchNetworkFee() {
    try {
        const response = await server.feeStats();
        console.log("Fee stats response:", response); // Log the response to check the structure

        // Update the base fee if available
        if (response && response.last_ledger_base_fee) {
            baseFee = parseInt(response.last_ledger_base_fee); // Update with the latest base fee
        } else {
            console.error("Base fee not available in response.");
        }
    } catch (error) {
        console.error("Error fetching network fee:", error);
    }
}

// Function to calculate the total fee for a manageBuyOffer or manageSellOffer operation
function calculateTransactionFee(offerPrice, offerAmount) {
    const instructionsCostPer10K = 25; // 10,000 instructions = 25 stroops
    const readLedgerCost = 6250; // 1 ledger entry read = 6250 stroops
    const writeLedgerCost = 10000; // 1 ledger entry written = 10000 stroops
    const bandwidthCostPerKB = 1624; // 1 KB transaction size = 1624 stroops

    // Dynamic calculations based on the offer price and amount
    const offerPriceMultiplier = offerPrice > 0 ? offerPrice : 1; // Prevent division by zero or negative values
    const offerAmountMultiplier = offerAmount > 0 ? offerAmount : 1; // Prevent division by zero or negative values

    // Calculate fees based on transaction components
    const instructionsCost = Math.ceil(10000 / 10000) * instructionsCostPer10K;
    const readCost = 2 * readLedgerCost; // 2 reads (estimate)
    const writeCost = writeLedgerCost; // 1 write (estimate)
    const transactionSizeKB = 129; // Example size of the transaction
    const bandwidthCost = transactionSizeKB * bandwidthCostPerKB;

    // Calculate dynamic fee based on input values
    const dynamicFee = baseFee * offerPriceMultiplier * offerAmountMultiplier;

    // Total fee in stroops
    const totalFeeInStroops =
        instructionsCost + readCost + writeCost + bandwidthCost + dynamicFee;

    // Convert stroops to XLM for rent cost calculation
    const stroopsToXLM = 1 / 1e7;

    // Convert stroops to XLM for total fee
    const totalFeeInXLM = totalFeeInStroops / 1e7;

    return {
        feeInStroops: totalFeeInStroops,
        feeInXLM: totalFeeInXLM,
    };
}

// Function to fetch the current price of XLM in USD from CoinCap API
async function fetchXLMPrice() {
    try {
        const response = await fetch(
            "https://api.coincap.io/v2/assets/stellar"
        );
        const data = await response.json();

        if (data && data.data && data.data.priceUsd) {
            xlmPriceUSD = parseFloat(data.data.priceUsd);
        } else {
            console.error("Error fetching XLM price from API");
        }
    } catch (error) {
        console.error("Error fetching XLM price:", error);
    }
}

// Handle the button click to calculate the fee
document.getElementById("calculateFeeBtn").addEventListener("click", () => {
    const offerPrice = parseFloat(document.getElementById("offerPrice").value);
    const offerAmount = parseFloat(
        document.getElementById("offerAmount").value
    );

    if (isNaN(offerPrice) || isNaN(offerAmount)) {
        alert("Please enter valid offer price and amount values.");
        return;
    }

    const { feeInStroops, feeInXLM } = calculateTransactionFee(
        offerPrice,
        offerAmount
    );
    document.getElementById("feeResult").textContent = feeInStroops.toFixed(0); // Display fee in stroops
    document.getElementById("feeXLMResult").textContent = feeInXLM.toFixed(8); // Display fee in XLM

    // Convert the XLM fee to USD and display it
    const feeInUSD = feeInXLM * xlmPriceUSD;
    document.getElementById("feeUSDResult").textContent = feeInUSD.toFixed(8); // Display fee in USD
});

// Initialize the page by fetching the network fee and XLM price
fetchNetworkFee();
fetchXLMPrice();
