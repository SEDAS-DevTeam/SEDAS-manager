/*
    Unifying library for SEDAS main files
*/

//glob imports
import fs from "fs";
import path from "path"
import { Worker } from "worker_threads"
import { app, Rectangle, App } from "electron";
import { spawn } from "node:child_process"

//relative imports
import { Plane, PlaneDB } from "../plane_functions"
import { EventLogger } from "../logger"
import { Environment, parse_scale } from "../environment"

import utils from "../app_utils"
import {PluginRegister} from "../plugin_register" // TODO

import {
  //window configs
  main_menu_dict,
  exit_dict,
  popup_widget_dict,
  load_dict,
  settings_dict,

  //window classes
  Window,
  PopupWindow,

  //window handler classes
  WidgetWindowHandler,
  
  JsonData,
  MainAppInterface,

  //html resource paths
  PATH_TO_MAIN_HTML,
  PATH_TO_EXIT_HTML,
  PATH_TO_POPUP_HTML,
  
  //local storage paths
  PATH_TO_PLUGINS,
  PATH_TO_MODULES,
  PATH_TO_LOGS,

  PATH_TO_MSC,
  PATH_TO_INSTALLER,
  PATH_TO_SETTINGS,
  PATH_TO_BACKUP,
    
  DisplayObject,
  MonitorInfo,
  Coords,
  OSBridgeInterface,
  WorkerType,
  ScenarioPreset,
  MapPreset,
  CommandPreset,
  AircraftPreset,
  PresetList
} from "../app_config"

import {
  MSCwrapper,
  IPCwrapper
} from "../app_comm"

import {
  ProgressiveLoader,
  ListenerSetup,
  FrontendRouter,
  FrontendHandlers
} from "../app_state"

//C++ (N-API) imports
import { main } from "../bind";
import { env } from "node:process"

// Basically another abstraction to handle OS-level stuff
class OSBridge implements OSBridgeInterface { // TODO: Currently only working for linux X11 or Wayland
  private platform: string = process.platform
  private os_info: Record<string, any> | undefined = undefined
  
  /*
  OS-specific vars
  */
  // Linux
  private session_type: string | undefined = process.env.XDG_SESSION_TYPE
  private compatibility_layer: string = (process.argv.includes("--ozone-platform=x11") ? "xwayland" : "")
  
  public get_info() {
    this.os_info = {
      platform: this.platform,
      session: this.session_type
    }
    return this.os_info
  }
  
  public check_env() {
    let env_fixes: string[] = []
    
    // Check for wayland (if yes, reload to XWayland compatibility layer - TODO: Change later on)
    if (this.platform == "linux" &&
        this.session_type == "wayland" &&
        this.compatibility_layer == "xwayland") {
          env_fixes.push("reload-with-x11")
    }
    // TODO: more things later on
    return env_fixes
  }
  
  public constructor() {
  }
}

export class MainApp implements MainAppInterface{

  /*
      Variables + app internal states
  */
  public app_instance: App = app; // Electron app object
  public app_abs_path: string = ""; // App absolute path in the system
  public os_bridge!: OSBridge
  public os_info!: Record<string, string>;

  // App internal mechanisms
  public wrapper!: IPCwrapper; // IPC wrapper (wrapping all the Inter-Process-Communication in the app)
  public loader!: ProgressiveLoader | undefined; // Loader class to check-out different loading states of app
  public logger!: EventLogger; // Event logger to log everything possible about app running
  public widget_handler!: WidgetWindowHandler; // Handles all the widget windows that do get spawned along the simulation
  public msc_wrapper!: MSCwrapper; // Wrapper handling Module-Socket-Communication in the app
  public plugin_register!: PluginRegister;
  public listeners!: ListenerSetup;
  public frontend_router!: FrontendRouter;
  public frontend_handlers!: FrontendHandlers;
  
  // Window instances
  public mainMenuWindow: Window | undefined = undefined;
  public settingsWindow: Window | undefined = undefined;
  public controllerWindow: Window | undefined = undefined;
  public exitWindow: Window | undefined = undefined;
  
  public enviro!: Environment
  public enviro_logger!: EventLogger;

  //app status (consists of switches/booleans for different functions 
  //  => written in dict for better arg passing to funcs + better readibility
  public app_status: Record<string, boolean> = {
      "internet-connection": false, //switch for internet connectivity and how to handle it in code
      "turn-on-backend": true,      //
      "backup-db-on": true,         //
      "app-running": true,          //
      "sim-running": false,         //
      "redir-to-main": false        //
  }
  //all variables related to frontend
  public frontend_vars: object = {
      "controller_mon": {},
      "controller_set": {},
      "controller_sim": {},
      "wiki": {},
      "glob": {} //variables used across windows
  } //used to save variables that are then used on redirect between windows
  public app_settings: Record<string, any> = {}; // settings object that is later used when App reads from user settings
  public backup_worker!: Worker;
  
