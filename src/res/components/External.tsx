import { createSignal } from 'solid-js'
import { Vars, IPCWrapper } from './utils'
import { AccordionContent } from './Other'

function Settings() {
    return (
        <>
            <div class="flex h-full">
                <div class="w-[60%] p-3">
                    <h2 class="la-header">SEDAS manager settings</h2>
                    <p class="text mt-1">NOTE: Changes will be activated after restart</p>
                    <div id="settings-content" class="ml-4 mt-3 flex flex-col gap-2">
                        <AccordionContent title="General Settings" class="l-header mb-1">
                          <hr></hr>
                          <p>TODO</p>
                        </AccordionContent>

                        <AccordionContent title="Controller Settings" class="l-header mb-1">
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

                        <AccordionContent title="Simulation Settings" class="l-header mb-1">
                          <hr></hr>
                          <p>TODO</p>
                        </AccordionContent>

                        <AccordionContent title="Plane Settings" class="l-header mb-1">
                          <hr></hr>
                          <p>TODO</p>
                        </AccordionContent>

                        <AccordionContent title="Environment Settings" class="l-header mb-1">
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


  let path_to_sedas_icon = `${Vars.PATH_TO_ICNS}/sedas-manager-logo.png`

  return (
      <>
        <div class="flex h-full items-center justify-center">
          <div>
            <img src={path_to_sedas_icon} class="img-resource w-full mx-auto block"></img>
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
  let path_to_sedas_icon = `${Vars.PATH_TO_ICNS}/sedas-manager-logo.png`

  return (
    <>
      <div class="flex h-full items-center justify-center">
        <div>
          <img src={path_to_sedas_icon} class="img-resource w-full mx-auto block"></img>
          <h2 class="l-header text-center">Exiting App, please wait ...</h2>
        </div>
      </div>
    </>
  )
}

function Load() {
  let path_to_sedas_icon = `${Vars.PATH_TO_ICNS}/sedas-manager-logo.png`

  return (
    <>
      <div class="flex h-full items-center justify-center">
        <div>
          <img src={path_to_sedas_icon} class="img-resource w-full mx-auto block"></img>
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
          <h2 class="s-header text-center mb-1">Popup header</h2>
          <p class="text text-center mb-1">Proceed?</p>
          <div id="popup-content"></div>
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
  Settings
}
