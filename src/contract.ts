import { NearBindgen, near, call, NearPromise, AccountId, view, initialize, assert, Balance } from 'near-sdk-js';

const CALL_GAS: bigint = BigInt("30000000000000");
const NO_DEPOSIT: bigint = BigInt(0);
const ONE_NEAR_IN_YOCTONEAR = BigInt(10 ** 24);

@NearBindgen({ requireInit: true })
class SlotMachine {
  // contract owner account
  // owner has privilege of super admin, can edit admin list
  private owner: AccountId = ''; // contract owner account
  // admin accounts
  // every admin has privilege to edit whitelist of meme coins and withdraw funds from the contract
  private admins: Array<AccountId> = [];
  private whitelisted_memecoins: Array<AccountId> = []; // whitelist of meme coins

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

  @call({})   // function to set admins of the contract, only callable by the contract owner
  set_admins(adminAddresses: Array<AccountId>) {
    assert(near.predecessorAccountId() === this.owner, "Only contract owner can edit list of admins.");
    this.admins = adminAddresses;
    return this.admins;
  }

  @call({})   // function to set whitelisted memecoins in the contract, only callable by the contract owner and admin
  set_whitelisted_memecoins(memecoinAddresses: Array<AccountId>) {
    assert(this.admins.includes(near.predecessorAccountId()), "Only contract owner or admin can edit whitelist of meme coins.");

    memecoinAddresses.forEach(memecoinAddress => {
      return NearPromise.new(memecoinAddress).functionCall('storage_deposit', 
        JSON.stringify({ account_id: this.owner }), 
        ONE_NEAR_IN_YOCTONEAR,
        CALL_GAS,
      ).asReturn()
    })
    this.whitelisted_memecoins = memecoinAddresses;
    return this.whitelisted_memecoins;
  }

  @call({ payableFunction: true })
  ft_on_transfer({        // deposit function called by meme coin contract
    sender_id,    // the user account ID making the deposit
    amount,
    msg,
  }: {
    sender_id: AccountId;
    amount: Balance;
    msg: string;
  }): string {
    const { memecoinAddress }: { memecoinAddress: AccountId } = JSON.parse(msg);
    if (!this.whitelisted_memecoins.includes(memecoinAddress)) return amount.toString(); // return unused token amount - send all amount back in case of fail of deposit

    return "0";   // return unused token amount - "0" means all amount used for deposit
  }

  @call({}) // withdraw funds from the contract
  withdraw({ to, amount, memecoinAddress }: { to: AccountId; amount: Balance, memecoinAddress: AccountId }): NearPromise {
    assert(this.admins.includes(near.predecessorAccountId()), "Only the contract owner or admin can initiate withdrawals."); // make sure this function only callable by the contract owner or admin
    assert(this.whitelisted_memecoins.includes(memecoinAddress), `The meme coin ${memecoinAddress} is not whitelisted.`);

    // transfer the amount of specified meme coin to the specified account from the contract. (withdrawal)
    near.log(`Withdrew ${amount.toString()} ${memecoinAddress} from the contract to ${to}`);
    return NearPromise.new(memecoinAddress)
    .functionCall('ft_transfer', JSON.stringify({ receiver_id: to, amount: amount }), NO_DEPOSIT, CALL_GAS)
    .asReturn()
  }
}
