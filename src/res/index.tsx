/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from "@solidjs/router";
import { Main, Exit, Popup, Load } from './components/Other'

/*
    Acts as a router to all SEDAS windows
*/
render(() => (
        <Router>
            <Route path="/main" component={Main} />
            <Route path="/exit" component={Exit} />
            <Route path="/popup" component={Popup} />
            <Route path="/load" component={Load} />
        </Router>
    ),
    document.getElementById('root')!);
