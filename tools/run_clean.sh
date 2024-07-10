#!/bin/sh

PURPLE='\033[0;35m'
BLUE='\033[0;34m'
NC='\033[0m'

cd ..
DIR="./src"
for FILE in "$DIR"/*
do
    BASENAME=$(basename "$FILE")
    if [ -f "$FILE" ]; then
        if [[ "$BASENAME" == *.js ]] && [[ "$BASENAME" == *.js.map ]]; then
            # Add your file processing commands here
            echo "Processing file: $FILE"
        fi
    fi
done

echo "[${PURPLE}Build info${NC}] ${BLUE}Cleaned working /src directory${NC}"