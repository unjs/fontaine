#!/bin/bash
set -e

export MEMANTO_ENDPOINT="http://localhost:8080"
export MEMANTO_API_KEY="test_key_123"
export MEMANTO_AGENT_ID="architect_session_$(date +%s)"

echo "Using AGENT_ID: $MEMANTO_AGENT_ID"

# Step 1: Ingestion Process
echo "Running Ingestion..."
node packages/cli/dist/index.js ingest \
  --agent-id "$MEMANTO_AGENT_ID" \
  --content "The system architecture uses a distributed event bus for state synchronization."

# Step 2: Recall Process (Separate process execution)
echo "Running Recall..."
RESULT=$(node packages/cli/dist/index.js recall \
  --agent-id "$MEMANTO_AGENT_ID" \
  --query "What is used for state synchronization?")

echo "Recall Result: $RESULT"

if [[ $RESULT == *"distributed event bus"* ]]; then
  echo "Persistence Verified: Success"
else
  echo "Persistence Verified: Failed"
  exit 1
fi
