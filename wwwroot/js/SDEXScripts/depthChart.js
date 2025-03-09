const { Asset, Server, Keypair, TransactionBuilder, Operation, BASE_FEE, Horizon } = StellarSdk;

let chart;

    async function fetchOrderBook() {
        try {
            // Fetch Stellar's order book for XLM/USDC pair
            const orderBook = await server.orderbook(usdcAsset, xlmAsset).call();

            // Process Bids and Asks
            const bids = processOrders(orderBook.bids, true); // Bids are buying XLM with USDC
            const asks = processOrders(orderBook.asks, false); // Asks are selling XLM for USDC

            // Render the depth chart using the fetched bids and asks
            renderDepthChart(bids, asks);

        } catch (error) {
            console.error('Error fetching order book:', error);
        }
    }

    function processOrders(orders, isBid) {
        return orders.map(order => {
            const price = parseFloat(order.price);
            const volume = parseFloat(order.amount);

            // Invert the price to display USD/USDC per XLM
            const invertedPrice = 1 / price;

            return { price: invertedPrice, volume };
        });
    }

    function renderDepthChart(bids, asks) {
        const ctx = document.getElementById('depthChart').getContext('2d');

        // Sort bids in descending order (higher prices are on top for buyers)
        const sortedBids = bids.sort((a, b) => b.price - a.price);

        // Sort asks in ascending order (lower prices are on top for sellers)
        const sortedAsks = asks.sort((a, b) => a.price - b.price);

        // Cumulative volumes for bids and asks
        const cumulativeBids = getCumulativeVolumes(sortedBids);
        const cumulativeAsks = getCumulativeVolumes(sortedAsks);

        // Extend bids and asks with dummy points to anchor the chart
        const extendedBids = [
            { x: sortedBids[0].price, y: 0 }, // Start of bids
            ...cumulativeBids.map(b => ({ x: b.price, y: b.volume })),
            { x: sortedBids[sortedBids.length - 1].price, y: cumulativeBids[cumulativeBids.length - 1].volume }, // Last point for smooth curve
        ];

        const extendedAsks = [
            { x: sortedAsks[0].price, y: 0 }, // Start of asks
            ...cumulativeAsks.map(a => ({ x: a.price, y: a.volume })),
            { x: sortedAsks[sortedAsks.length - 1].price, y: cumulativeAsks[cumulativeAsks.length - 1].volume }, // Last point for smooth curve
        ];

        // Create gradient effects for bids and asks
        const bidGradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        bidGradient.addColorStop(0, 'rgba(0, 255, 0, 0.5)');
        bidGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');

        const askGradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        askGradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
        askGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        // Configure chart with proper axes and gradient effects
        const config = {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Bids',
                        data: extendedBids,
                        borderColor: 'green',
                        backgroundColor: bidGradient,
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.2,  // Reduced tension to smooth the curve
                        fill: true,
                    },
                    {
                        label: 'Asks',
                        data: extendedAsks,
                        borderColor: 'red',
                        backgroundColor: askGradient,
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.2,  // Reduced tension to smooth the curve
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true,
                animation: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                return `${tooltipItem.dataset.label}: ${tooltipItem.raw.y} XLM`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: { display: true, text: 'Price (USD/USDC per XLM)' },
                        ticks: {
                            callback: function (value) {
                                return value.toFixed(2); // Format price with 2 decimal places
                            },
                        },
                        // Reverse the bids to display them on the right side
                        reverse: false,
                    },
                    y: {
                        title: { display: true, text: 'Volume (XLM)' },
                        beginAtZero: true,
                    },
                },
            },
        };

        // Destroy the previous chart instance if it exists
        if (chart) {
            chart.destroy();
        }

        // Create new chart
        chart = new Chart(ctx, config);
    }

    function getCumulativeVolumes(orders) {
        let cumulativeVolume = 0;
        return orders.map(order => {
            cumulativeVolume += order.volume;
            return { price: order.price, volume: cumulativeVolume };
        });
    }

    // Initialize and fetch the orderbook every 1 second
    function init() {
        fetchOrderBook();
        setInterval(fetchOrderBook, 1000);  // Update the chart every 1 second
    }

    init();
