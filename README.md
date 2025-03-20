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
- [ ] Settings not saving
- [x] Check logging
- [ ] Fix settings message
- [ ] Fix departure_arrival points selection
- [ ] Dropdowns are broken
- [ ] Plane info not dragging
- [ ] Planes seem to not unregister properly
- [ ] Two plugin paths
- [x] Logs still showing SEDAC instead of SEDAS
- [ ] Fix the build with electron-builder
- [ ] Finish app publishing to github

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
