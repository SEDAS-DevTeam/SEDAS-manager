#!/bin/sh

PURPLE='\033[0;35m'
BLUE='\033[0;34m'
NC='\033[0m'

#compile and clear everything
sh run_compile.sh
cd ..

echo "[${PURPLE}Build info${NC}] ${BLUE}Running app in dev mode${NC}"

#run developement
electron ./src/main.js