#!/bin/sh

PURPLE='\033[0;35m'
BLUE='\033[0;34m'
NC='\033[0m'

# clear build files
sh run_clear.sh

# compile cpp
cd ../src 
node-gyp configure build
cd ..

# compile all
npx tsc --project ./tsconfig.json

echo "[${PURPLE}Build info${NC}] ${BLUE}Compiled target files${NC}"