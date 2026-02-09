import { onMount, For } from "solid-js"

interface DepArrTableProps {
    traversal_point_type: string,
    edge_point_type: string
}

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

function Map(){
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
        <div class="bg-black text-white w-full h-screen">
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

export {
    Map,
    DepArr,
    Embed
}