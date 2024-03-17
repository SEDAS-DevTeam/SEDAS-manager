# SEDAS

**S**calable and **E**asily **D**eployable **ATC** **S**imulator

<hr>

**About**<br>
This project is new concept of ATC simulator both for beginners and advanced users. It utilises of neural networks to imitate real pilots on the other communication end and also function as a personal trainer. Goal of this desktop application is to make ATC learning easier for hobbyists and begineer ATC students. Project is still in early developement.

<hr>

**Technical**<br>
Application is made in `electron`, with the help of `sqlite3`, app also uses `python` to implement the **AI** part. It is also packaged using `electron-packager`. Frontend is fully made in `VanillaJS`.

<hr>

**ATC**<br>
See `/doc/sources/readme.md` for more information about **ATC sources i used**.

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

# Wiki:
SEDAS has its own wiki, all written in `markdown`

[1. About SEDAS]()<br>
[2. functionalities]()<br>
[3. SEDAS window documentation]()<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [3.1. Main menu]()<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [3.1. Settings]()<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [3.2. Controller window]()<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [3.2.1. Generation]()<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [3.2.2. Monitors]()<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [3.2.3. Simulation]()<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [3.2.4. Worker window]()<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [3.2.5. Misc (Departure/Arrivals, Weather forecast, etc.)]()<br>