import React, { useState } from "react";
import walletConnectFcn from "./components/hedera/walletConnect.js";
import "./styles/App.css";
import { buyOption, writeOption, exerciseOption } from "./api/actions.ts";
import signTx from "./components/hedera/signTx.js";


function App() {
  // State for connected wallet
  const [walletData, setWalletData] = useState();
  const [accountId, setAccountId] = useState();
  const [connectTextSt, setConnectTextSt] = useState("Connect Wallet");
  const [connectLinkSt, setConnectLinkSt] = useState("");

  // Unified state for options
  const [options, setOptions] = useState([]);
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [premium, setPremium] = useState("");
  const [strike, setStrike] = useState("");
  const [expiry, setExpiry] = useState("");
  const [isCall, setIsCall] = useState(true); // Tracks whether adding a call or put
  const [selectedOptionIndex, setSelectedOptionIndex] = useState("");

  async function connectWallet() {
    if (accountId) {
      setConnectTextSt(`🔌 Account ${accountId} already connected ⚡ ✅`);
    } else {
      const wData = await walletConnectFcn();
      wData[0].pairingEvent.once((pairingData) => {
        pairingData.accountIds.forEach((id) => {
          setAccountId(id);
          console.log(`- Paired account id: ${id}`);
          setConnectTextSt(`🔌 Account ${id} connected ⚡ ✅`);
          setConnectLinkSt(`https://hashscan.io/#/testnet/account/${id}`);
        });
      });
      setWalletData(wData);
    }
  }

  async function addOption() {

    const writerNftSerial = await writeOption(accountId, token, amount, strike, isCall);

    // Retrieve the signer
    const hashconnect = walletData[0];
    const saveData = walletData[1];
    const provider = hashconnect.getProvider(
      "testnet",
      saveData.topic,
      accountId
    );
    const signer = hashconnect.getSigner(provider);

    const transferReceipt = await signTx(writerNftSerial.data.signedTx, signer, writerNftSerial.data.metadata, provider);
    console.log("Transfer receipt:", transferReceipt);

    const newOption = {
      token,
      amount,
      premium,
      strike,
      expiry,
      buyerNftSerial: null,
      writerNftSerial,
      isCall,
    };

    const updatedOptions = [...options, newOption];
    setOptions(updatedOptions);

    console.log("Current Options:", updatedOptions);

    // Clear input fields
    setToken("");
    setAmount("");
    setPremium("");
    setStrike("");
    setExpiry("");
  }

  async function buyOptionFnc() {
    if (selectedOptionIndex === "") {
      alert("Please select an option to buy.");
      return;
    }

    const index = parseInt(selectedOptionIndex, 10);
    const selectedOption = options[index];
    console.log("Selected Option:", selectedOption);

    const serialNumber = await buyOption(
      walletData,
      accountId,
      selectedOption.premium,
      selectedOption.writerNftSerial
    );

    const updatedOptions = [...options];
    updatedOptions[index] = {
      ...selectedOption,
      buyerNftSerial: serialNumber,
    };

    setOptions(updatedOptions);

    console.log("Updated Options:", updatedOptions);
  }

  async function exerciseOptionFnc() {
    if (selectedOptionIndex === "") {
      alert("Please select an option to exercise.");
      return;
    }

    const index = parseInt(selectedOptionIndex, 10);
    const selectedOption = options[index];

    const currentTime = new Date().toISOString();
    if (currentTime > selectedOption.expiry) {
      alert("This option has expired.");
      return;
    }

    try {
      await exerciseOption(
        walletData,
        selectedOption.token,
        selectedOption.buyerNftSerial,
        accountId,
        selectedOption.strike,
        selectedOption.amount,
        selectedOption.writerNftSerial,
        isCall
      );


      const updatedOptions = options.filter((_, idx) => idx !== index);
      setOptions(updatedOptions);

      alert("Option exercised successfully!");
      console.log("Updated Options:", updatedOptions);
    } catch (error) {
      console.error("Error exercising option:", error);
      alert("An error occurred while exercising the option.");
    }
  }

  return (
    <div className="App">

      <div className="navbar bg-neutral flex justify-between items-center py-4 px-8">
        <h1 className="header">HASHCALLS</h1>
        <div>
          <button onClick={connectWallet} className="btn btn-secondary">
            {connectTextSt}
          </button>
          {connectLinkSt && (
            <a href={connectLinkSt} target="_blank" rel="noreferrer">
              View on HashScan
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8">

      <div className="flex flex-col justify-center items-center gap-2">
        <h2 className="font-bold">Create an Option</h2>
        <div className="flex gap-4">
          <label className="flex gap-2">
            <input
              className="radio radio-primary"
              type="radio"
              name="optionType"
              value="call"
              checked={isCall}
              onChange={() => setIsCall(true)}
            />
            Call
          </label>
          <label className="flex gap-2">
            <input
              className="radio radio-secondary"
              type="radio"
              name="optionType"
              value="put"
              checked={!isCall}
              onChange={() => setIsCall(false)}
            />
            Put
          </label>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div>
            <label htmlFor="token">Token: </label>
            <input className="input input-bordered h-8"
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="amount">Amount: </label>
            <input className="input input-bordered h-8"
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="premium">Premium: </label>
            <input className="input input-bordered h-8"
              id="premium"
              type="number"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="strike">Strike Price: </label>
            <input className="input input-bordered h-8"
              id="strike"
              type="number"
              value={strike}
              onChange={(e) => setStrike(e.target.value)}
            />
          </div>
          </div>
        <div>
          <label htmlFor="expiry">Expiry Date: </label>
          <input className="input input-bordered h-8"
            id="expiry"
            type="datetime-local"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" onClick={addOption}>Add Option</button>
      </div>

      <div className="flex flex-col justify-center items-center gap-2">
        <h2 className="font-bold">Buy an Option</h2>
        <div>
          {/* <label htmlFor="options">Select Option: </label> */}
          <select
          className="select select-bordered"
            id="options"
            value={selectedOptionIndex}
            onChange={(e) => setSelectedOptionIndex(e.target.value)}
          >
            <option value="">-- Select an Option --</option>
            {options.map((option, index) => (
              <option key={index} value={index}>
                {option.isCall ? "Call" : "Put"} Option {index + 1} - Token:{" "}
                {option.token}, Amount: {option.amount}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-secondary" onClick={buyOptionFnc}>Buy Option</button>
      </div>

      <div className="flex flex-col justify-center items-center  gap-2">
        <h2 className="font-bold">Exercise an Option</h2>
        <div>
          {/* <label htmlFor="owned-options">Select Owned Option: </label> */}
          <select
            className="select select-bordered"
            id="owned-options"
            value={selectedOptionIndex}
            onChange={(e) => setSelectedOptionIndex(e.target.value)}
          >
            <option value="">-- Select an Option --</option>
            {options.map((option, index) => (
              <option key={index} value={index}>
                {option.isCall ? "Call" : "Put"} Option {index + 1} - Token:{" "}
                {option.token}, Amount: {option.amount}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-secondary" onClick={exerciseOptionFnc}>Exercise Option</button>
      </div>

      </div>

    </div>
  );
}

export default App;
