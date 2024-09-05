/*
    Main file of gui (takes care of initializing S-GUi)
*/

import {set_elements} from '../../source/sgui/register.js';
import { create_elem, get_elem, on_win_load } from '../../source/sgui/sgui_def.js';

set_elements()

const sg = {
    get_elem,
    create_elem,
    on_win_load
}

export default sg