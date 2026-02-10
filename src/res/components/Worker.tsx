import { onMount, onCleanup, For, Show, createSignal } from "solid-js"
import { LeafletWrapper } from "./utils";

import { leaflet_weather_running, leaflet_weather_running_Set } from "./Storage";

import L from "leaflet"
import "leaflet/dist/leaflet.css";

interface DepArrTableProps {
    traversal_point_type: string,
    edge_point_type: string
}

// variables
var weather_wrapper: LeafletWrapper

function WorkerCanvas(){
    let canvas_ref!: HTMLCanvasElement;

    onMount(() => {
        const canvas: HTMLCanvasElement = canvas_ref
        const ctx = canvas!.getContext("2d")

        ctx!.fillStyle = "black"
        ctx!.fillRect(0, 0, canvas.width, canvas.height)
    })

    return (
        <div class="w-full flex-grow">
            <canvas 
                class="block w-full h-full"
                ref={canvas_ref}
            ></canvas>
        </div>
    )
}

function DepArrTable(props: DepArrTableProps) {
    const rows = Array.from({ length: 6 }, (_, i) => i)

    return (
        <table class="dep_arr-table border-r-2">
            <tbody>
                <tr>
                    <td>ETA</td>
                    <td>CALLSIGN</td>
                    <td>{props.traversal_point_type}</td>
                    <td>{props.edge_point_type}</td>
                </tr>
                <For each={rows}>
                    {() => (
                        <tr>
                            <td colspan="4"></td>
                        </tr>
                    )}
                </For>
            </tbody>
        </table>
    )
}

function PlayIcon() {
    const icon_toggle = () => {
        leaflet_weather_running_Set(!leaflet_weather_running())
        weather_wrapper.toggle()
    }

    return (
        <>
            <Show when={!leaflet_weather_running()}>
                <button class="min-icon" onClick={icon_toggle}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" d="M8 5.14v14l11-7z"/></svg>
                </button>
            </Show>
            <Show when={leaflet_weather_running()}>
                <button class="min-icon" onClick={icon_toggle}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="4" height="14" x="6" y="5" fill="#000" rx="1"/><rect width="4" height="14" x="14" y="5" fill="#000" rx="1"/></svg>
                </button>
            </Show>
        </>
    )
}

function MoveRightIcon() {
    return (
        <button class="min-icon" onclick={weather_wrapper.move_right}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="#000" d="M15.707 11.293a1 1 0 0 1 0 1.414l-5.657 5.657a1 1 0 1 1-1.414-1.414l4.95-4.95l-4.95-4.95a1 1 0 0 1 1.414-1.414z"/></g></svg>
        </button>
    )
}

function MoveLeftIcon() {
    return (
        <button class="min-icon" onclick={weather_wrapper.move_left}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="#000" d="M8.293 12.707a1 1 0 0 1 0-1.414l5.657-5.657a1 1 0 1 1 1.414 1.414L10.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414z"/></g></svg>
        </button>
    )
}

function MapUI(){
    return (
        <div class="flex flex-col h-screen">
            <header class="bg-[#c9c9c9]">
                <div class="flex items-center">
                    <nav class="flex justify-between w-full">
                        <button class="border-2 border-primary-blue p-2 text-primary-blue font-semibold cursor-pointer hover:bg-white">Mic OFF</button>
                        <div>
                            <p class="flex text-primary-blue font-bold h-full items-center justify-center px-2">Date Time</p>
                        </div>

                        <div class="flex">
                            <button class="bg-green-600 border-2 border-primary-blue p-2 font-semibold cursor-pointer hover:bg-white">RUN</button>
                            <button class="border-2 border-primary-blue p-2 text-primary-blue font-semibold cursor-pointer hover:bg-white translate-x-[-1px] mr-[-1px]">EXIT</button>
                        </div>
                    </nav>
                </div>
            </header>
            <WorkerCanvas></WorkerCanvas>
        </div>
    )
}

function DepArr(){
    return (
        <div class="bg-black text-white w-full min-h-screen">
            <h2 class="w-full flex items-center justify-center py-4 font-bold text-2xl">Time (TODO)</h2>
            <div class="mt-2">
                <h2 class="text-lg px-4 font-bold pb-2">Arrivals</h2>
                <div class="flex flex-row">
                    <DepArrTable traversal_point_type="STAR" edge_point_type="ARR POINT"></DepArrTable>
                    <DepArrTable traversal_point_type="STAR" edge_point_type="ARR POINT"></DepArrTable>
                </div>
            </div>

            <div class="mt-2">
                <h2 class="text-lg px-4 font-bold pb-2">Departures</h2>
                <div class="flex flex-row">
                    <DepArrTable traversal_point_type="SID" edge_point_type="DEST POINT"></DepArrTable>
                    <DepArrTable traversal_point_type="SID" edge_point_type="DEST POINT"></DepArrTable>
                </div>
            </div>
        </div>
    )
}

