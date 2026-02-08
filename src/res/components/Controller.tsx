import { createSignal, Show } from 'solid-js'
import { Vars, IPCWrapper } from './utils'
import { AccordionContent, SearchIcon, WarnText, BinarySelector, TrashcanIcon, TabularSelector, Slider } from './Other'

// Inter-Page-data import
import {
    aircraft_Open,
    aircraft_setOpen,

    command_Open,
    command_setOpen,

    control_panel_Open,
    control_panel_setOpen,

    map_scenario_Open,
    map_scenario_setOpen,

    plane_control_Open,
    plane_control_setOpen,

    plane_spawn_Open,
    plane_spawn_setOpen,

    plane_terminal_Open,
    plane_terminal_setOpen
} from "./Storage"

function ScenarioTimeSelector() {
    const [selection, setSelection] = createSignal("random")

    return (
        <>
            <select class="w-full border-1 px-1"
                value={selection()}
                onInput={(e) => setSelection(e.currentTarget.value)}
            >
                <option value="random">Random</option>
                <option value="custom">Custom</option>
            </select>
            <Show when={selection() === "custom"}>
                <input type="text" placeholder="Type time in notation 00:00:00" name="time" class="w-full border-2 border-primary-blue translate-y-[-1px] p-1"></input>
            </Show>
        </>
    )
}

function Setup(){
    return (
        <>
            <div class="h-full p-2 overflow-auto">
                <h2 class="la-header">Simulation setup</h2>

                <hr class="mt-1 mb-2"></hr>

                <AccordionContent title="Map & Scenario selection" class="l-header mb-1" data={[map_scenario_Open, map_scenario_setOpen]}>
                    <div class="pl-3 pt-1">
                        <h2 class="s-header">Map Selection</h2>
                        <table class="table-fixed w-full setup-table">
                            <thead>
                                <tr>
                                    <th>Map preset name</th>
                                    <th>Type</th>
                                    <th>Code</th>
                                    <th>Country</th>
                                    <th>City</th>
                                    <th>Description</th>
                                    <th class="p-2"><input type="text" placeholder="Search..." class="bg-white w-full"></input></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Pardubice Airport</td>
                                    <td>ACC/TWR</td>
                                    <td>LKPD</td>
                                    <td>CZ</td>
                                    <td>Pardubice</td>
                                    <td><SearchIcon onclick={() => console.log("Balls")}></SearchIcon></td>
                                    <td><button class="table-button">Select</button></td>
                                </tr>
                            </tbody>
                        </table>
                        <h2 class="s-header mt-2">Scenario Selection</h2>
                        <table class="table-fixed w-full setup-table">
                            <thead>
                                <tr>
                                    <th>Scenario name</th>
                                    <th>Category tags</th>
                                    <th>Weight category tags</th>
                                    <th class="p-2"><input type="text" placeholder="Search..." class="bg-white w-full"></input></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Scenario Pardubice</td>
                                    <td>
                                        <div class="flex gap-2 px-2">
                                            <span class="table-tag">AI</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="flex gap-2 px-2">
                                            <span class="table-tag">UL</span>
                                            <span class="table-tag">L</span>
                                            <span class="table-tag">M</span>
                                        </div>
                                    </td>
                                    <td><button class="table-button">Select</button></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <h2 class="s-header mt-2">Scenario Adjustments</h2>
                        <WarnText>First select scenario to make scenario adjustments</WarnText>
                        <p>TODO</p>

                        <h2 class="s-header mt-2">Allowed CAT/WTC/APC classes</h2>
                        <div class="flex gap-1 w-full items-start">
                            <table class="category-table">
                                <thead>
                                    <tr>
                                        <th colspan="2">CAT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>AI</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>HE</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>GL</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>AE</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                </tbody>
                            </table>
                            <table class="category-table">
                                <thead>
                                    <tr>
                                        <th colspan="2">WTC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>UL</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>L</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>M</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>H</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>S</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                </tbody>
                            </table>
                            <table class="category-table">
                                <thead>
                                    <tr>
                                        <th colspan="2">APC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>A</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>B</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>C</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>D</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>E</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                    <tr>
                                        <td>H</td>
                                        <td><BinarySelector></BinarySelector></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <h2 class="s-header mt-2">Scenario time</h2>
                        <ScenarioTimeSelector></ScenarioTimeSelector>
                    </div>
                </AccordionContent>

                <AccordionContent title="Aircraft preset selection" class="l-header mb-2" data={[aircraft_Open, aircraft_setOpen]}>
                    <table class="setup-table w-full">
                        <thead>
                            <tr>
                                <th>Aircraft preset name</th>
                                <th>Inspect</th>
                                <th class="p-2"><input type="text" placeholder="Search..." class="bg-white w-full"></input></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Airbus preset</td>
                                <td><SearchIcon onclick={() => console.log("Balls")}></SearchIcon></td>
                                <td><button class="table-button">Select</button></td>
                            </tr>
                        </tbody>
                    </table>
                </AccordionContent>

                <AccordionContent title="Command preset selection" class="l-header mb-2" data={[command_Open, command_setOpen]}>
                    <table class="setup-table w-full">
                        <thead>
                            <tr>
                                <th>Command preset name</th>
                                <th>Inspect</th>
                                <th class="p-2"><input type="text" placeholder="Search..." class="bg-white w-full"></input></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Command preset 1</td>
                                <td><SearchIcon onclick={() => console.log("Balls")}></SearchIcon></td>
                                <td><button class="table-button">Select</button></td>
                            </tr>
                        </tbody>
                    </table>
                </AccordionContent>

                <h2 class="la-header">Setup summary</h2>
                <hr class="mt-1 mb-2"></hr>
                <div class="flex gap-6">
                    <div>
                        <p class="text-primary-blue">Selected map:</p>
                        <h2 class="l-header">None</h2>
                    </div>
                    <div>
                        <p class="text-primary-blue">Selected scenario:</p>
                        <h2 class="l-header">None</h2>
                    </div>
                    <div>
                        <p class="text-primary-blue">Selected aircraft preset:</p>
                        <h2 class="l-header">None</h2>
                    </div>
                    <div>
                        <p class="text-primary-blue">Selected command preset:</p>
                        <h2 class="l-header">None</h2>
                    </div>
                </div>
                <button class="btn-primary mt-5">Confirm and Setup</button>
            </div>
        </>
    )
}

