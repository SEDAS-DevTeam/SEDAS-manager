# SEDAS - manager

## About

This project is a new concept of an **ATC simulator** for both beginners and advanced users. It utilizes neural networks to imitate real pilots and also functions as a personal trainer. The goal of this desktop application is to make ATC learning easier for hobbyists and beginner ATC students. The project is still in early development.

To get started, you can read **SEDAS** documentation:

- **Czech version:** - [sedas docs CZ](https://sedas-docs.readthedocs.io/cs/latest/)

- **English version:** - [sedas docs EN](https://sedas-docs.readthedocs.io/en/latest/)

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
- [ ] Validate all the plane calculations (just to make sure)
- [ ] When registering new plane, the SEDAS-AI synth just cannot see Model file (piper) - **URGENT**
- [ ] When making climb/descend in turn, plane starts to change its rotation completely (but works when corrected in vectoring) - **URGENT**
- [x] Two plugin paths
- [x] Logs still showing SEDAC instead of SEDAS
- [x] Fix the build with electron-forge
- [x] Finish app publishing to github
- [x] Add the Climb/descend functionality
- [ ] Make a small rework in forge.config.js (better os support + exclusion based mechanic)
- [ ] START/STOP button sometimes rewrites itself in simulation running
- [x] ECONNREFUSED on the first session start
- [ ] make command restrictions so that controller cannot tell plane some obscure command - **URGENT**

### Upcoming versions

- [ ] Rework WebGL rendering
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
