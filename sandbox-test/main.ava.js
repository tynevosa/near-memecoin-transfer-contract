import anyTest from 'ava';
import { Worker, NEAR } from 'near-workspaces';
import { setDefaultResultOrder } from 'dns'; setDefaultResultOrder('ipv4first'); // temp fix for node >v17

/**
 *  @typedef {import('near-workspaces').NearAccount} NearAccount
 *  @type {import('ava').TestFn<{worker: Worker, accounts: Record<string, NearAccount>}>}
 */
const test = anyTest;

test.beforeEach(async t => {
  // Create sandbox
  const worker = t.context.worker = await Worker.init();

  // Deploy contract
  const root = worker.rootAccount;
  const contract = await root.createSubAccount('contract');
  const treasury = await root.createSubAccount('treasury', { initialBalance: NEAR.parse("100 N").toString() });
  const user = await root.createSubAccount('user', { initialBalance: NEAR.parse("10 N").toString() });

  // Get wasm file path from package.json test script in folder above
  await contract.deploy(process.argv[2]);

  // Initialize contract, set treasury wallet
  await contract.call(contract, "init", {
    treasuryWallet: treasury,
  });

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { root, contract, treasury, user };
});

test.afterEach.always(async (t) => {
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

// Test Withdrawal Functionality
test('Test full contract', async (t) => {
  const { root, contract, user, treasury } = t.context.accounts;

  // Deposit funds first
  await user.call(contract, 'deposit', {}, { attachedDeposit: NEAR.parse("3 N").toString() });

  console.log("poolBalance", await contract.view('get_pool_balance', {}));

  console.log("treasuryWallet", await contract.view('get_treasury_wallet', {}));

  // Attempt withdrawal by a user account
  await t.throwsAsync(treasury.call(contract, 'withdraw', { to: user.accountId, amount: NEAR.parse("1 N").toString() }, { gas: "300000000000000" }));

  console.log("poolBalance", await contract.view('get_pool_balance', {}));
});