function Monitors(){
    return (
        <>
            <div class="h-full p-2 overflow-auto">
                <h2 class="la-header">Monitors setup</h2>
                <hr class="mt-1 mb-2"></hr>
                <table class="table-fixed w-full">
                    <tbody>
                        <tr>
                            <td class="relative p-2">
                                <div class="h-full w-full bg-blue-500 shadow-sm flex items-center text-white flex flex-col justify-center">
                                    <div class="w-full h-8/9 flex flex-col justify-center">
                                        <p class="font-bold text-sm text-center">
                                            Header Info
                                        </p>
                                    </div>
                                    <select class="w-full text-black bg-white p-1 text-xs border-1">
                                        <option value="TWR">TWR</option>
                                        <option value="APP">APP</option>
                                        <option value="ACC">ACC</option>
                                        <option value="weather">Weather</option>
                                        <option value="dep_arr">Dep./Arr.</option>
                                        <option value="embed">Embed</option>
                                    </select>
                                </div>
                            </td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                <div class="mt-2 flex gap-2">
                    <button class="btn-primary">Reset to default</button>
                    <button class="btn-primary">Apply</button>
                </div>
            </div>
        </>
    )
}

function Simulation(){
    const [wind_control, set_wind_control] = createSignal(false)
    const [wind_control_header, set_header] = createSignal("ENABLE WIND CONTROL")

    return (
        <>
            <div class="h-full p-2 overflow-auto">
                <h2 class="la-header">Simulation control</h2>
                <hr class="mt-1 mb-2"></hr>
                <AccordionContent title="Control panel" class="l-header mb-1" data={[control_panel_Open, control_panel_setOpen]}>
                    <div class="flex p-2 gap-2">
                        <button class="btn-primary !text-lg !p-1">START SIM</button>
                        <button class="btn-primary !text-lg !p-1" onClick={() => {
                            set_wind_control(!wind_control())
                            if (wind_control_header() === "ENABLE WIND CONTROL") set_header("DISABLE WIND CONTROL")
                            else set_header("ENABLE WIND CONTROL")
                        }
                        }>{wind_control_header()}</button>
                    </div>
                    <Show when={wind_control()}>
                        <div class="px-2">
                            <p>Wind control TODO</p>
                        </div>
                    </Show>
                </AccordionContent>

                <AccordionContent title="Plane spawn" class="l-header mb-1" data={[plane_spawn_Open, plane_spawn_setOpen]}>
                    <div class="m-2 p-2 border-primary-blue border-2">
                        <p class="text">NAME:</p>
                        <div class="flex gap-1">
                            <button class="btn-primary !text-lg !p-1">TEST1</button>
                            <button class="btn-primary !text-lg !p-1">TEST1</button>
                            <button class="btn-primary !text-lg !p-1">TEST1</button>
                            <button class="btn-primary !text-lg !p-1">TEST1</button>
                            <input type="text" placeholder="Type custom callsign..." name="callsign" class="border-2 border-primary-blue px-1"></input>
                        </div>
                        <Slider header="HEADING" start="0" step="10" stop="350"></Slider>
                        <Slider header="LEVEL" start="500" step="500" stop="41000"></Slider>
                        <Slider header="SPEED" start="130" step="10" stop="440"></Slider>
                        <div class="flex gap-2">
                            <div class="grow">
                                <p class="text mt-2">MONITOR:</p>
                                <select class="w-full text-black bg-white p-1 text-xs border-1">
                                    <option value="monitor_0">monitor 0 (ACC)</option>
                                    <option value="monitor_1">monitor 1 (ACC)</option>
                                    <option value="monitor_2">monitor 2 (ACC)</option>
                                </select>
                            </div>
                            <div class="grow">
                                <p class="text mt-2">PLANE TYPE:</p>
                                <select class="w-full text-black bg-white p-1 text-xs border-1">
                                    <option value="monitor_0">TODO 0</option>
                                    <option value="monitor_1">TODO 1</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <div class="grow">
                                <p class="text mt-2">DEPARTURE POINT:</p>
                                <select class="w-full text-black bg-white p-1 text-xs border-1">
                                    <option value="monitor_0">TODO 0</option>
                                    <option value="monitor_1">TODO 1</option>
                                </select>
                            </div>
                            <div class="grow">
                                <p class="text mt-2">ARRIVAL POINT:</p>
                                <select class="w-full text-black bg-white p-1 text-xs border-1">
                                    <option value="monitor_0">TODO 0</option>
                                    <option value="monitor_1">TODO 1</option>
                                </select>
                            </div>
                        </div>
                        <p class="text mt-2">ARRIVAL TIME:</p>
                        <input type="text" placeholder="Type time in notation 00:00:00" name="time" class="w-full border-1 p-1"></input>
                        <button class="btn-primary !text-lg !p-1 mt-2 w-full">Confirm</button>
                    </div>
                </AccordionContent>

                <AccordionContent title="Plane control" class="l-header mb-1" data={[plane_control_Open, plane_control_setOpen]}>
                    <WarnText>First start the simulation to change plane values</WarnText>
                    <div class="m-2">
                        <input type="text" placeholder="Search for aircraft name ..." name="time" class="w-full border-2 p-1 border-primary-blue"></input>
                        <div class="w-full p-2 border-2 border-primary-blue translate-y-[-2px]">
                            <div class="w-full border-1 border-primary-blue p-2">
                                <div class="flex">
                                    <p>IJP954 (from LKPD_ARP to LKPD) </p>
                                    <TrashcanIcon onclick={() => console.log("TODO onclick")}></TrashcanIcon>
                                </div>
                                <TabularSelector
                                    name="Heading"
                                    start="0"
                                    step="10"
                                    stop="350"
                                ></TabularSelector>
                                <TabularSelector
                                    name="Level"
                                    start="500"
                                    step="500"
                                    stop="41000"
                                ></TabularSelector>
                                <TabularSelector
                                    name="Speed"
                                    start="130"
                                    step="10"
                                    stop="440"
                                ></TabularSelector>
                            </div>
                        </div>
                    </div>
                </AccordionContent>

                <AccordionContent title="Plane terminal" class="l-header mb-1" data={[plane_terminal_Open, plane_terminal_setOpen]}>
                    <div class="p-2">
                        <div class="bg-[#ccc] w-full h-150 border-2 border-primary-blue px-2 py-1 overflow-auto">
                            <p>TEST1</p>
                            <p>TEST2</p>
                            <p>TEST3</p>
                        </div>
                    </div>
                </AccordionContent>
            </div>
        </>
    )
}

