import { createSignal, Show } from 'solid-js'
import { Vars, IPCWrapper } from './utils'
import { AccordionContent, SearchIcon, WarnText, BinarySelector } from './Other'

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

                <AccordionContent title="Map & Scenario selection" class="l-header mb-1">
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

                <AccordionContent title="Aircraft preset selection" class="l-header mb-2">
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

                <AccordionContent title="Command preset selection" class="l-header mb-2">
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
            <div class="h-full p-2">
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
    return (
        <>
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