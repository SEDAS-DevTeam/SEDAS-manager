# SEDAS - manager

## NOTE: Currently, the SEDAS-manager wont work in your environment. I am rewriting all the project helper mechanics for a better transition to the new tech stack (Vite + SolidJS + TailwindCSS + Typescript). So there will be a lot of clutter in the `main` branch. In order to use SEDAS in the last functional version, clone from the `last-working-ver` branch instead

## About

This project is a new concept of an **ATC simulator** for both beginners and advanced users. It utilizes neural networks to imitate real pilots and also functions as a personal trainer. The goal of this desktop application is to make ATC learning easier for hobbyists and beginner ATC students. The project is still in early development.

To get started, you can read **SEDAS** documentation:

- **Czech version:** - [sedas docs CZ](https://sedas-docs.readthedocs.io/cs/latest/)

- **English version:** - [sedas docs EN](https://sedas-docs.readthedocs.io/en/latest/)


## Tech stack

![Solid](https://img.shields.io/badge/Solid-2C4F7C.svg?style=for-the-badge&logo=solid&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-6DA55F.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-2B2E3A.svg?style=for-the-badge&logo=electron&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![C++](https://img.shields.io/badge/C++-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white)
![NodeAddonAPI](https://img.shields.io/badge/Node%20addon%20API-green?logo=node.js&logoColor=white&style=for-the-badge)


## Project TODO list

### Current version

- [x] Fix model crashing after request
- [x] Add SEDAS-AI-backend as submodule
- [x] Make project portable + rework project.py into invoke
- [x] Unify with the .vscode file
- [x] Log colors in invoke
- [x] Logo loads are broken (init and outro)
- [x] On level and speed change floats are showing
- [x] Check logging
- [ ] Fix settings message (settings not saving)
- [ ] Planes seem to not unregister properly
- [x] Validate all the plane calculations (just to make sure)
- [x] When making climb/descend in turn, plane starts to change its rotation completely, this only happens on the initial turn of the plane, after that, it never is an issue again
- [x] Two plugin paths
- [x] Logs still showing SEDAC instead of SEDAS
- [x] Fix the build with electron-forge
- [x] Finish app publishing to github
- [x] Add the Climb/descend functionality
- [ ] Make a small rework in forge.config.js (better os support + exclusion based mechanic)
- [ ] START/STOP button sometimes rewrites itself in simulation running
- [x] ECONNREFUSED on the first session start
- [x] make command restrictions so that controller cannot tell plane some obscure command
- [x] When setting up headings (specificaly when two plane have identical ones), sometimes two plane interchange them
- [x] Add module monitoring (so that when module breaks, it can easily initialize itself again)
- [ ] Module routing seems to be done to stderr
- [ ] SEDAS-AI-backend crashixng after heavy use (repeatedly) - **URGENT**
- [x] Mic available when simulation turned off (doesnt really make a sense)
- [ ] Say again? sometimes even after literally understanding the command correctly - **URGENT**
- [x] Add typing in tasks.py
- [ ] Make DEV and PROD modes more distinguishable
- [ ] Completely rework the frontend (big mess)
- [ ] Switch from javascript to typescript on frontend

### Upcoming versions

- [ ] Add WebGL rendering
- [ ] Rework CSS/JS
- [ ] Better time
- [ ] Finish PluginRegister
- [ ] Rework Plugins tab
- [ ] Rework inspect in controller_SET (better spacing, make it hover on screen)
- [ ] Better error handling on node_api side
- [ ] Rework loader segments
- [ ] Move plane name generation to C++
- [ ] Plane terminal is undefined
- [ ] Add unified audio backend
- [ ] Finish scenarios setup
- [ ] First build when?
- [ ] Rework app backup
- [ ] Enable geo_data channel
- [ ] When switching to SEDAS wiki, whole page scrolls down
- [ ] Add plane path and spawn functionalities
- [ ] Unify IPC
- [ ] Use strict mode to enforce semicolons
- [ ] Make build configs look less janky
- [ ] Fix departure_arrival points selection
- [ ] Dropdowns are broken
- [ ] Plane info not dragging
- [ ] Join logging sources from all the backends
- [ ] Window assignments are sometimes dislocated from different window resolutions
- [ ] Map is weirdly resized when different resolutions
- [ ] Heading selections on the controller size are not so clickable - CSS issue
- [ ] Merge plane_turn_DB with DB (much more easier to implement)
- [ ] Make repository contributor/fork friendly (copyright notice, solve all the legislative stuff)
- [ ] Rework transition altitude
- [ ] Rework settings so that the changes can be activated on-run
- [x] Wayland does not respect custom QT widget placement :( (short term fix mby?)
- [ ] Find a way to remove the XWayland dependency on the whole platform
- [ ] Update read the docs new build instructions (.python-version file)
- [ ] Completely rework the tasks.py (Maybe more OOP oriented?)
- [ ] Rework exception handling in StreamCapturer -> has evil output
- [ ] Completely overhaul the whole project structure
