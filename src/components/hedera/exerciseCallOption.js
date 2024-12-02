import {
  AccountId,
  Client,
  PrivateKey,
  Hbar,
  TransferTransaction,
  TokenBurnTransaction,
} from "@hashgraph/sdk";
import { hasNft } from "./hasNft";

export const exerciseCallOptionFcn = async (
  walletData,
  tokenId,
  serialNumber,
  buyerId,
  strikePrice,
  payout,
  writerNftSerial
) => {
  const escrowAccountId = AccountId.fromString(process.env.REACT_APP_ESCROW_ID);
  const escrowAccountKey = PrivateKey.fromStringECDSA(
    process.env.REACT_APP_ESCROW_KEY
  );
  const writerNftId = process.env.REACT_APP_WRITER_NFT_ID;
  const writerAccountId = await hasNft(writerNftId, writerNftSerial);

  console.log("=== Exercise Option Process Started ===");
  console.log(`Token ID: ${tokenId}`);
  console.log(`Serial Number: ${serialNumber}`);
  console.log(`Amount of Tokens: ${payout}`);
  console.log(`Escrow Account ID: ${escrowAccountId.toString()}`);
  console.log(`Option Seller ID: ${writerAccountId}`);
  console.log(`Option Buyer ID: ${buyerId}`);
  console.log(`Strike Price (HBAR): ${strikePrice}`);
  console.log("--------------------------------------");

  const client = Client.forTestnet().setOperator(
    escrowAccountId,
    escrowAccountKey
  );
  console.log("Client configured with Escrow Account.");

  const hashconnect = walletData[0];
  const saveData = walletData[1];

  const provider = hashconnect.getProvider("testnet", saveData.topic, buyerId);
  const signer = hashconnect.getSigner(provider);

  try {
    // Check NFT ownership
    const buyerNftId = process.env.REACT_APP_NFT_ID;
    const nftOwner = await hasNft(buyerId, buyerNftId, serialNumber);
    if (nftOwner !== buyerId) {
      throw new Error(
        "The buyer does not own the NFT required to exercise this call option."
      );
    }

    // Step 1: Create the combined transaction
    console.log("Creating combined transfer transaction...");

    const tx = await new TransferTransaction()
      .addHbarTransfer(writerAccountId, new Hbar(strikePrice)) // Pay strike price to seller
      .addHbarTransfer(buyerId, new Hbar(-strikePrice)) // Deduct strike price from buyer
      .addTokenTransfer(tokenId, escrowAccountId, -payout) // Release tokens from escrow
      .addTokenTransfer(tokenId, buyerId, payout) // Send tokens to buyer
      .addNftTransfer(buyerNftId, serialNumber, buyerId, escrowAccountId) // Transfer NFT to escrow
      .freezeWith(client);

    const signedTx = await tx.sign(escrowAccountKey);
    const txResponse = await signedTx.executeWithSigner(signer);

    const receipt = await provider.getTransactionReceipt(
      txResponse.transactionId
    );

    if (receipt.status._code !== 22) {
      throw new Error(
        `Transaction failed with status: ${receipt.status.toString()}`
      );
    }

    console.log(
      `${payout} tokens successfully transferred from Escrow (${escrowAccountId}) to Buyer (${buyerId}).`
    );
    console.log(
      `${strikePrice} HBAR successfully transferred from Buyer (${buyerId}) to Seller (${writerAccountId}).`
    );

    console.log("--------------------------------------");
    console.log("Burning NFT...");
    const nftId = process.env.REACT_APP_NFT_ID;
    const burnTx = await new TokenBurnTransaction()
      .setTokenId(nftId)
      .setSerials([serialNumber])
      .freezeWith(client);

    const burnTxSigned = await burnTx.sign(escrowAccountKey);
    const burnTxResponse = await burnTxSigned.execute(client);
    const burnReceipt = await burnTxResponse.getReceipt(client);

    console.log(
      `NFT burned successfully. Transaction status: ${burnReceipt.status}`
    );
    console.log("=== Option Exercise Completed Successfully ===");

    return receipt;
  } catch (e) {
    console.error("Error during exerciseOptionFcn:", e);
    throw e;
  }
};
