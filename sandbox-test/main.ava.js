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
  const main_contract = await root.createSubAccount('main_contract', { initialBalance: NEAR.parse("100 N").toString() });
  const memecoin_contract = await root.createSubAccount('memecoin_contract', { initialBalance: NEAR.parse("100 N").toString() });
  const user = await root.createSubAccount('user', { initialBalance: NEAR.parse("100 N").toString() });

  // Get wasm file path from package.json test script in folder above
  await main_contract.deploy(process.argv[2]);
  await memecoin_contract.deploy('./sandbox-test/gear.enleap.wasm')

  // Initialize main contract, set the owner of the contract
  await main_contract.call(main_contract, "init", {
    owner: main_contract.accountId,
  });

  // Initialize memecoin contract and mint the token
  await memecoin_contract.call(memecoin_contract, "new", {
    owner_id: memecoin_contract.accountId, 
    total_supply: "10000000000000000000000", 
    metadata: {
      name: "Golden Dragon", 
      description: "Golden Dragon", 
      spec: "ft-1.0.0", 
      symbol: "GDDG", 
      decimals: 18,
    }
  })

  // Save state for test runs, it is unique for each test
  t.context.accounts = { main_contract, memecoin_contract, user };
});

test.afterEach.always(async (t) => {
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

// Test Contract Functionality
test('Test full contract', async (t) => {
  const { main_contract, memecoin_contract, user} = t.context.accounts

  // Confirm main contract owner and total supply of the memecoin
  const main_contract_owner = await main_contract.view('get_contract_owner', {})
  const total_supply_memecoin = await memecoin_contract.view('ft_total_supply', {})
  t.is(main_contract_owner, 'main_contract.test.near', 'Wrong contract owner')
  t.is(total_supply_memecoin, '10000000000000000000000', 'Wrong total supply of the memecoin')

  // Token allowence for user and airdrop
  await user.call(memecoin_contract, 'storage_deposit', { account_id: user.accountId }, { attachedDeposit: NEAR.parse("1 N") })
  await memecoin_contract.call(memecoin_contract, 'ft_transfer', 
    { 
      receiver_id: user.accountId, 
      amount: '5000000000000000000000' 
    }, 
    { 
      attachedDeposit: '1' 
    }
  )
  const userMemecoinBalance = await memecoin_contract.view('ft_balance_of', { account_id: user.accountId })
  t.is(userMemecoinBalance, '5000000000000000000000', 'Wrong user memecoin balance')

  // Token allowence for main contract and set whitelist of memecoins
  await main_contract.call(memecoin_contract, 'storage_deposit', 
    { 
      account_id: main_contract.accountId 
    }, 
    { 
      attachedDeposit: NEAR.parse("1 N") 
    }
  )
  await main_contract.call(main_contract, 'set_whitelisted_memecoins', [memecoin_contract.accountId])
  const whitelistedMemecoins = await main_contract.view('get_whitelist_of_memecoins', {})
  t.deepEqual(whitelistedMemecoins, [ memecoin_contract.accountId ], 'Wrong whitelisted memecoins')

  // User deposit some token to the main contract
  await user.call(memecoin_contract, 'ft_transfer_call', 
    { 
      receiver_id: main_contract.accountId, 
      amount: '1000000000000000000000', 
      msg: JSON.stringify({ memecoinAddress: memecoin_contract.accountId }), 
    }, 
    { 
      attachedDeposit: '1', 
      gas: '100000000000000' 
    }
  )
  const userRemainingMemecoinBalance = await memecoin_contract.view('ft_balance_of', { account_id: user.accountId })
  t.is(userRemainingMemecoinBalance, '4000000000000000000000', 'Wrong user remaining memecoin balance')
});
