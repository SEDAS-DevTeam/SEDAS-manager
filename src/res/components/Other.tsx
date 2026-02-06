import { useLocation } from "@solidjs/router";
import { createSignal } from 'solid-js'
import { IPCWrapper } from "./utils";
import type { JSX } from "solid-js";

interface AccordionProps {
    title: string,
    children: JSX.Element,
    class: string
}

interface ChevronProps {
    onclick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent, JSX.EventHandler<HTMLDivElement, MouseEvent>>
    class: string
}

export function Header() {
    const PATHS = [
        "/controller/setup",
        "/controller/monitors",
        "/controller/simulation",
        "/controller/plugins",
        "/controller/wiki"
    ]
    const location = useLocation();

    return (
        <header class="bg-white border-b border-gray-200 shadow-sm">
            <div class="flex justify-between items-center">
                <nav class="flex">
                    <a href={PATHS[0]}
                        class="btn-primary s-header"
                        classList={{ 'btn-active': location.pathname === PATHS[0] }}
                        >Setup
                    </a>
                    <a href={PATHS[1]}
                        class="btn-primary s-header"
                        classList={{ 'btn-active': location.pathname === PATHS[1] }}
                        >Monitors
                    </a>
                    <a href={PATHS[2]} 
                        class="btn-primary s-header"
                        classList={{ 'btn-active': location.pathname === PATHS[2] }}
                        >Simulation
                    </a>
                    <a href={PATHS[3]} 
                        class="btn-primary s-header"
                        classList={{ 'btn-active': location.pathname === PATHS[3] }}
                        >Plugins
                    </a>
                    <a href={PATHS[4]} 
                        class="btn-primary s-header"
                        classList={{ 'btn-active': location.pathname === PATHS[4] }}
                        >Wiki
                    </a>
                </nav>
            </div>
        </header>
    )
}

export function ControllerHeader() {
    const redirect_onclick = () => IPCWrapper.send_message("controller", "redirect-to-menu")
    const exit_onclick = () => IPCWrapper.send_message("controller", "exit")

    return (
        <nav class="flex gap-3 p-2">
            <h2 class="la-header">SEDAS Manager Controller</h2>
            <button class="btn-primary s-header" onclick={exit_onclick}>Exit</button>
            <button class="btn-primary s-header" onclick={redirect_onclick}>Back to menu</button>
        </nav>
    )
}

function ChevronDown(props: ChevronProps){
    return (
        <div onclick={props.onclick} class={`cursor-pointer mr-2 flex translate-y-[4px] items-center${props.class ?? ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512"><path fill="#5271ff" d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7L86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>
        </div>
    )
}

export function AccordionContent(props: AccordionProps) {
    const [isOpen, setIsOpen] = createSignal(true)

    return (
        <div>
            <div class="flex">
                <ChevronDown onclick={() => setIsOpen(!isOpen())} class={`w-4 h-4 transition-transform duration-200 ${
                isOpen() ? "rotate-0" : "-rotate-90"}`}>
                </ChevronDown>
                <h2 class={`leading-none ${props.class}`}>{props.title}</h2>
            </div>
            <div
                class={`grid transition-all duration-300 ease-in-out ${
                isOpen() ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div class="overflow-hidden">
                    <div class="pb-4">
                        {props.children}
                    </div>
                </div>
            </div>
        </div>
    )
}