# SEDAS - manager

## About

This project is a new concept of an **ATC simulator** for both beginners and advanced users. It utilizes neural networks to imitate real pilots and also functions as a personal trainer. The goal of this desktop application is to make ATC learning easier for hobbyists and beginner ATC students. The project is still in early development.

To get started, you can read **SEDAS** documentation on: [sedas docs](https://sedas-docs.readthedocs.io/en/latest/)

## Technical

The application is made in `electron`. The app also uses `python` to implement the **AI** part. It is packaged using `electron-packager`. The frontend is fully made in `VanillaJS`.

## Setup/Installation

**1) Setup for standard usage**
Installation is very straightforward, just download binary that is compatible with your system, you can download it here: 
[sedas releases](https://github.com/SEDAS-DevTeam/SEDAS-manager/releases)

**2) Setup for developement**
If you want to contribute on this project, you will have to go through these steps to setup **SEDAS developement environment:**

## TODO

### Current version

- [ ] Logging is rewriting app_log.txt on address check
- [ ] Add plane path and spawn functionalities
- [ ] Unify IPC
- [ ] Fix model crashing after request
- [ ] Add SEDAS-AI-backend as submodule
- [ ] First build when?
- [ ] Make project portable + rework project.py into invoke
- [ ] Unify with the .vscode file

### Upcoming versions

- [ ] Rework CSS/JS
- [ ] Better time