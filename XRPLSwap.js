import xrpl from "xrpl";

const client = new xrpl.Client(); // Use mainnet URL for live transactions

//const wallet = xrpl.Wallet.fromSecret("");
//or
const wallet = xrpl.Wallet.fromMnemonic("");

export async function swapXRPForToken(tokenAddress, amount) {
  try {
    await client.connect();

    let currency = "";
    const accountLines = await client.request({
      command: "account_lines",
      account: tokenAddress,
      limit: 1,
    });
    const currencies = accountLines.result.lines.map((line) => ({
      currency: line.currency,
      balance: line.balance,
      limit: line.limit_peer,
      account: line.account,
    }));
    if (currencies.length > 0) {
      currency = currencies[0].currency;
    } else {
      return;
    }

    //Trust transaction
    const trustSetTx = {
      TransactionType: "TrustSet",
      Account: wallet.address,
      LimitAmount: {
        currency: currency,
        issuer: tokenAddress, // Replace with the actual issuer address of Token
        value: "99999573.43257802", // Limit for holding XXXXX tokens
      },
    };

    console.log("Setting up trust line...");
    const preparedTrustSetTx = await client.autofill(trustSetTx);
    const signedTrustSetTx = wallet.sign(preparedTrustSetTx);
    const trustSetResult = await client.submitAndWait(signedTrustSetTx.tx_blob);

    console.log("Trust line transaction result:", trustSetResult);

    const transaction = {
      TransactionType: "Payment",
      Account: wallet.address,
      Amount: {
        currency: currency,
        issuer: tokenAddress,
        value: "588989752.3674631",
      },
      DeliverMin: {
        currency: currency,
        issuer: tokenAddress,
        value: "1.63720433", // Min AMount out
      },
      Destination: wallet.address,
      // Fee: "15"
      Flags: 131072,
      SendMax: xrpl.xrpToDrops(amount + ""), // XRP amount
    };
    const preparedTrustSetTx2 = await client.autofill(transaction);
    const signedTrustSetTx2 = wallet.sign(preparedTrustSetTx2);
    const trustSetResult2 = await client.submitAndWait(
      signedTrustSetTx2.tx_blob
    );
    console.log(
      "Payment transaction result:",
      JSON.stringify(trustSetResult2, null, 2)
    );

    console.log("Waiting for counterparty to send Tokens...");
    // In practice, you would check the balance after some time to confirm receipt of Meme87
    const accountInfo = await client.request({
      command: "account_lines",
      account: wallet.address,
    });

    console.log("Account lines:", JSON.stringify(accountInfo, null, 2));

    await client.disconnect();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

swapXRPForToken("rBEARGUAsyu7tUw53rufQzFdWmJHpJEqFW", 2);