function Embed() {
    let iframe_elem!: HTMLIFrameElement;
    let input_elem!: HTMLInputElement

    return (
        <>
            <div class="flex flex-col h-screen overflow-auto">
                <header class="bg-[#c9c9c9]">
                    <div class="flex items-center">
                        <nav class="flex justify-between w-full">
                            <div class="flex gap-2">
                                <input type="text" placeholder="Place embed URL here ..." class="px-2 border-1 h-full bg-[#dddddd]" ref={input_elem}></input>
                                <button class="bg-[#dddddd] border-1 border-black p-2 text-black cursor-pointer hover:bg-white" onclick={() => {
                                    if (input_elem.value.length != 0) {
                                        iframe_elem.src = input_elem.value
                                    }
                                }}>Confirm</button>
                                <button class="bg-[#dddddd] border-1 border-black p-2 text-black cursor-pointer hover:bg-white" onclick={() => {
                                    iframe_elem.src = ""
                                }}>Reset</button>
                            </div>
                        </nav>
                    </div>
                </header>
                <iframe class="flex-1 w-full border-none bg-black" id="iframe-content" ref={iframe_elem}></iframe>
            </div>
        </>
    )
}

function ClockElem() {
    const [time, setTime] = createSignal(new Date())
    const format_time = () => {
        return `${time().toLocaleDateString("en-GB")} ${time().toLocaleTimeString()}`
    }

    onMount(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)

        onCleanup(() => clearInterval(timer))
    })

    return (
        <span class="ml-2 font-bold">{format_time()}</span>
    )
}

function Weather() {
    var map_instance: L.Map | null;

    const clear_map = () => {
        map_elem.innerHTML = ""
        map_elem.className="flex-1 w-full border-none bg-black"
        if (map_instance){
            map_instance.remove()
            map_instance = null
        }
    }

    const initialize_source = (source_type: string) => {
        clear_map()
        switch (source_type) {
            case "leaflet":
                map_instance = L.map(map_elem, { maxZoom: 12 }).setView([48.8566, 2.3522], 5)

                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    maxZoom: 20
                }).addTo(map_instance);

                weather_wrapper = new LeafletWrapper(map_instance)
                weather_wrapper.load_api_data()
                break
            
            case "custom":
                console.log("Idk about that one bruv, TODO")
                break
        }
    }

    const [selected_source, set_selected_source] = createSignal("")

    let map_elem!: HTMLDivElement;
    let select_elem!: HTMLSelectElement

    onMount(() => {
        set_selected_source(select_elem.value)
        initialize_source(selected_source())
    })

    return (
        <>
            <div class="flex flex-col h-screen overflow-auto">
                <header class="bg-[#c9c9c9]">
                    <div class="flex items-center">
                        <nav class="flex justify-between w-full">
                            <div class="flex gap-2">
                                <p class="flex text-primary-blue font-medium h-full items-center justify-center px-2">SELECTED RADAR SOURCE:</p>
                                <select class="border-2 border-primary-blue px-1 text-primary-blue" ref={select_elem}>
                                    <option value="leaflet">Leaflet (Current Weather forecast)</option>
                                    <option value="custom">Custom</option>
                                    <option value="todo">TODO</option>
                                </select>
                                <button class="border-2 border-primary-blue p-2 font-bold text-primary-blue cursor-pointer hover:bg-white" onclick={() => {
                                    set_selected_source(select_elem.value)
                                    initialize_source(selected_source())
                                }}>Confirm</button>
                            </div>
                        </nav>
                    </div>
                </header>
                <Show when={selected_source() === "leaflet"}>
                    <header class="bg-[#c9c9c9]">
                        <div class="flex items-center">
                            <nav class="flex justify-between w-full">
                                <div>
                                    <p class="flex text-primary-blue font-medium h-full items-center justify-center px-2">FRAME TIME (H/M): <span class="ml-2 font-bold" id="frame-time-field">None</span></p>
                                </div>
                                <div>
                                    <p class="flex text-primary-blue font-medium h-full items-center justify-center px-2">CURRENT DATETIME (H/M/S + Off): <ClockElem></ClockElem></p>
                                </div>
                                <div class="flex h-[44px]">
                                    <MoveLeftIcon></MoveLeftIcon>
                                    <PlayIcon></PlayIcon>
                                    <MoveRightIcon></MoveRightIcon>
                                </div>
                            </nav>
                        </div>
                    </header>
                </Show>
                <Show when={selected_source() === "custom"}>
                    <header class="bg-[#c9c9c9]">
                        <div class="flex items-center">
                            <nav class="flex justify-between w-full">
                                <div>
                                    <p class="flex text-primary-blue font-medium h-full items-center justify-center px-2">FRAME TIME: <span class="ml-2 font-bold">None</span></p>
                                </div>

                                <button class="bg-green-600 border-2 border-primary-blue p-2 font-semibold cursor-pointer hover:bg-white h-[44px]">RUN</button>
                            </nav>
                        </div>
                    </header>
                </Show>
                <div class="flex-1 w-full border-none bg-black" id="mapid" ref={map_elem}>
                </div>
            </div>
        </>
    )
}

export {
    MapUI,
    DepArr,
    Embed,
    Weather
}