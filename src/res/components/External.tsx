import { createSignal } from 'solid-js'
import { IPCWrapper } from './utils'
import { AccordionContent } from './Other'
import {
  controller_settings_Open,
  controller_settings_setOpen,

  env_settings_Open,
  env_settings_setOpen,

  general_settings_Open, 
  general_settings_setOpen, 

  plane_settings_Open, 
  plane_settings_setOpen, 

  simulation_settings_Open,
  simulation_settings_setOpen
} from './Storage'

import logo from "@assets/sedas-manager-logo.png"

function Settings() {
    return (
        <>
            <div class="flex h-full">
                <div class="w-[60%] p-3">
                    <h2 class="la-header">SEDAS manager settings</h2>
                    <p class="text mt-1">NOTE: anges will be activated after restart</p>
                    <div id="settings-content" class="ml-4 mt-3 flex flex-col gap-2">
                        <AccordionContent title="General Settings" class="l-header mb-1" data={[general_settings_Open, general_settings_setOpen]}>
                          <hr></hr>
                          <p>TODO</p>
                        </AccordionContent>

                        <AccordionContent title="Controller Settings" class="l-header mb-1" data={[controller_settings_Open, controller_settings_setOpen]}>
                          <hr></hr>
                          <div id="controller-settings-content" class="ml-4 mt-2">
                            <h2 class="s-header mb-1">Monitors setup</h2>
                            <p>TODO</p>
                            <h2 class="s-header mb-1">Simulation setup</h2>
                            <p>TODO</p>
                            <h2 class="s-header mb-1">Simulation control</h2>
                            <p>TODO</p>
                            <h2 class="s-header mb-1">Plugins</h2>
                            <p>TODO</p>
                          </div>
                        </AccordionContent>

                        <AccordionContent title="Simulation Settings" class="l-header mb-1" data={[simulation_settings_Open, simulation_settings_setOpen]}>
                          <hr></hr>
                          <p>TODO</p>
                        </AccordionContent>

                        <AccordionContent title="Plane Settings" class="l-header mb-1" data={[plane_settings_Open, plane_settings_setOpen]}>
                          <hr></hr>
                          <p>TODO</p>
                        </AccordionContent>

                        <AccordionContent title="Environment Settings" class="l-header mb-1" data={[env_settings_Open, env_settings_setOpen]}>
                          <hr></hr>
                          <p>TODO</p>
                        </AccordionContent>
                    </div>
                </div>
                <div class="w-[40%]">
                    <iframe class="w-full h-full border-0" allowfullscreen src="https://sedas-docs.readthedocs.io/en/latest/"></iframe>
                </div>
            </div>
        </>
    )
}

function Main() {
  const menu_onclick = () => IPCWrapper.send_message("menu", "redirect-to-main")
  const settings_onclick = () => IPCWrapper.send_message("menu", "redirect-to-settings")
  const restore_sim = () => IPCWrapper.send_message("menu", "restore-sim")

  return (
      <>
        <div class="flex h-full items-center justify-center">
          <div>
            <img src={logo} class="img-resource w-full mx-auto block"></img>
            <h2 class="l-header text-center">SEDAS manager</h2>
            <p class="text text-center mb-1">An out-of-the-box ATC simulator</p>
            <button class="btn-primary me-1" onclick={menu_onclick}>Start</button>
            <button class="btn-primary me-1" onclick={settings_onclick}>Settings</button>
            <button class="btn-primary btn-disabled" onclick={restore_sim}>Reload last session</button>
          </div>
        </div>
      </>
  )
}

function Exit() {
  return (
    <>
      <div class="flex h-full items-center justify-center">
        <div>
          <img src={logo} class="img-resource w-full mx-auto block"></img>
          <h2 class="l-header text-center">Exiting App, please wait ...</h2>
        </div>
      </div>
    </>
  )
}

function Load() {
  return (
    <>
      <div class="flex h-full items-center justify-center">
        <div>
          <img src={logo} class="img-resource w-full mx-auto block"></img>
          <div class="w-full grid place-items-center">
            <div class="w-48 h-4 border-1 border-black rounded-sm overflow-hidden">
              <div class="h-full bg-primary-blue w-1/2 rounded-sm "></div>
            </div>
          </div>
          <p class="text text-center mt-2">Loader sample text</p>
        </div>
      </div>
    </>
  )
}

function Popup() {
  return (
    <>
      <div class="flex h-full items-center justify-center">
        <div>
          <h2 class="s-header text-center mb-1">INFO: Popup header</h2>
          <div id="popup-content">
            <p class="text text-center mb-1">More text i guess...</p>
          </div>
          <p class="text text-center mb-1">Proceed?</p>
          <div class="flex gap-2 mt-5">
            <button class="btn-primary !h-10 !text-lg !w-25">Yes</button>
            <button class="btn-primary !h-10 !text-lg !w-25">No</button>
          </div>
        </div>
      </div>
    </>
  )
}

function Warn() {
  return (
    <>
      <div class="flex h-full items-center justify-center">
        <div>
          <h2 class="s-header text-center mb-1">INFO: Popup header</h2>
          <div id="popup-content"></div>
          <p class="text text-center mb-1">Some sample text</p>
          <div class="flex gap-2 mt-5 justify-center">
            <button class="btn-primary !h-10 !text-lg !w-25">Ok</button>
          </div>
        </div>
      </div>
    </>
  )
}

export { 
  Main,
  Exit,
  Load,
  Popup,
  Settings,
  Warn
}
