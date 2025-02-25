# SEDAS - manager

## About

This project is a new concept of an **ATC simulator** for both beginners and advanced users. It utilizes neural networks to imitate real pilots and also functions as a personal trainer. The goal of this desktop application is to make ATC learning easier for hobbyists and beginner ATC students. The project is still in early development.

To get started, you can read **SEDAS** documentation on: [sedas docs](https://sedas-docs.readthedocs.io/en/latest/)

## Technical

The application is made in `electron`. The app also uses `python` to implement the **AI** part. It is packaged using `electron-packager`. The frontend is fully made in `VanillaJS`. Project currently runs on the newest LTS `node.js` version: `v22.13.1`

## Setup/Installation

### Setup for standard usage

Installation is very straightforward, just download binary that is compatible with your system, you can download it here: 
[sedas releases](https://github.com/SEDAS-DevTeam/SEDAS-manager/releases)

### Setup for development

Whole project runs on `invoke` configuration system (location: `tasks.py`), there are several defined functions that can be invoked from command line.

#### Setting up repository (step by step)

**Setup project**

``` shell
git clone --recursive https://github.com/SEDAS-DevTeam/SEDAS-manager.git
cd SEDAS-manager
```

**Setup virtual environment**

``` shell
virtualenv sedas_manager_env
sedas_manager_env/bin/activate # To deactivate, use: deactivate
pip install -r requirements.txt
cd src # get to working directory
```

**Install dependencies from** `package.json`

``` shell
npm install
```

**Compile C++ and JS files**

``` shell
invoke compile
```

**Run app in development mode**

``` shell
invoke devel
```

Everything should be set up by now :).

**For building and publishing**
TODO

``` shell
invoke build # exec build
invoke publish # publish to github
```

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
- [ ] Check logging
- [ ] Fix settings message
- [ ] Fix departure_arrival points selection
- [ ] Dropdowns are broken
- [ ] Plane info not dragging
- [ ] Planes seem to not unregister properly

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
- [ ] Fix the build with electron-builder
- [ ] Fix app publishing