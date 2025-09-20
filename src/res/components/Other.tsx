import { createSignal } from 'solid-js'
import { Vars, IPCWrapper } from './utils'

function Main() {
  const menu_onclick = () => IPCWrapper.send_message("menu", "redirect-to-main")

  const settings_onclick = () => IPCWrapper.send_message("menu", "redirect-to-settings")

  const restore_sim = () => IPCWrapper.send_message("menu", "restore-sim")


  let path_to_sedas_icon = `${Vars.PATH_TO_ICNS}/sedas-manager-logo.png`

  return (
      <>
        <div class="flex items-center justify-center">
          <div>
            <img src={path_to_sedas_icon} class="img-resource w-full mx-auto block"></img>
            <h2 class="l-header text-center">SEDAS manager</h2>
            <p class="text text-center">An out-of-the-box ATC simulator</p>
            <button class="btn-primary me-1" onclick={menu_onclick}>Start</button>
            <button class="btn-primary me-1" onclick={settings_onclick}>Settings</button>
            <button class="btn-primary disabled" onclick={restore_sim}>Reload last session</button>
          </div>
        </div>
      </>
  )
}

function Exit() {
  return (
    <></>
  )
}

function Load() {
  return (
    <></>
  )
}

function Popup() {
  return (
    <></>
  )
}

export { 
  Main,
  Exit,
  Load,
  Popup
}
