const HDWalletProvider = require("@truffle/hdwallet-provider");
const keys = require("./keys.json");

module.exports = {
  contracts_build_directory: "./public/contracts",
  networks: {
    development: {
     host: "127.0.0.1",     
     port: 8545,            
     network_id: "*",     
    },
    sepolia: {
      provider: () => 
        new HDWalletProvider({
          mnemonic: {
            phrase: keys.MNEMONIC
          },
          providerOrUrl: `https://sepolia.infura.io/v3/${keys.INFURA_PROJECT_ID}`,
          addressIndex: 0
        }),
      gas: 8500000,
      network_id: "11155111",
      timeoutBlocks: 200,
      networkCheckTimeout: 10000
    }
  },

  compilers: {
    solc: {
      version: "0.8.17",      // Fetch exact version from solc-bin (default: truffle's version)
    }
  },
};

// BASE FEE (DETERMINED BY ETH) =
// Max priority fee per gas =>
// gas price = base fee + tip => 
// gas used 
// transaction fee = gas used * gas price 
// burnt fee = base fee * gas used
// rest to miner => tip * gas used

// NEXT_PUBLIC_TARGET_CHAIN_ID=1337
// NEXT_PUBLIC_NETWORK_ID=5777
