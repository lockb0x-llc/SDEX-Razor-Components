const assetMap = {
    XLM: { isNative: true }, // Mark as native
    BTC: {
        code: "BTC",
        issuer: "GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM",
    }, //mainnet only
    AQUA: {
        code: "AQUA",
        issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    }, //mainnet only
    ETH: {
        code: "ETH",
        issuer: "GBFXOHVAS43OIWNIO7XLRJAHT3BICFEIKOJLZVXNT572MISM4CMGSOCC",
    }, //mainnet only
    VELO: {
        code: "VELO",
        issuer: "GDM4RQUQQUVSKQA7S6EM7XBZP3FCGH4Q7CL6TABQ7B2BEJ5ERARM2M5M",
    }, //mainnet only
    USDC: {
        code: "USDC",
        issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    }, //mainnet only
};

document
    .getElementById("offerForm")
    .addEventListener("submit", async (event) => {
        event.preventDefault();

        const selectedAsset = document.getElementById("asset").value;
        const offerType = document.getElementById("offerType").value;
        const amount = parseFloat(
            document.getElementById("amount").value.trim()
        );
        const price = parseFloat(document.getElementById("price").value.trim());
        const secretKey = document.getElementById("secretKey").value.trim();

        const message = document.getElementById("message");
        message.textContent = "Processing...";
        message.style.color = "black";

        try {
            const {
                Asset,
                Operation,
                Keypair,
                Account,
                TransactionBuilder,
                BASE_FEE,
            } = window.StellarSdk;

            const keypair = Keypair.fromSecret(secretKey);
            const publicKey = keypair.publicKey();

            const NETWORK_PASSPHRASE =
                "Public Global Stellar Network ; September 2015";

            // Fetch account sequence
            const accountResponse = await server
                .accounts()
                .accountId(publicKey)
                .call();
            const account = new Account(publicKey, accountResponse.sequence);

            // Select the trading asset
            const assetDetails = assetMap[selectedAsset];
            const tradeAsset = assetDetails.isNative
                ? Asset.native()
                : new Asset(assetDetails.code, assetDetails.issuer);

            // USDC asset definition with issuer
            const usdcAsset = new Asset(
                "USDC",
                "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
            ); // Replace with the correct issuer

            // Ensure amount and price are valid
            if (isNaN(amount) || amount <= 0) {
                message.style.color = "red";
                message.textContent = "Invalid amount.";
                return;
            }

            if (isNaN(price) || price <= 0) {
                message.style.color = "red";
                message.textContent = "Invalid price.";
                return;
            }

            // Build the transaction
            const transaction = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: NETWORK_PASSPHRASE,
            });

            // Add operation based on offer type
            if (offerType === "sell") {
                transaction.addOperation(
                    Operation.manageSellOffer({
                        selling: tradeAsset,
                        buying: usdcAsset,
                        amount: amount.toFixed(7).toString(), // Ensure correct precision
                        price: price.toFixed(7).toString(), // Ensure correct precision
                        offerId: undefined, // Omit offerId, let network assign
                    })
                );
            } else {
                transaction.addOperation(
                    Operation.manageBuyOffer({
                        selling: usdcAsset,
                        buying: tradeAsset,
                        buyAmount: amount.toFixed(7).toString(),
                        price: price.toFixed(7).toString(),
                        offerId: undefined, // Omit offerId, let network assign
                    })
                );
            }

            const builtTransaction = transaction.setTimeout(30).build();
            builtTransaction.sign(keypair);

            // Submit transaction
            const result = await server.submitTransaction(builtTransaction);

            message.style.color = "green";
            message.textContent = "Offer submitted successfully!";
        } catch (error) {
            message.style.color = "red";
            message.textContent = `Error: ${error.message}`;
        }
    });
