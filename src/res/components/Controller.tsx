import { createSignal } from 'solid-js'
import { Vars, IPCWrapper } from './utils'

function Settings() {
    return (
        <>
            <div class="flex h-full">
                <div class="w-[60%] p-3">
                    <h2 class="la-header">SEDAS manager settings</h2>
                    <p class="text mt-1">NOTE: Changes will be activated after restart</p>
                    <div id="settings-content" class="ml-4 mt-3">
                        <h2 class="l-header mb-1">General Settings</h2>
                        <hr></hr>
                        <p>TODO</p>

                        <h2 class="l-header mb-1">Controller Settings</h2>
                        <hr></hr>
                        <div id="controller-settings-content" class="ml-4 mt-2">
                            <h2 class="s-header mb-1">Monitors setup</h2>
                            <p>TODO</p>
                            <h2 class="s-header mb-1">Simulation setup</h2>
                            <p>TODO</p>
                            <h2 class="s-header mb-1">Simulation control</h2>
                            <p>TODO</p>
                            <h2 class="s-header mb-1">Plugins</h2>
                            <p>TODO</p>
                        </div>

                        <h2 class="l-header mb-1">Simulation Settings</h2>
                        <hr></hr>
                        <p>TODO</p>

                        <h2 class="l-header mb-1">Plane Settings</h2>
                        <hr></hr>
                        <p>TODO</p>

                        <h2 class="l-header mb-1">Environment Settings</h2>
                        <hr></hr>
                        <p>TODO</p>
                    </div>
                </div>
                <div class="w-[40%]">
                    <iframe class="w-full h-full border-0" allowfullscreen src="https://sedas-docs.readthedocs.io/en/latest/"></iframe>
                </div>
            </div>
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
    Settings,
    Plugins,
    Wiki
}