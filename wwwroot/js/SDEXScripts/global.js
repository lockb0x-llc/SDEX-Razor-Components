// Ensure StellarSdk is available in the global scope

const StellarSdk = window.StellarSdk;
const NETWORK_PASSPHRASE = "Public Global Stellar Network ; September 2015";

// Define and initialize the global objects
const server = new StellarSdk.Horizon.Server('https:horizon.stellar.org');
const usdcAsset = new StellarSdk.Asset(
    'USDC',
    'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
);
const xlmAsset = StellarSdk.Asset.native();

// Attach these to the window object for global access
 window.StellarSdk = StellarSdk;
 window.server = server;
 window.usdcAsset = usdcAsset;
 window.xlmAsset = xlmAsset;