import { NearBindgen, near, call, NearPromise, AccountId, view, initialize, assert } from 'near-sdk-js';

@NearBindgen({ requireInit: true })
class SlotMachine {
  treasuryWallet: AccountId = ''; // Treasury wallet address
  poolBalance: bigint = BigInt(0);

  @initialize({ privateFunction: true }) // Initialize the contract with the treasury wallet
  init({ treasuryWallet }: { treasuryWallet: AccountId }) {
    this.treasuryWallet = treasuryWallet;
  }

  @view({}) // This method is read-only and can be called for free
  get_treasury_wallet(): AccountId {
    return this.treasuryWallet;
  }

  @view({})
  get_pool_balance(): bigint {
    return this.poolBalance;
  }

  @call({ payableFunction: true }) // Deposit NEAR tokens into the pool
  deposit() {
    const amount = near.attachedDeposit(); // Amount sent with the transaction
    assert(amount > BigInt(0), "Deposit amount must be greater than zero.");

    // Transfer the amount to the pool (Deposit)
    this.poolBalance += amount;
    near.log(`Deposited ${amount.toString()} NEAR to the treasury by ${near.predecessorAccountId()}`);
  }

  @call({}) // Withdraw funds from the pool
  withdraw({ to, amount }: { to: AccountId; amount: bigint }): NearPromise {
    assert(near.signerAccountId() === this.treasuryWallet, "Only the treasury wallet can initiate withdrawals."); // Make sure this function only callable by treasury wallet
    assert(amount <= this.poolBalance, "Insufficient pool balance.");

    // Reduce the pool balance
    this.poolBalance -= amount;

    // Transfer the amount to the specified wallet (Withdrawal)
    near.log(`Withdrew ${amount.toString()} NEAR from the pool to ${to}`);
    return NearPromise.new(to).transfer(amount);
  }
}
