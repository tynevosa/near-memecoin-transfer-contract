#!/bin/bash

# Usage: ./slot_machine.sh <accountId>

# Check if accountId is provided
if [ -z "$1" ]; then
  echo "Error: No accountId provided."
  echo "Usage: ./deploy_contract.sh <accountId>"
  exit 1
fi

# Set variables
ACCOUNT_ID=$1
WASM_FILE="../build/slot_machine.wasm"

# Run commands
near deploy $ACCOUNT_ID --wasmFile $WASM_FILE
near call $ACCOUNT_ID init '{"owner": "'$ACCOUNT_ID'"}' --accountId $ACCOUNT_ID
