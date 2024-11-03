# Slot Machine Smart Contract

This repository contains a smart contract for a slot machine game on the NEAR blockchain. The contract allows users to deposit whitelisted meme coins directly into the contract, with admins authorized to withdraw funds to any specified account.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)

## Overview

The Slot Machine smart contract facilitates the following functionalities:

- Users can deposit meme coins that have been approved (whitelisted) by the contract’s admin(s) directly into the contract.
- Admins have the ability to withdraw funds from the contract to any specified account.

## Features

- **Deposit Functionality:** Users can deposit whitelisted meme coins, allowing for participation in the slot machine mechanics. Direct deposits go into the contract without the need for a separate treasury wallet deposit step.
- **Admin Management:** The contract creator has the authority to set admins who can manage whitelisted meme coins and update permissions as necessary.
- **Withdrawal Functionality:** Admins can withdraw specified amounts from the contract to any account they choose, providing flexibility in fund management.
- **Error Handling:** The contract includes validation checks to ensure only authorized operations are executed, enhancing security and reliability.

## Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js installed on your machine.
- **NEAR CLI**: Install the NEAR CLI for managing deployments and interactions with the NEAR blockchain.

```bash
npm install -g near-cli
```

### Build contract

```bash
npm run build
```

### Deploy contract
Before deploying contract, you will need to loing account by running below command.

```bash
naer login
```

```bash
cd script
./deploy_contract.sh <accountId>
```

### Config contract
You can config admins or whitelisted memecoins by running below script.

```bash
cd script
./config_contract.sh -a <accountId> -c <contractAddress> -f <function> -i <input_file>
```

#### Set admins of the contract
*NOTE: Only contract creator can set admins of the contract.*
```bash
./config_contract.sh -a <accountId> -c <contractAddress> -f set_admins -i admins.txt
```

#### Set whitelisted memecoins in the contract
*NOTE: Only contract creator or admins can set whitelisted memecoints in the contract.*
```bash
./config_contract.sh -a <accountId> -c <contractAddress> -f set_whitelisted_memecoins -i memecoins.txt
```