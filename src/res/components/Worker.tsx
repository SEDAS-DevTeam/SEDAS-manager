import { onMount } from "solid-js"


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

export {
    Map
}