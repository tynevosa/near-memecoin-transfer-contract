# Slot Machine Smart Contract

This repository contains a smart contract for a slot machine game on the NEAR blockchain. The contract allows users to deposit NEAR tokens into a designated treasury wallet and manage withdrawals from that wallet.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Usage](#usage)
- [License](#license)

## Overview

The Slot Machine smart contract facilitates the following functionalities:

- Users can deposit NEAR tokens directly to a treasury wallet.
- The contract allows the treasury wallet to withdraw funds to specified accounts.

## Features

- **Deposit Functionality:** Users can deposit NEAR tokens, which are logged for tracking purposes.
- **Withdrawal Functionality:** The treasury wallet can withdraw specified amounts to designated accounts.
- **Error Handling:** The contract checks for conditions to ensure only valid operations are executed.

## Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js installed on your machine.
- **NEAR CLI**: Install the NEAR CLI for managing deployments and interactions with the NEAR blockchain.

```bash
npm install -g near-cli