function Plugins(){
    return (
        <>
            <div class="h-full p-2">
                <h2 class="la-header">Plugins</h2>
                <hr class="mt-1 mb-2"></hr>
                <div class="m-3 w-full">
                    <h2 class="l-header mb-1">Plugins Repository</h2>
                    <hr></hr>

                    <p>TODO</p>

                    <h2 class="l-header mb-1">Local Plugins</h2>
                    <hr></hr>

                    <p>TODO</p>
                </div>
            </div>
        </>
    )
}

function Wiki(){
    const URL1 = "https://sedas-docs.readthedocs.io/en/latest/"
    const URL2 = "https://wiki.ivao.aero/en/home"

    const [currentUrl, setCurrentUrl] = createSignal(URL1)

    return (
        <>
            <div class="flex flex-col h-full p-2">
                <h2 class="la-header">Wiki sources</h2>
                <hr class="mt-1 mb-2"></hr>
                <div class="flex gap-2 h-12 m-3">
                    <button class="btn-primary" classList={{ "!bg-primary-blue !text-white" : currentUrl() === URL1 }} onclick={() => setCurrentUrl(URL1)}>SEDAS documentation</button>
                    <button class="btn-primary" classList={{ "!bg-primary-blue !text-white" : currentUrl() === URL2 }} onclick={() => setCurrentUrl(URL2)}>IVAO</button>
                </div>
                <div class="w-full flex-grow p-4">
                    <iframe class="w-full h-full border-0" allowfullscreen src={currentUrl()}></iframe>
                </div>
            </div>
        </>
    )
}

export {
    Setup,
    Monitors,
    Simulation,
    Plugins,
    Wiki
}