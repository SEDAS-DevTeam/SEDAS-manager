/*
    File used for registering all S-GUI elements
*/

import components from '../../source/sgui/components.js';

export function copy_methods(){
    Object.getOwnPropertyNames(components.BasicElement.prototype).forEach(method => {
        if (method !== 'constructor') {
            HTMLElement.prototype[method] = components.BasicElement.prototype[method];
        }
    });
}

export function set_elements(){
    customElements.define("s-button", components.Button)
    customElements.define("s-text", components.Text)
    customElements.define("s-header", components.Header)
    customElements.define("align-h-center", components.AlignHCenter, {extends: "div"})
    customElements.define("align-v-center", components.AlignVCenter, {extends: "div"})
    customElements.define("s-loadbar", components.Loadbar)
    customElements.define("s-circle-loadbar", components.CircleLoadbar)
    customElements.define("s-topnav", components.Topnav)
    customElements.define("s-icon", components.Icon)
    customElements.define("page-mask", components.PageMask)
    customElements.define("resource-frame", components.IframeExtension)
    customElements.define("s-canvas", components.WorkerCanvas)
    customElements.define("default-table", components.DefaultTable)
    customElements.define("monitor-table", components.MonitorTable)
    customElements.define("desc-popup", components.DescPopup)
}