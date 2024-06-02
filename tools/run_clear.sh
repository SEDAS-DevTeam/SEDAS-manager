#!/bin/sh

PURPLE='\033[0;35m'
BLUE='\033[0;34m'
NC='\033[0m'

#main build dir
rm -rf ../src_build
mkdir ../src_build
touch ../src_build/.gitkeep

#cpp build dir
rm -rf ../src/build
mkdir ../src/build
touch ../src/build/.gitkeep

echo "[${PURPLE}Build info${NC}] ${BLUE}Cleared build dirs${NC}"