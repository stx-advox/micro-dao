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
 * Micro dao should receive funds through sending to the contract
 * Micro dao should have members
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

Clarinet.test({
  name: "Ensure that initial members are added",
  async fn(chain, accounts, contracts) {
    const initialMembers = [
      accounts.get("deployer"),
      accounts.get("wallet_1"),
      accounts.get("wallet_2"),
    ] as Account[];
    const nonAccounts = [
      accounts.get("wallet_3"),
      accounts.get("wallet_4"),
    ] as Account[];
    let deployerWallet = accounts.get("deployer")!;
    let contractAddress = deployerWallet.address + ".micro-dao";

    initialMembers.forEach((acct, index) => {
      let accountId = chain.callReadOnlyFn(
        contractAddress,
        "get-member-id",
        [types.principal(acct?.address)],
        deployerWallet.address
      ).result;

      [accountId] = accountId.match(/u\d+/) || [];
      assertEquals(
        chain.callReadOnlyFn(
          contractAddress,
          "get-member-data",
          [accountId],
          deployerWallet.address
        ).result,
        `(ok {address: ${acct?.address}})`
      );
    });
    nonAccounts.forEach((acct, index) => {
      let accountId = chain.callReadOnlyFn(
        contractAddress,
        "get-member-id",
        [types.principal(acct?.address)],
        deployerWallet.address
      ).result;

      assertEquals(accountId, "(err 1002)");
    });
  },
});
