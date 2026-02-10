
function Maximize() {
    return (
        <button class="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#5271ff" d="M3 3h6v2H6.462l4.843 4.843l-1.415 1.414L5 6.367V9H3zm0 18h6v-2H6.376l4.929-4.928l-1.415-1.414L5 17.548V15H3zm12 0h6v-6h-2v2.524l-4.867-4.866l-1.414 1.414L17.647 19H15zm6-18h-6v2h2.562l-4.843 4.843l1.414 1.414L19 6.39V9h2z"/></svg>
        </button>
    )
}

function Minimize() {
    return (
        <button class="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#5271ff" d="M9 9H3V7h4V3h2zm0 6H3v2h4v4h2zm12 0h-6v6h2v-4h4zm-6-6h6V7h-4V3h-2z"/></svg>
        </button>
    )
}

function Cross() {
    return (
        <button class="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#5271ff" d="M18.36 19.78L12 13.41l-6.36 6.37l-1.42-1.42L10.59 12L4.22 5.64l1.42-1.42L12 10.59l6.36-6.36l1.41 1.41L13.41 12l6.36 6.36z"/></svg>
        </button>
    )
}

function Widget() {
    return (
        <div class="h-full bg-[#c9c9c9] widget-container">
            <nav class="flex gap-2 p-2 justify-end bg-[#b1b1b1]">
                <Minimize></Minimize>
                <Maximize></Maximize>
                <Cross></Cross>
            </nav>
            <div class="flex gap-2 p-2 py-3">
                <button>Test button</button>
                <button>Test button 2</button>
            </div>
        </div>
    )
}

export {
    Widget
}