#!/bin/sh

# variables
PURPLE='\033[0;35m'
BLUE='\033[0;34m'
NC='\033[0m'

# functions
check_files() {
    for FILE in "$1"/*
    do
        EXTENSION="${FILE##*.}"
        if [ -f "$FILE" ]; then
            if [ "$EXTENSION" = "map" ] || [ "$EXTENSION" = "js" ]; then
                # Add your file processing commands here
                rm $FILE
            fi
        fi
    done
}

cd ..

# running in /src dir
check_files "./src"

# running in /src/workers dir
check_files "./src/workers"

echo "[${PURPLE}Build info${NC}] ${BLUE}Cleaned working /src directory${NC}"