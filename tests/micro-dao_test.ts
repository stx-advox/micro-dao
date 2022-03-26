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
 * As a member I can view my current balance
 * As a member of DAO I should be able to create a funding proposal
 * As a member of DAO I should be able to execute a funding proposal that had no dissent after 5 days (5 * 144 bitcoin block not stacks!!)
 *
 */

Clarinet.test({
  name: `Ensure that the micro-dao can tell how much balance it has`,
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

Clarinet.test({
  name: "Ensure that each member has an equal amount of stx from the treasury",
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

    const INITIAL_BALANCE = 100;

    block = chain.mineBlock([
      /*
       * Add transactions with:
       * Tx.contractCall(...)
       */
      Tx.transferSTX(INITIAL_BALANCE, contractAddress, deployerWallet.address),
    ]);
    assertEquals(block.receipts.length, 1);
    assertEquals(block.height, 3);

    assertEquals(
      getContractBalance().result,
      types.ok(types.uint(INITIAL_BALANCE))
    );

    const initialMembers = [
      accounts.get("deployer"),
      accounts.get("wallet_1"),
      accounts.get("wallet_2"),
    ] as Account[];

    const share = Math.floor(INITIAL_BALANCE / initialMembers.length);

    initialMembers.forEach((acct) => {
      let accountId = chain.callReadOnlyFn(
        contractAddress,
        "get-member-id",
        [types.principal(acct.address)],
        deployerWallet.address
      ).result;

      [accountId] = accountId.match(/u\d+/) || [];
      let accountShare = chain.callReadOnlyFn(
        contractAddress,
        "get-member-balance",
        [accountId],
        acct.address
      ).result;
      assertEquals(types.ok(types.uint(share)), accountShare);
    });
  },
});

Clarinet.test({
  name: `Ensure that any member can create a funding proposal
    While taking into consideration that:
      - the creator is a member of the DAO
      - the proposal's total amount doesn't exceed the treasury's balance
      - the creator called the contract directly`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer")!;
    let contractAddress = deployerWallet.address + ".micro-dao";
    const nonMember = accounts.get("wallet_5") as Account;
    const INITIAL_BALANCE = 100;
    let block = chain.mineBlock([
      /*
       * Add transactions with:
       * Tx.contractCall(...)
       */
      // Tx.contractCall(contractAddress, )
      Tx.transferSTX(INITIAL_BALANCE, contractAddress, deployerWallet.address),
    ]);

    assertEquals(block.receipts.length, 1);
    assertEquals(block.height, 2);
    block = chain.mineBlock([
      /*
       * Add transactions with:
       * Tx.contractCall(...)
       */
      Tx.contractCall(
        contractAddress,
        "create-funding-proposal",
        [
          types.list([
            types.tuple({
              address: types.principal(deployerWallet.address),
              amount: types.uint(10),
            }),
          ]),
        ],
        deployerWallet.address
      ),
      Tx.contractCall(
        contractAddress,
        "create-funding-proposal",
        [
          types.list([
            types.tuple({
              address: types.principal(deployerWallet.address),
              amount: types.uint(10),
            }),
          ]),
        ],
        nonMember.address
      ),
      Tx.contractCall(
        contractAddress,
        "create-funding-proposal",
        [
          types.list([
            types.tuple({
              address: types.principal(deployerWallet.address),
              amount: types.uint(101),
            }),
          ]),
        ],
        deployerWallet.address
      ),
    ]);
    const shouldSucceed = block.receipts[0].result;
    assertEquals(
      shouldSucceed,
      // types.ok(
      //   types.tuple({
      //     "created-at": types.uint(2),
      //     id: types.uint(0),
      //     proposer: deployerWallet.address,
      //     targets: types.list([
      //       types.tuple({
      //         address: types.principal(deployerWallet.address),
      //         amount: types.uint(10),
      //       }),
      //     ]),
      //   })
      // )
      `(ok {created-at: u2, id: u0, proposer: ${deployerWallet.address}, status: 0, targets: [{address: ${deployerWallet.address}, amount: u10}]})`
    );

    const notMember = block.receipts[1].result;
    assertEquals(notMember, types.err(types.int(3002)));
    const exceedsBalance = block.receipts[2].result;
    assertEquals(exceedsBalance, types.err(types.int(2001)));
    assertEquals(block.receipts.length, 3);
    assertEquals(block.height, 3);
  },
});

