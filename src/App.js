import logo from "./logo.svg";
import "./App.css";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { CodePromise } from "@polkadot/api-contract";

function App() {
  // Required imports
  let contract;

  const dataJson = require("./contract.json");
  //console.log(dataJson);

  //console.log(dataJson.contract.metadata);

  const { ApiPromise, WsProvider } = require("@polkadot/api");
  const {
    web3Accounts,
    web3Enable,
    web3FromAddress,
  } = require("@polkadot/extension-dapp");

  // the address we use to use for signing, as injected
  const SENDER = "5DCqNV2n4hifzJDNKbsYn8UyMDWsP5aHvnU2mS4zuc6sUYkm";

  let api;

  async function connectNode() {
    // Initialise the provider to connect to the local node
    const provider = new WsProvider("ws://127.0.0.1:9944");

    // Wait for the promise to resolve async WASM
    await cryptoWaitReady();

    // Create the API and wait until ready
    api = await ApiPromise.create({ provider });

    // Retrieve the chain & node information information via rpc calls
    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
    ]);

    console.log(
      `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
    );
  }

  async function connectExtension() {
    // Enable the extension
    const extensions = await web3Enable("my cool dapp");
    console.log("extensions", extensions);

    // Get the list of all injected accounts
    const allAccounts = await web3Accounts();

    // Print the available accounts and balances (if extension has accounts)
    if (allAccounts.length) {
      console.log("allAccounts", allAccounts);
    }
  }

  async function transferToBob() {
    // BOB ADDRESS
    const BOB = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";

    // finds an injector for an address
    const injector = await web3FromAddress(SENDER);

    // create the extrinsic
    const transfer = api.tx.balances.transfer(BOB, 1000000000);

    // sign and send the transaction using our address
    const hash = await transfer.signAndSend(SENDER, {
      signer: injector.signer,
    });

    console.log(`Submitted with hash ${hash}`);

    // wait for the transaction to be included
    const { events = [], status } = await api.tx.balances.transfer(
      BOB,
      1000000000
    );

    console.log("events", events);
    console.log("status", status);
  }

  async function deployContract() {
    const code = new CodePromise(
      api,
      dataJson.contract.metadata,
      dataJson.contract.wasm
    );

    // finds an injector for an address
    const injector = await web3FromAddress(SENDER);
    const gasLimit = 100000n * 1000000n;
    const storageDepositLimit = null;
    const salt = new Uint8Array();
    const initialSupply = api.registry.createType("Balance", 1000);

    const tx = code.tx.new({ gasLimit, storageDepositLimit }, initialSupply);

    let address;

    const unsub = await tx.signAndSend(
      SENDER,
      {
        signer: injector.signer,
      },
      ({ contract, status }) => {
        if (status.isInBlock || status.isFinalized) {
          address = contract.address.toString();
          console.log("contract address", address);
          unsub();
        }
      }
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <h1>Polkadot API</h1>
      <button onClick={connectNode}>ConnectNode</button>
      <button onClick={connectExtension}>Connect</button>
      <button onClick={transferToBob}>TransferToBob</button>
      <button onClick={deployContract}>DeployContract</button>
    </div>
  );
}

export default App;
