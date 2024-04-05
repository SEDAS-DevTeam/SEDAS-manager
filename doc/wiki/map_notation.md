<!--header of the doc file-->
<hr>

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
# Local storage folder for all saved maps for SEDAC to load
Files are saved in custom binary file format (**.smmr**), file syntax differs for every air traffic controller type (TWR/APP/ACC)

## Syntax:
- `|` - for specifying multiple choices
- `//` - for commenting, will not read by SEDAC

(**Recommendation:** Do not put multiple records to inline, program is not designed to read file this way and an error will probably occur!)

### for ACC:

```
TYPE: "ACC" //specify Controller type
//Areodrome Reference Point, used to locate where Airport is until aircraft control is passsed to APP or TWR
ARP: "none" |
{x: "int value x 1", y: "int value y 1", name: "Airport callsign 1"}
{x: "int value x 2", y: "int value y 2", name: "Airport callsign 2"}
//{} brackets indicate one ARP record
POINTS: 
{x: "int value x 1", y: "int value y 1", name: "Point (route) callsign 1"}
{x: "int value x 2", y: "int value y 2", name: "Point (route) callsign 2"}
//{} brackets indicate one Point record
//Standart Instrument Departure points (not connected by lines)
SID: "none" |
{x: "int value x 1", y: "int value y 1", name: "SID callsign 1"}
{x: "int value x 2", y: "int value y 2", name: "SID callsign 2"}
//{} brackets indicate one SID record
//Standart Arrival Route points (connected by lines)
STAR: "none" |
{x: "int value x 1", y: "int value y 1", name: "STAR callsign 1"}
{x: "int value x 2", y: "int value y 2", name: "STAR callsign 2"}
//{} brackets indicate one STAR record
SECTOR: //a FIR sector where an ATCO will operate, is defined by unlimited set of points (n-gon)
{x: "int value x 1", y: "int value y 1"}
{x: "int value x 2", y: "int value y 2"}
{x: "int value x 3", y: "int value y 3"}
{x: "int value x 4", y: "int value y 4"}
//{} brackets indicate one corner of resulting shape
```

### for APP:

```
```

### for TWR:

```
```
