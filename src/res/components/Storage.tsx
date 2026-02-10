/*
##########################
Storage for saving all the inter-page information
##########################
*/

import { createSignal } from "solid-js"

/*
Chevron data
*/

// Setup
export const [map_scenario_Open, map_scenario_setOpen] = createSignal(true)
export const [aircraft_Open, aircraft_setOpen] = createSignal(true)
export const [command_Open, command_setOpen] = createSignal(true)

// Simulation
export const [control_panel_Open, control_panel_setOpen] = createSignal(true)
export const [plane_spawn_Open, plane_spawn_setOpen] = createSignal(true)
export const [plane_control_Open, plane_control_setOpen] = createSignal(true)
export const [plane_terminal_Open, plane_terminal_setOpen] = createSignal(true)

// Settings
export const [general_settings_Open, general_settings_setOpen] = createSignal(true)
export const [controller_settings_Open, controller_settings_setOpen] = createSignal(true)
export const [simulation_settings_Open, simulation_settings_setOpen] = createSignal(true)
export const [plane_settings_Open, plane_settings_setOpen] = createSignal(true)
export const [env_settings_Open, env_settings_setOpen] = createSignal(true)

// Worker
export const [leaflet_weather_running, leaflet_weather_running_Set] = createSignal(false)