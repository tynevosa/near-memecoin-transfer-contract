import { NearBindgen, near, call, NearPromise, AccountId, view, initialize, assert, Balance } from 'near-sdk-js';

const CALL_GAS: bigint = BigInt("30000000000000");
const NO_DEPOSIT: bigint = BigInt(0);

@NearBindgen({ requireInit: true })
class SlotMachine {
  // contract owner account
  // owner has privilege of super admin, can edit admin list
  private owner: AccountId = ''; // contract owner account
  // admin accounts
  // every admin has privilege to edit whitelist of meme coins and withdraw funds from the contract
  private admins: Array<AccountId> = [];
  private whitelisted_memecoins: Array<AccountId> = []; // whitelist of meme coins
  private user_deposits: Map<AccountId, Map<AccountId, Balance>> = new Map();

  @initialize({ privateFunction: true }) // initialize the contract owner
  init({ owner }: { owner: AccountId }) {
    this.owner = owner;
    this.admins.push(owner);
  }

  @view({})
  get_contract_owner(): AccountId {
    return this.owner;
  }

  @view({})
  get_contract_admins(): Array<AccountId> {
    return this.admins;
  }

  @view({})
  get_whitelist_of_memecoins(): Array<AccountId> {
    return this.whitelisted_memecoins;
  }

  @view({})
  get_user_balance(userAddress: AccountId): Map<AccountId, Balance> {   // get user balance recorded on the contract, currently its all deposited amount by the user so far
    return this.user_deposits.get(userAddress);
  }

  @view({})
  get_user_memecoin_balance(userAddress: AccountId, memecoinAddress: AccountId): Balance {
    // Retrieve the balance of a specific meme coin deposited by the user.
    // This function checks the user's deposit records on the contract and 
    // returns the amount of the specified meme coin (identified by memecoinAddress) 
    // that the user has deposited so far.
    return this.user_deposits.get(userAddress).get(memecoinAddress);
  }

  @call({})   // function to set admins of the contract, only callable by the contract owner
  set_admins(adminAddresses: Array<AccountId>) {
    assert(near.predecessorAccountId () === this.owner, "Only contract owner can edit list of admins.");
    this.admins = adminAddresses;
    return this.admins;
  }

  @call({})   // function to set whitelisted memecoins in the contract, only callable by the contract owner and admin
  set_whitelisted_memecoins(memecoinAddresses: Array<AccountId>) {
    assert(this.admins.includes(near.predecessorAccountId ()), "Only contract owner or admin can edit whitelist of meme coins.");
    this.whitelisted_memecoins = memecoinAddresses;
    return this.whitelisted_memecoins;
  }

  @call({})
  ft_on_transfer({        // deposit function called by meme coin contract
    sender_id: userAddress,    // the user account ID making the deposit
    amount: tokenAmount,
    msg,
  }: {
    sender_id: AccountId;
    amount: Balance;
    msg: string;
  }): string {
    const { memecoinAddress }: { memecoinAddress: AccountId } = JSON.parse(msg);
    if (!this.whitelisted_memecoins.includes(memecoinAddress)) return tokenAmount.toString(); // return unused token amount - send all amount back in case of fail of deposit

    const userDeposit = this.user_deposits.get(userAddress);

    if (userDeposit == null) {
      this.user_deposits.set(userAddress, new Map<AccountId, Balance>().set(memecoinAddress, tokenAmount))
    } else {
      const memecoinBalance = userDeposit.get(memecoinAddress);

      if (memecoinBalance == null) {
        userDeposit.set(memecoinAddress, tokenAmount);
      } else {
        userDeposit.set(memecoinAddress, tokenAmount + memecoinBalance);
      }
      this.user_deposits.set(userAddress, userDeposit);
    }
    return "0";   // return unused token amount - "0" means all amount used for deposit
  }

  @call({}) // withdraw funds from the contract
  withdraw({ to, amount, memecoinAddress }: { to: AccountId; amount: Balance, memecoinAddress: AccountId }): NearPromise {
    assert(this.admins.includes(near.predecessorAccountId ()), "Only the contract owner or admin can initiate withdrawals."); // make sure this function only callable by the contract owner or admin
    assert(this.whitelisted_memecoins.includes(memecoinAddress), `The meme coin ${memecoinAddress} is not whitelisted.`);

    // transfer the amount of specified meme coin to the specified account from the contract. (withdrawal)
    near.log(`Withdrew ${amount.toString()} ${memecoinAddress} from the contract to ${to}`);
    return NearPromise.new(memecoinAddress)
    .functionCall('ft_transfer', JSON.stringify({ receiver_id: to, amount: amount }), NO_DEPOSIT, CALL_GAS)
    .asReturn()
  }
}
