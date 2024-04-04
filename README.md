# SEDAS
**S**calable and **E**asily **D**eployable **ATC** **S**imulator

<hr>

## Table of contents

1. [SEDAS main]()
    1. [About SEDAS](#about)
    2. [Technical](#technical)
    3. [Functionalities]()
    4. [Sources](/doc/sources/readme.md)
2. [SEDAS documentation]()
    1. [Installation]()
    2. [Window documentation]()
        1. [Main menu]()
        2. [Settings]()
        3. [Controller window]()
            - [Generation]()
            - [Monitors]()
            - [Simulation]()
            - [Worker window]()
            - [Misc (Departure/Arrivals, Weather forecast, etc.)]()
    3. [neural networks]()

<hr>

<h2 id="about">About</h2>
This project is new concept of ATC simulator both for beginners and advanced users. It utilises of neural networks to imitate real pilots on the other communication end and also function as a personal trainer. Goal of this desktop application is to make ATC learning easier for hobbyists and begineer ATC students. Project is still in early developement.

<h2 id="technical">Technical</h2>
Application is made in `electron`, with the help of `sqlite3`, app also uses `python` to implement the **AI** part. It is also packaged using `electron-packager`. Frontend is fully made in `VanillaJS`.

## Installation: TODO move to Installation section

### Windows
TODO

### Linux
TODO

### MacOS
TODO

### Build from source
If you want to contribute to the project, you can simply follow these commands.

1. `git clone https://github.com/HelloWorld7894/SEDAC.git`
2. `npm install --save-dev` to install all the packages
3. `npm install -g electron-builder` to install electron builder in global for package building
4. `npm run dev` to compile `main.ts`
5. (optional) `npm run build` to build and package electron project for win and linux (MacOS not supported yet)

NOTE: `npm run clear` to clear all build files