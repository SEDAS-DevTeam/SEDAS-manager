# SEDAS
**S**calable and **E**asily **D**eployable **ATC** **S**imulator

documentation is divided into two parts (**SEDAS main** and **SEDAS documentation**), main is located on `README.md` and contatins basic info about this project, while documentation is located in separate markdown files

<!--header of the doc file-->
<hr>

## Table of contents

1. [SEDAS main](/README.md)
    1. [About SEDAS](#about)
    2. [Technical](#technical)
    3. [Functionalities](#funcs)
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
<h2 id="about">About</h2>
This project is new concept of ATC simulator both for beginners and advanced users. It utilises of neural networks to imitate real pilots on the other communication end and also function as a personal trainer. Goal of this desktop application is to make ATC learning easier for hobbyists and begineer ATC students. Project is still in early developement.

<h2 id="technical">Technical</h2>
Application is made in `electron`, with the help of `sqlite3`, app also uses `python` to implement the **AI** part. It is also packaged using `electron-packager`. Frontend is fully made in `VanillaJS`.

<h2 id="funcs">Functionalities</h2>