  // variables containing "low-level" functionalities
  public dev_panel: boolean | undefined = undefined;
  public workers: WorkerType[] = [];
  public worker_coords: object[] = [];
  public selected_plugin_id!: string;
  public current_popup_window: PopupWindow | undefined; //For now, app only permits one popup window at the time (TODO)
  public backupdb_saving_frequency: number = 1000; //set to 1 second by default (what, why TODO)
  public local_plugin_list!: object[];
  public monitor_info!: MonitorInfo<DisplayObject[], DisplayObject>;
  
  //environment/map variables
  public map_configs_list: object[] = [];
  public map_data!: MapPreset;
  public map_name: string = "None";
  public scenario_presets_list: ScenarioPreset[] = []
  public scenario_data: any = undefined;
  public scenario_name: string = "None";
  
  public scale!: number;
  public longitude: number | undefined = undefined;
  public latitude: number | undefined = undefined;
  public zoom: number | undefined = undefined;
  
  //all variables related to commands
  public command_presets_list: PresetList = []
  public command_preset_data: CommandPreset | undefined = undefined;
  public command_preset_name: string = "None"
  
  //all variables related to aircrafts
  public aircraft_presets_list: PresetList = []
  public aircraft_preset_data: AircraftPreset | undefined = undefined;
  public aircraft_preset_name: string = "None";
  public PlaneDatabase: PlaneDB | undefined = undefined;
  
  // assigning all imported dict templates to MainApp class
  public main_menu_config: object = main_menu_dict
  public exit_config: object = exit_dict
  public popup_widget_config: object = popup_widget_dict
  public load_config: object = load_dict
  public settings_config: object = settings_dict
  
  /*
      Other functions
  */
  
  public create_popup_window(
    event_logger: EventLogger,
    type: string,
    channel: string,
    header: string,
    text: string
  ) {
  
    let coords: Coords<number, number> = utils.calculate_center(
      popup_widget_dict.width,
      popup_widget_dict.height,
      this.monitor_info[1].center[0],
      this.monitor_info[1].center[1]
    )
    let temp_popup_window: PopupWindow = new PopupWindow(popup_widget_dict,
                                                        PATH_TO_POPUP_HTML,
                                                        coords,
                                                        event_logger,
                                                        type,
                                                        channel)
    temp_popup_window.load_popup(header, text)
    return temp_popup_window
  }
  
  public run_updater(path: string, app_abs_path: string){
    return new Promise<boolean>((resolve, reject) => {
      let updater = spawn(path, [app_abs_path], { shell: true })
      updater.stdout.pipe(process.stdout)

      updater.stdout.on("data", (data) => {
        process.stdout.write(data);
      });

      updater.stderr.on("data", (data) => {
        process.stderr.write(data); // this helps with debugging
      });

      updater.on("close", (code) => {
          if (code == 0){
            // internet is available
            resolve(true)
          }
          else if (code == 1){
            resolve(false)
          }
          else{
            reject(new Error(`Updater failed with code ${code}`))
          }
      })

      updater.on("error", (err) => {
        reject(err);
      });
    })    
  }
  
  public setup_environment(){
    if (this.loader != undefined){
      this.enviro.setup_enviro()
      this.loader.destroy_loaders()
      this.loader = undefined
    }
    
    //everything is set up, time to load
    this.wrapper.broadcast("workers", "ask-for-render", []) //send workers command to fire "render-map" event
    
    //registering & rendering widget workers (TODO: disabling for now -> for demonstration purposes)
    //this.widget_handler.setup_all(this.worker_coords, EvLogger)
    //this.widget_handler.show_all()
  }
  
