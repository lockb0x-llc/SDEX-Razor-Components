const server = new StellarSdk.Horizon.Server('https:horizon.stellar.org');
const usdcAsset = new StellarSdk.Asset('USDC', 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
const xlmAsset = StellarSdk.Asset.native();

const CHART_INTERVAL = 30 * 60 * 1000; // 30-minute candles
const REALTIME_INTERVAL = 5 * 1000; // 5 seconds update interval
const MAX_TIMEFRAME = 12 * 60 * 60 * 1000; // Last 12 hours

let historicalData = [];

async function fetchHistoricalTrades() {
    let trades = [];
    let cursor = "now";
    let keepFetching = true;
    const now = Date.now();

    while (keepFetching) {
        const response = await server
            .trades()
            .forAssetPair(xlmAsset, usdcAsset)
            .order("desc")
            .limit(200)
            .cursor(cursor)
            .call();

        if (response.records.length === 0) break;

        for (const trade of response.records) {
            const tradeTime = new Date(trade.ledger_close_time).getTime();
            if (now - tradeTime > MAX_TIMEFRAME) {
                keepFetching = false;
                break;
            }
            trades.push(trade);
        }

        cursor = response.records[response.records.length - 1].paging_token;
        await new Promise((resolve) => setTimeout(resolve, 200)); // Prevent API rate limiting
    }

    return processTradeData(trades);
}

function processTradeData(trades) {
    const groupedData = [];
    trades.forEach((trade) => {
        const time = new Date(trade.ledger_close_time);
        const price = parseFloat(trade.price.n) / parseFloat(trade.price.d);
        const amount = parseFloat(trade.base_amount);
        const timeIndex =
            Math.floor(time.getTime() / CHART_INTERVAL) * CHART_INTERVAL;

        let candle = groupedData.find((c) => c.x === timeIndex);
        if (!candle) {
            candle = {
                x: timeIndex,
                o: price,
                h: price,
                l: price,
                c: price,
                volume: amount,
            };
            groupedData.push(candle);
        } else {
            candle.h = Math.max(candle.h, price);
            candle.l = Math.min(candle.l, price);
            candle.c = price;
            candle.volume += amount;
        }
    });

    return groupedData.sort((a, b) => a.x - b.x);
}

function renderChart(data) {
    const ohlcData = data.map((d) => ({
        x: new Date(d.x),
        open: d.o,
        high: d.h,
        low: d.l,
        close: d.c,
    }));

    const layout = {
        title: "XLM-USD Trading Chart [12-Hour History]",
        xaxis: { type: "date", title: "Time", rangeslider: { visible: false } },
        yaxis: { title: "Price (USD)" },
        paper_bgcolor: "#1a1a1a",
        plot_bgcolor: "#1a1a1a",
        font: { color: "#fff" },
    };

    Plotly.newPlot(
        "tradingChart",
        [
            {
                x: ohlcData.map((d) => d.x),
                open: ohlcData.map((d) => d.open),
                high: ohlcData.map((d) => d.high),
                low: ohlcData.map((d) => d.low),
                close: ohlcData.map((d) => d.close),
                type: "candlestick",
                increasing: {
                    line: { color: "green" },
                    fillcolor: "green", // Green fill matching the outline
                },
                decreasing: {
                    line: { color: "red" },
                    fillcolor: "red", // Red fill matching the outline
                },
            },
        ],
        layout
    );
}

async function updateLastCandle() {
    try {
        const response = await server
            .trades()
            .forAssetPair(xlmAsset, usdcAsset)
            .order("desc")
            .limit(1)
            .call();

        const trade = response.records[0];
        const tradeTime = new Date(trade.ledger_close_time).getTime();
        const price = parseFloat(trade.price.n) / parseFloat(trade.price.d);
        const amount = parseFloat(trade.base_amount);
        const timeIndex =
            Math.floor(tradeTime / CHART_INTERVAL) * CHART_INTERVAL;

        let lastCandle = historicalData.find((c) => c.x === timeIndex);
        if (!lastCandle) {
            lastCandle = {
                x: timeIndex,
                o: price,
                h: price,
                l: price,
                c: price,
                volume: amount,
            };
            historicalData.push(lastCandle);
        } else {
            lastCandle.h = Math.max(lastCandle.h, price);
            lastCandle.l = Math.min(lastCandle.l, price);
            lastCandle.c = price;
            lastCandle.volume += amount;
        }

        historicalData.sort((a, b) => a.x - b.x);
        renderChart(historicalData);
    } catch (error) {
        console.error("Error updating the last candle:", error);
    }
}

// Rotate spinner with JavaScript
function rotateSpinner() {
    const spinner = document.getElementById("spinner");
    let angle = 0;
    setInterval(() => {
        angle += 6;
        spinner.style.transform = `rotate(${angle}deg)`;
    }, 50); // Rotate 6 degrees every 50ms
}

async function initializeChart() {
    // Show the loading spinner
    document.getElementById("loadingContainer").style.display = "flex";
    rotateSpinner(); // Start rotating the spinner

    // Fetch historical data and render the chart
    historicalData = await fetchHistoricalTrades();
    renderChart(historicalData);

    // Hide the loading spinner and show the chart
    document.getElementById("loadingContainer").style.display = "none";

    // Set up real-time updates every 5 seconds
    setInterval(updateLastCandle, REALTIME_INTERVAL);
}

initializeChart();
