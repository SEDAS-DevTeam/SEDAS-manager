/* @refresh reload */
import { render } from 'solid-js/web'
import { HashRouter, Route, type RouteSectionProps } from "@solidjs/router";

import { Settings, Main, Exit, Popup, Load, Warn } from './components/External'
import { ControllerHeader, Header } from './components/Other';
import { Setup, Monitors, Simulation, Wiki, Plugins } from './components/Controller'
import { MapUI, DepArr, Embed, Weather } from "./components/Worker"
import { Widget } from './components/WorkerWidgets';

import "./style.css"

function ExternalLayout(props: RouteSectionProps) {
    return <div class="w-screen h-screen">{props.children}</div>
}

function ControllerLayout(props: RouteSectionProps) {
    return (
        <div class="flex flex-col h-screen">
            <ControllerHeader />
            <Header />
            <div class="flex-grow overflow-hidden">
                {props.children}
            </div>
        </div>
    )
}

/*
    Acts as a router to all SEDAS windows
*/
render(() => (
        <HashRouter>
            <Route path="/external" component={ExternalLayout}>
                <Route path="/main" component={Main} />
                <Route path="/exit" component={Exit} />
                <Route path="/popup" component={Popup} />
                <Route path="/load" component={Load} />
                <Route path="/settings" component={Settings} />
                <Route path="/warn" component={Warn} />
            </Route>
            <Route path="/controller" component={ControllerLayout}>
                <Route path="/setup" component={Setup} />
                <Route path="/monitors" component={Monitors} />
                <Route path="/simulation" component={Simulation} />
                <Route path="/plugins" component={Plugins} />
                <Route path="/wiki" component={Wiki} />
            </Route>
            <Route path="/worker" component={ExternalLayout}>
                <Route path="/map" component={MapUI}></Route>
                <Route path="/dep_arr" component={DepArr}></Route>
                <Route path="/embed" component={Embed}></Route>
                <Route path="/weather" component={Weather}></Route>
            </Route>
            <Route path="/widget" component={Widget}></Route>
        </HashRouter>
    ),
    document.getElementById('root')!);