  /*
      /App phase functions (init/main/exit)
  */
  public async init_app(){

      // setup IPC wrapper
      this.wrapper = new IPCwrapper()

      // set progressive loader object on loaders
      this.loader = new ProgressiveLoader(this.app_settings, this.monitor_info, load_dict, this.logger)
      this.loader.setup_loader(7, "SEDAS is loading, please wait...", "Initializing app")

      // set other important segments on MainApp
      this.widget_handler = new WidgetWindowHandler()

      this.logger.log("DEBUG", "APP-INIT")

      /*
          Loader segment 7 (rest of segments are in update_all)
      */
      this.loader.send_progress("Setting all backend processes")

      //workers
      if (this.app_settings["backend_init"]){
          this.logger.log("DEBUG", "Starting Backend because flag backend_init is true")

          var backend_settings = { // settings only to be passed to backend
              "noise": this.app_settings["noise"],
              "abs_path": process.env.ABS_PATH
          }

          this.msc_wrapper = new MSCwrapper(PATH_TO_MSC, backend_settings, PATH_TO_MODULES)
      }
      else{
          this.app_status["turn-on-backend"] = false
          this.logger.log("DEBUG", "Not starting Backend because flag backend_init is false")
      }
      this.backup_worker = new Worker(PATH_TO_BACKUP)
      
      //backup saving frequency
      if (this.app_settings["saving_frequency"].includes("min")){
          this.backupdb_saving_frequency = parseInt(this.app_settings["saving_frequency"].charAt(0)) * 60 * 1000
      }
      else if (this.app_settings["saving_frequency"].includes("hour")){
          this.backupdb_saving_frequency = parseInt(this.app_settings["saving_frequency"].charAt(0)) * 3600 * 1000
      }
      else if (this.app_settings["saving_frequency"].includes("never")){
          this.app_status["backup-db-on"] = false
          //by default set to 5 mins
          this.backupdb_saving_frequency = 5 * 60 * 1000
      }

      this.logger.log("DEBUG", `BackupDB saving frequency is set to ${this.backupdb_saving_frequency / 1000} seconds`)

      // load all modules
      this.loader.send_progress("Loading SEDAS modules")
      // TODO: load all modules using MSC :)

      // setup plugin register
      this.plugin_register = new PluginRegister(PATH_TO_PLUGINS)

      /*
          Loader segment 10
      */
      this.loader.send_progress("Loading local plugins")

      this.logger.log("DEBUG", "Loading local plugins")
  }

  public init_gui(){
    if (this.loader === undefined){
        this.logger.log("WARN", "Loader undefined, not going further...")
        return;
    }

    this.loader.send_progress("Initializing GUI")
    this.logger.log("DEBUG", "Get display coords info for better window positioning")

    // calculate x, y
    let coords: Coords<number, number> = utils.calculate_center(
      main_menu_dict.width,
      main_menu_dict.height,
      this.monitor_info[1].center[0],
      this.monitor_info[1].center[1]
    )

    this.loader.destroy_loaders()
    this.loader = undefined

    this.logger.log("DEBUG", "main-menu show")
    this.mainMenuWindow = new Window(this.app_status, this.dev_panel, main_menu_dict, PATH_TO_MAIN_HTML, coords, this.logger, this)
    this.wrapper.register_window(this.mainMenuWindow, "main-menu")
    this.mainMenuWindow.show()
  }
  
  public async main_app(backup_db: object | undefined = undefined) {
    if (this.mainMenuWindow === undefined || this.controllerWindow === undefined) return
    
    this.mainMenuWindow.close()
    this.wrapper.unregister_window(this.mainMenuWindow.window_id)

    this.workers = []

    // spawning worker & controller windows    
    utils.align_windows(
      this.monitor_info,
      this,
      this.logger,
      this.app_settings["controller_loc"]
    )
    
    //setting all windows to show()
    for (let i = 0; i < this.workers.length; i++) {
      this.workers[i]["win"].show()
      this.workers[i]["win"].checkClose()
    }

    this.controllerWindow.show()

    // other modules (backup, backend) check
    if (this.app_status["turn-on-backend"]) {
      //setup voice recognition and ACAI backend
      this.msc_wrapper.send_message("action", "debug", this.app_settings["logging"])
    }

    if (backup_db) {
      /*
      //set scale of map
      this.scale = parse_scale(backup_db["map"]["scale"])

      this.map_name = backup_db["map-name"]
       */
    }

    //run local plane DB
    this.PlaneDatabase = new PlaneDB(this.workers);
    if (backup_db) {
      /*
      //run if backup db is avaliable
      this.app_status["redir-to-main"] = true

      for (let i = 0; i < backup_db["planes"].length; i++){
        //get monitor-type spawn
        let monit_type: string = "";
        for (let i2 = 0; i2 < backup_db["monitor-planes"].length; i2++){
          if (backup_db["monitor-planes"][i2]["planes_id"].includes(backup_db["planes"][i2]["id"])){
            monit_type = backup_db["monitor-planes"][i2]["type"]
            break
          }
        }

        let curr_plane_id = utils.generate_hash()
        let plane = new Plane(curr_plane_id, backup_db["planes"][i]["callsign"], 
                backup_db["planes"][i]["heading"], backup_db["planes"][i]["updated_heading"],
                backup_db["planes"][i]["level"], backup_db["planes"][i]["updated_level"],
                backup_db["planes"][i]["speed"], backup_db["planes"][i]["updated_speed"],
                backup_db["planes"][i]["departure"], backup_db["planes"][i]["arrival"], 
                backup_db["planes"][i]["arrival_time"],
                backup_db["planes"][i]["x"], backup_db["planes"][i]["y"])

        this.PlaneDatabase.add_record(plane, monit_type)
      }

      //send reloaded plane database to all windows
      this.enviro.broadcast_planes(
        this.PlaneDatabase.DB,
        this.PlaneDatabase.monitor_DB,
        this.PlaneDatabase.plane_paths_DB)
      //controllerWindow.send_message("init-info", ["window-info", map_name, JSON.stringify(workers), map_config, JSON.stringify(app_settings)])
    */
    }
  }
  
