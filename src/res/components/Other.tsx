import { useLocation } from "@solidjs/router";
import { IPCWrapper } from "./utils";

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