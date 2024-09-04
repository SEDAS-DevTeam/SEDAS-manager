/*
    File used for registering all S-GUI elements
*/

import components from '../../source/sgui/components.js';

export function set_elements(){
    customElements.define("s-button", components.Button)
    customElements.define("s-text", components.Text)
    customElements.define("s-header", components.Header)
}