Clarinet.test({
  name: `Ensure that a member can dissent on a funding proposal
    While taking into consideration that:
      - the creator called the contract directly
      - the executor is a member of the DAO
      - the proposal exists
      - the proposal has no dissent already (noop)
      - the proposal was not executed before (not necessary but will keep JIC)
      - 5 days have not passed`,
  fn(chain, accounts) {
    const deployerWallet = accounts.get("deployer")!;
    let contractAddress = deployerWallet.address + ".micro-dao";
    const nonMember = accounts.get("wallet_5")!;
    const INITIAL_BALANCE = 100;
    let block = chain.mineBlock([
      /*
       * Add transactions with:
       * Tx.contractCall(...)
       */
      // Tx.contractCall(contractAddress, )
      Tx.transferSTX(INITIAL_BALANCE, contractAddress, deployerWallet.address),
      Tx.contractCall(
        contractAddress,
        "create-funding-proposal",
        [
          types.list([
            types.tuple({
              address: types.principal(deployerWallet.address),
              amount: types.uint(10),
            }),
          ]),
        ],
        deployerWallet.address
      ),
    ]);

    assertEquals(block.receipts.length, 2);
    assertEquals(block.height, 2);

    block = chain.mineBlock([
      Tx.contractCall(
        contractAddress,
        "dissent",
        [types.uint(0)],
        deployerWallet.address
      ),
      Tx.contractCall(
        contractAddress,
        "dissent",
        [types.uint(0)],
        nonMember.address
      ),
      Tx.contractCall(
        contractAddress,
        "dissent",
        [types.uint(0)],
        deployerWallet.address
      ),
    ]);

    const successfulDissent = block.receipts[0].result;
    const nonMemberDissent = block.receipts[1].result;
    const noopDissent = block.receipts[2].result;
    assertEquals(successfulDissent, types.ok("{id: u0}"));

    assertEquals(noopDissent, types.err(types.int(4003)));

    assertEquals(nonMemberDissent, types.err(types.int(3002)));
    assertEquals(block.receipts.length, 3);
    assertEquals(block.height, 3);

    block = chain.mineBlock([
      Tx.contractCall(
        contractAddress,
        "create-funding-proposal",
        [
          types.list([
            types.tuple({
              address: types.principal(deployerWallet.address),
              amount: types.uint(10),
            }),
          ]),
        ],
        deployerWallet.address
      ),
    ]);

    // simulate 5 days passing
    chain.mineEmptyBlockUntil(144 * 5 + 10);

    block = chain.mineBlock([
      Tx.contractCall(
        contractAddress,
        "dissent",
        [types.uint(0)],
        deployerWallet.address
      ),
      Tx.contractCall(
        contractAddress,
        "dissent",
        [types.uint(230)],
        deployerWallet.address
      ),
    ]);

    const tooLateDissent = block.receipts[0].result;
    const proposalNotFound = block.receipts[1].result;

    assertEquals(tooLateDissent, types.err(types.int(4002)));
    assertEquals(proposalNotFound, types.err(types.int(4001)));
    const proposalStatus = chain.callReadOnlyFn(
      contractAddress,
      "get-proposal-status",
      [types.uint(0)],
      deployerWallet.address
    ).result;
    console.log(proposalStatus);
    assertEquals(proposalStatus, types.ok(types.int(2)));
  },
});

Clarinet.test({
  name: `Ensure that a member can execute a funding proposal
    While taking into consideration that:
      - the creator called the contract directly
      - 5 days pass
      - the treasury has enough funds
      - the executor is a member of the DAO
      - the proposal had no dissent
      - the proposal was not executed before
    `,
  fn() {},
});
