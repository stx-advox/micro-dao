import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.14.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";

/**
 * Micro dao holds funds for people in a journey
 * Micro dao can receive funds through sending to the contract
 */

Clarinet.test({
  name: "Ensure that the micro-dao can tell how much balance it has",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer")!;
    let contractAddress = deployerWallet.address + ".micro-dao";
    let getContractBalance = () =>
      chain.callReadOnlyFn(
        contractAddress,
        "get-balance",
        [],
        deployerWallet.address
      );

    let block = chain.mineBlock([
      /*
       * Add transactions with:
       * Tx.contractCall(...)
       */
    ]);

    assertEquals(getContractBalance().result, "(ok u0)");
    assertEquals(block.receipts.length, 0);
    assertEquals(block.height, 2);

    block = chain.mineBlock([
      /*
       * Add transactions with:
       * Tx.contractCall(...)
       */
      Tx.transferSTX(100, contractAddress, deployerWallet.address),
    ]);
    assertEquals(block.receipts.length, 1);
    assertEquals(block.height, 3);

    assertEquals(getContractBalance().result, "(ok u100)");
  },
});
