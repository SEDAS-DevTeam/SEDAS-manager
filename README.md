## Table of contents

1. [SEDAS main](/README.md)
    1. [About SEDAS](#about)
    2. [Technical](#technical)
    3. [Functionalities](#funcs)
    4. [Sources](/doc/sources/readme.md)
2. [SEDAS documentation](/doc/doc_main.md)
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

## About

This project is a new concept of an **ATC simulator** for both beginners and advanced users. It utilizes neural networks to imitate real pilots and also functions as a personal trainer. The goal of this desktop application is to make ATC learning easier for hobbyists and beginner ATC students. The project is still in early development.

## Technical

The application is made in `electron`, with the help of `sqlite3`. The app also uses `python` to implement the **AI** part. It is packaged using `electron-packager`. The frontend is fully made in `VanillaJS`.

## Functionalities