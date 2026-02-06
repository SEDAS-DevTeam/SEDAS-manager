import { createSignal } from 'solid-js'
import { Vars, IPCWrapper } from './utils'


function Setup(){
    return (
        <>
            <div class="h-full p-2">
                <h2 class="l-header">Simulation setup</h2>

                <hr class="mt-1"></hr>

                
            </div>
        </>
    )
}

function Monitors(){
    return (
        <>
            <div class="h-full p-2">
                <h2 class="l-header">Monitors setup</h2>
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
            <div class="flex h-full">
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
            <div class="flex flex-col h-full">
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