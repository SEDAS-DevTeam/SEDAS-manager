/*
    Main file of gui (takes care of initializing S-GUI)
*/

import { set_elements, copy_methods } from '../../source/sgui/register.js';
import { create_elem, 
         get_elem, 
         is_online, 
         on_win_load, 
         on_mouse_drag, 
         on_key_events,
         on_click
} from '../../source/sgui/sgui_def.js';

copy_methods()
set_elements()

const sg = {
    get_elem,
    create_elem,
    on_win_load,
    is_online,
    on_mouse_drag,
    on_key_events,
    on_click
}

export default sg