  // Reload wrapper (used when needed to respawn process for OS compatibility)
  public reload(env_arg: string[]) {
    if (env_arg.length != 0) {
      let default_args = process.argv.slice(1)
      let additional_args: string[] = []
      
      env_arg.forEach((arg) => {
        switch (arg) {
          case "reload-with-x11":
            additional_args.push("--ozone-platform=x11")
            break
        }
      })
      
      const child = spawn(process.execPath, [
        ...default_args,
        ...additional_args
      ], {
        detached: true,
        stdio: "inherit"
      })
      
      child.unref()
      this.exit_app()
    }
  }
  
  public async exit_app() {
    // calculating x, y
    let coords: Coords<number, number> = utils.calculate_center(
      exit_dict.width,
      exit_dict.height,
      this.monitor_info[1].center[0],
      this.monitor_info[1].center[1]
    )
    
    //spawning info window
    this.exitWindow = new Window(this.app_status, this.dev_panel, exit_dict, PATH_TO_EXIT_HTML, coords, this.logger, this)
    this.exitWindow.show()

    this.app_status["app-running"] = false; //stopping all Interval events from firing

    if (this.enviro != undefined){
      this.logger.log("DEBUG", "terminating environment")
      this.enviro.kill_enviro()
    }

    if (this.app_status["turn-on-backend"]){
      //disable voice recognition and ACAI backend
      this.logger.log("DEBUG", "stopping SEDAS modules")
      

      this.msc_wrapper.send_message("module", "ai_backend", "unregister-all")
      await utils.sleep(1000) // TODO: find better way than this
      this.msc_wrapper.send_message("action", "stop")
      await utils.sleep(1000) // TODO: find better way than this

      //stop backend worker
      this.logger.log("DEBUG", "terminating backend worker")
      this.msc_wrapper.terminate()
    }
    this.logger.log("DEBUG", "terminating database worker")
    this.backup_worker.terminate()

    this.logger.log("DEBUG", "Closing app... Bye Bye")
    this.logger.end()
    app.exit(0)
  }

  public constructor(app_abs_path: string){
    this.app_abs_path = app_abs_path

    app.on("ready", async () => {
      // Initialize OS-Bridge to set-up OS-specific settings
      this.os_bridge = new OSBridge()
      let env_fixes = this.os_bridge.check_env() // Check if everything is set-up correctly on OS-level
      this.reload(env_fixes) // Reload app if needed
      
      // Proceed with OS info collection (for additional tweaking)
      this.os_info = this.os_bridge.get_info()
  
      //read app settings
      this.app_settings = utils.read_file_content(PATH_TO_SETTINGS)
      
      // set dev_panel inner state variable
      this.dev_panel = this.app_settings["debug_panel"] as boolean

      // setup app event logger
      this.logger = new EventLogger(this.app_settings["logging"], "app_log", "system", "v1.0.0")
      await this.logger.delete_logs() // delete any previously created logs
      await this.logger.init_logger()
      
      // Get monitor info
      let retrieved_monit_info: MonitorInfo<DisplayObject[], DisplayObject> | undefined = utils.get_monitor_info(this.app_settings["controller_loc"])
      if (retrieved_monit_info === undefined) return // invalid settings // TODO
      this.monitor_info = retrieved_monit_info
      
      // test that C++ addons loaded successfully
      main.test_modules()
      this.logger.log("DEBUG", "Addons loaded successfully")

      //check internet connectivity & run independent updater
      this.app_status["internet-connection"] = await this.run_updater(PATH_TO_INSTALLER, this.app_abs_path)

      await this.init_app() //initializing backend for app
      
      this.init_gui() //initializing gui for app
      
      // Initializing other components (FrontendRouter, etc.)
      this.frontend_router = new FrontendRouter(this, this.monitor_info)
      this.frontend_handlers = new FrontendHandlers(this)
      
      //initializing all listeners for app
      this.listeners = new ListenerSetup(this)
      this.listeners.add_listener_backend()
      this.listeners.add_listener_IPC()
      this.listeners.add_listener_intervals()
      this.listeners.add_listener_backup()
    })
  }
}