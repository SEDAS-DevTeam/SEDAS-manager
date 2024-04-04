<!--header of the doc file-->
<hr>

## Table of contents
documentation is divided into two parts (**SEDAS main** and **SEDAS documentation**), main is located on `README.md` and contatins basic info about this project, while documentation is located in separate markdown files

1. [SEDAS main](/README.md)
    1. [About SEDAS](/README.md#about)
    2. [Technical](/README.md#technical)
    3. [Functionalities](/README.md#funcs)
    4. [Sources](/doc/sources/readme.md)
2. [SEDAS documentation](/doc/wiki/)
    1. [Installation](/doc/wiki/installation.md)
    2. [Window documentation](/doc/wiki/windows/)
        1. [Main menu](/doc/wiki/windows/settings.md)
        2. [Settings](/doc/wiki/windows/settings.md)
        3. [Controller window](/doc/wiki/windows/controller.md)
            - [Generation]()
            - [Monitors]()
            - [Simulation]()
            - [Worker window]()
            - [Misc (Departure/Arrivals, Weather forecast, etc.)]()
    3. [neural networks]()

<hr>

<!--main content of doc file-->
## Installation:

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