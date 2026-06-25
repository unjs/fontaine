#!/bin/bash
set -e

echo "🚀 Starting Fontaine production-grade toolchain demo..."

# 1. Build the project
pnpm --filter fontaine run build

# 2. Make binary executable
chmod +x packages/fontaine/dist/cli.mjs

# 3. Test Case: Local File (Valid)
echo -e "\n🧪 Test Case 1: Local Font File"
./packages/fontaine/dist/cli.mjs packages/fontaine/playground/fonts/font.ttf

# 4. Test Case: Invalid Remote Asset (Mime-type Guard)
echo -e "\n🧪 Test Case 2: Invalid Remote Asset (Google Index Page)"
./packages/fontaine/dist/cli.mjs https://google.com 2>&1 | grep "Invalid asset type"

# 5. Test Case: Missing File (FetchError)
echo -e "\n🧪 Test Case 3: Missing File"
./packages/fontaine/dist/cli.mjs ./non-existent.ttf 2>&1 | grep "Failed to fetch font asset"

echo -e "\n✅ Pipeline verification complete."
