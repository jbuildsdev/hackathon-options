"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
} from "./components/ui/card";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import "./styles/App.css";
import { signTx } from "./components/hedera/signTx.js";
import { writeOption } from "../api/actions.js";

export default function CreatePage() {
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [premium, setPremium] = useState("");
  const [strike, setStrike] = useState("");
  const [expiry, setExpiry] = useState("");
  const [optionType, setOptionType] = useState("call");

  async function createOption() {
    if (!token || !amount || !strike || !expiry) {
      alert("Please fill in all fields.");
      return;
    }

    const isCall = optionType === "call";
    const writerNftSerial = await writeOption(
      accountId,
      token,
      amount,
      strike,
      isCall
    );

    const hashconnect = walletData[0];
    const saveData = walletData[1];
    const provider = hashconnect.getProvider(
      "testnet",
      saveData.topic,
      accountId
    );
    const signer = hashconnect.getSigner(provider);

    const transferReceipt = await signTx(
      writerNftSerial.data.signedTx,
      signer,
      writerNftSerial.data.metadata,
      provider
    );
    console.log("Transfer receipt:", transferReceipt);

    // Clear input fields
    setToken("");
    setAmount("");
    setPremium("");
    setStrike("");
    setExpiry("");

    alert("Option created successfully!");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <motion.h1
        className="text-4xl font-bold mb-8 text-center text-white"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Create New Option
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md mx-auto bg-gray-800 border-purple-500">
          <CardContent className="p-6">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token-id" className="text-white">
                  Token ID
                </Label>
                <Input
                  id="token-id"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter token ID"
                  className="bg-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="premium" className="text-white">
                  Premium
                </Label>
                <Input
                  id="premium"
                  type="number"
                  value={premium}
                  onChange={(e) => setPremium(e.target.value)}
                  placeholder="Enter premium"
                  className="bg-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strike-price" className="text-white">
                  Strike Price
                </Label>
                <Input
                  id="strike-price"
                  type="number"
                  value={strike}
                  onChange={(e) => setStrike(e.target.value)}
                  placeholder="Enter strike price"
                  className="bg-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-date" className="text-white">
                  Expiry Date
                </Label>
                <Input
                  id="expiry-date"
                  type="datetime-local"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="bg-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="option-type" className="text-white">
                  Option Type
                </Label>
                <Select onValueChange={(value) => setOptionType(value)} value={optionType}>
                  <SelectTrigger className="bg-gray-700 text-white">
                    <SelectValue placeholder="Select option type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="put">Put</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={createOption}
                className="w-full bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                Create Option
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}