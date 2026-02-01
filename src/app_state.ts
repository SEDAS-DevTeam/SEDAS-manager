/*
  App state functions defined in this code, used for inner state management handling all the frontend routing
*/

import utils from "./app_utils"
import {
  //window configs
  main_menu_dict,
  settings_dict,
  exit_dict,
  popup_widget_dict,
  load_dict,

  // interfaces
  ProgressiveLoaderInterface,
  EventLoggerInterface,
  MainAppInterface,
  FrontendRouterInterface,
  
  //window classes
  Window,
  LoaderWindow,

  //window handler classes
  WidgetWindowHandler,

  //html resource paths
  PATH_TO_MAIN_HTML,
  PATH_TO_EXIT_HTML,
  PATH_TO_POPUP_HTML,
  PATH_TO_WORKER_HTML,
  PATH_TO_DEP_ARR_HTML,
  PATH_TO_EMBED_HTML,
  PATH_TO_WEATHER_HTML,
  PATH_TO_LOADER_HTML,
  PATH_TO_SETTINGS_HTML,
  
  //local storage paths
  PATH_TO_PLUGINS,
  PATH_TO_MODULES,
  PATH_TO_MAPS,
  PATH_TO_AIRCRAFTS,
  PATH_TO_COMMANDS,

  PATH_TO_MSC,
  PATH_TO_INSTALLER,
  PATH_TO_SETTINGS,
  PATH_TO_SETTINGS_LAYOUT,
  PATH_TO_BACKUP,
  
  Coords,
  DisplayObject,
  MonitorInfo,
  ListenerSetupInterface,
  FrontendHandlersInterface
} from "./app_config"

import {
  Environment,
  
  start_sim,
  stop_sim,
  start_mic_record,
  stop_mic_record,
  restore_sim,
  regenerate_map,
  parse_scale,
} from "./environment"

import { EventLogger } from "./logger"

import fs from "fs"

import {
  spawn_plane,
  plane_delete_record,
  plane_value_change,
  send_plane_data
} from "./plane_functions"

import {
  install_plugin,
  get_plugin_list,
  confirm_install
} from "./plugin_register"

//
// ProgressiveLoader to handle graceful App loading on sim load
// 

export class ProgressiveLoader implements ProgressiveLoaderInterface{
    /*
        Loader class used for loading any stuff in GUI (involves spawning windows too)
    */
    private loaders: any[] = [];
    private app_settings: any;
    private displays: DisplayObject[]
    private load_dict: any;
    private ev_logger: EventLoggerInterface;
    public num_segments: number = 0;
    public curr_n_segments: number = 0;

    public async setup_loader(n_segments: number, loader_header: string,
        first_message: string
    ){
        this.set_loader_win()
        await this.show_loader_win()
        this.initial_set(n_segments, loader_header, first_message)
    }

    private set_loader_win(){
      //getting window info to spawn load on all monitors && initialize all loaders
      for (let i = 0; i < this.displays.length; i++){
        let coords: Coords<number, number> = utils.calculate_center(
          load_dict.width,
          load_dict.height,
          this.displays[i].center[0],
          this.displays[i].center[1]
        )
        
        //creating loading window
        let LoadingWindow = new LoaderWindow(
          this.load_dict,
          PATH_TO_LOADER_HTML,
          coords!,
          this.ev_logger,
          this.displays[i].size)
        this.loaders.push(LoadingWindow)
      }
    }

    private async show_loader_win(){
        //showing all loaders, going to progressively send them data
        for(let i = 0; i < this.loaders.length; i++){
            this.loaders[i].show()
            await this.loaders[i].wait_for_load(() => {
                this.ev_logger.log("DEBUG", `loader${i} loaded`)
            })
        }
    }

    private initial_set(n_segments: number, loader_header: string, first_message: string){
        this.num_segments = n_segments
        for (let i = 0; i < this.loaders.length; i++){
            this.loaders[i].send_message("setup", [this.num_segments, loader_header, first_message])
        }
    }

    public send_progress(message: string){
        for (let i = 0; i < this.loaders.length; i++){
            this.loaders[i].send_message("progress", [message])
        }
    }

    public destroy_loaders(){
        for (let i = 0; i < this.loaders.length; i++){
            this.loaders[i].close()
        }
        this.loaders = []
    }

    public constructor(app_settings: any, monitor_info: MonitorInfo<DisplayObject[], DisplayObject>, load_dict: any, event_logger: EventLoggerInterface){
        this.app_settings = app_settings
        this.displays = monitor_info[0]
        this.load_dict = load_dict
        this.ev_logger = event_logger
    }
}

//
// App Frontend redirecting (to menu/main app/simulation)
//

export class FrontendRouter implements FrontendRouterInterface{
  private main_app: MainAppInterface;
  private monitor_info: MonitorInfo<DisplayObject[], DisplayObject>;
  
  public redirect_to_menu(window_type: string){
    this.main_app.app_status["redir-to-main"] = false
  
    //message call to redirect to main menu
    this.main_app.logger.log("DEBUG", "redirect-to-menu event")
  
    if (window_type == "settings"){
      this.main_app.settingsWindow.close()
      this.main_app.wrapper.unregister_window(this.main_app.settingsWindow.window_id)
    }
    else if (window_type == "controller"){
      this.main_app.controllerWindow.close()
      this.main_app.wrapper.unregister_window(this.main_app.controllerWindow.window_id)
  
      for (let i = 0; i < this.main_app.workers.length; i++){
          this.main_app.workers[i]["win"].close()
          this.main_app.wrapper.unregister_window(this.main_app.workers[i]["win"].window_id)
      }
  
      this.main_app.widget_handler.exit_all(this.main_app.wrapper)
    }
  
    //calculate x, y
    let coords: Coords<number, number> = utils.calculate_center(
      main_menu_dict.width,
      main_menu_dict.height,
      this.monitor_info[1].center[0],
      this.monitor_info[1].center[1]
    )
  
    this.main_app.logger.log("DEBUG", "main-menu show")
    this.main_app.mainMenuWindow = new Window(
      this.main_app.app_status,
      this.main_app.dev_panel,
      main_menu_dict, 
      PATH_TO_MAIN_HTML,
      coords,
      this.main_app.logger,
      this
    )
    this.main_app.wrapper.register_window(this.main_app.mainMenuWindow, "main-menu")
  
    this.main_app.mainMenuWindow.show()
    
    this.main_app.workers = []
    this.main_app.controllerWindow = undefined
    this.main_app.PlaneDatabase = undefined
  }
  
  public redirect_to_settings(){
    //message call to redirect to settings
    this.main_app.app_status["redir-to-main"] = true
  
    this.main_app.logger.log("DEBUG", "redirect-to-settings event")
  
    this.main_app.mainMenuWindow.close()
    this.main_app.wrapper.unregister_window(this.main_app.mainMenuWindow.window_id)
  
    //calculate x, y
    let coords: Coords<number, number> = utils.calculate_center(
      settings_dict.width,
      settings_dict.height,
      this.monitor_info[1].center[0],
      this.monitor_info[1].center[1]
    )
  
    this.main_app.logger.log("DEBUG", "settings show")
    this.main_app.settingsWindow = new Window(
      this.main_app.app_status,
      this.main_app.dev_panel,
      settings_dict,
      PATH_TO_SETTINGS_HTML,
      coords,
      this.main_app.logger,
      this,
      "settings",
      this.monitor_info[1].size
    )
    this.main_app.wrapper.register_window(this.main_app.settingsWindow, "settings")
    
    this.main_app.settingsWindow.show()
  }
  
  public redirect_to_main(){
    //message call to redirect to main program (start)
    this.main_app.app_status["redir-to-main"] = true
    this.main_app.main_app(undefined) // TODO: what the fuck
  }
  
  public constructor(app: MainAppInterface, monit_info: MonitorInfo<DisplayObject[], DisplayObject>){
    this.main_app = app
    this.monitor_info = monit_info
  }
}

//
// Event-listener initializator
//

export class ListenerSetup implements ListenerSetupInterface{
  private main_app: MainAppInterface;
  
  public add_listener_backend(){
      //backend-worker events
      if (this.main_app.app_status["turn-on-backend"]){
          this.main_app.msc_wrapper.set_listener((message: string[]) => {
              if (message[0] == "channels"){
                  // check which channels are permitted to send messages
                  this.main_app.msc_wrapper.enabled_channels = JSON.parse(message[1])
              }
              else if (message[0] == "module"){
                  let msg_command: string[] = JSON.parse(message[1])
                  if (msg_command[0] == "sedas_ai"){
                      let callsign: string = msg_command[1];
                      let value: string = msg_command[2];
                      let command: string = msg_command[3];
  
                      // update plane status
                      plane_value_change(this.main_app, [command, value, callsign])
                  }
              }
          })
      }
  }
  
  public add_listener_backup(){
    //database worker events
    this.main_app.backup_worker.on("message", (message: string) => {
      if (Array.isArray(message)){
        switch(message[0]){
          case "db-data":
            var database_data = JSON.parse(message[1])
            this.main_app.map_data = database_data["map"]

            this.main_app.main_app(database_data) //start main app on backup restore
            break
        }
      }
    })
  }
  
  public add_listener_IPC(){
    //IPC listeners
  
    this.main_app.wrapper.register_channel("redirect-to-menu", ["controller"], "unidirectional", () => this.main_app.frontend_router.redirect_to_menu("controller"))
    this.main_app.wrapper.register_channel("redirect-to-menu", ["settings"], "unidirectional", () => this.main_app.frontend_router.redirect_to_menu("settings"))
    this.main_app.wrapper.register_channel("redirect-to-settings", ["menu"], "unidirectional", () => this.main_app.frontend_router.redirect_to_settings())
    this.main_app.wrapper.register_channel("redirect-to-main", ["menu"], "unidirectional", () => this.main_app.frontend_router.redirect_to_main())
  
    this.main_app.wrapper.register_channel("save-settings", ["menu"], "unidirectional", (data: any[]) => this.main_app.frontend_handlers.save_settings(data))
    this.main_app.wrapper.register_channel("monitor-change-info", ["controller"], "unidirectional", (data: any[]) => this.main_app.frontend_handlers.monitor_change_info(data))
    this.main_app.wrapper.register_channel("exit", ["worker", "controller"], "unidirectional", () => this.main_app.exit_app())
    
    this.main_app.wrapper.register_channel("ping", ["controller", "settings", "embed"], "bidirectional", (data: any[]) => this.main_app.frontend_handlers.ping(data))
    
    //send app configuration to controller
    this.main_app.wrapper.register_channel("send-info", ["controller"], "bidirectional", () => this.main_app.frontend_handlers.send_info("controller"))
    this.main_app.wrapper.register_channel("send-info", ["worker"], "bidirectional", () => this.main_app.frontend_handlers.send_info("worker"))
    this.main_app.wrapper.register_channel("send-info", ["settings"], "bidirectional", () => this.main_app.frontend_handlers.send_info("settings"))
  
    //environment invokes
    this.main_app.wrapper.register_channel("start-sim", ["controller", "worker"], "unidirectional", () => start_sim())
    this.main_app.wrapper.register_channel("stop-sim", ["controller", "worker"], "unidirectional", () => stop_sim())
    this.main_app.wrapper.register_channel("start-mic", ["worker"], "unidirectional", () => start_mic_record())
    this.main_app.wrapper.register_channel("stop-mic", ["worker"], "unidirectional", () => stop_mic_record())
    this.main_app.wrapper.register_channel("restore-sim", ["controller"], "unidirectional", () => restore_sim())
    this.main_app.wrapper.register_channel("regenerate-map", ["controller"], "unidirectional", () => regenerate_map())
  
    this.main_app.wrapper.register_channel("set-environment", ["controller"], "unidirectional", (data: any[]) => this.main_app.frontend_handlers.set_environment(data))
    this.main_app.wrapper.register_channel("json-description", ["controller"], "bidirectional", (data: any[]) => this.main_app.frontend_handlers.json_description(data))
  
    this.main_app.wrapper.register_channel("render-map", ["controller", "worker"], "unidirectional", () => this.main_app.frontend_handlers.render_map())
    this.main_app.wrapper.register_channel("get-points", ["controller"], "bidirectional", (data: any[]) => this.main_app.frontend_handlers.get_points(data))
    this.main_app.wrapper.register_channel("map-check", ["controller"], "bidirectional", () => this.main_app.frontend_handlers.map_check())
    this.main_app.wrapper.register_channel("send-location-data", ["weather"], "unidirectional", () => this.main_app.frontend_handlers.send_location_data())
  
    //plane invokes
    this.main_app.wrapper.register_channel("spawn-plane", ["controller"], "unidirectional", (data: any[]) => spawn_plane(this.main_app, data))
    this.main_app.wrapper.register_channel("plane-value-change", ["controller"], "unidirectional", (data: any[]) => plane_value_change(this.main_app, data))
    this.main_app.wrapper.register_channel("plane-delete-record", ["controller"], "unidirectional", (data: any[]) => plane_delete_record(this.main_app, data))
    this.main_app.wrapper.register_channel("send-plane-data", ["dep_arra"], "unidirectional", () => send_plane_data(this.main_app))
    
    //widget invokes
    this.main_app.wrapper.register_channel("min-widget", ["worker-widget"], "unidirectional", (data: any[]) => this.main_app.widget_handler.minimize_widget(data))
    this.main_app.wrapper.register_channel("max-widget", ["worker-widget"], "unidirectional", (data: any[]) => this.main_app.widget_handler.maximize_widget(data))
    this.main_app.wrapper.register_channel("exit-widget", ["worker-widget"], "unidirectional", (data: any[]) => this.main_app.widget_handler.exit_widget(data, this.main_app.wrapper))
  
    //plugin invokes
    this.main_app.wrapper.register_channel("install-plugin", ["controller"], "unidirectional", (data: any[]) => install_plugin(this.main_app, data))
    this.main_app.wrapper.register_channel("get-plugin-list", ["controller"], "bidirectional", (data: any[]) => get_plugin_list(this.main_app))
  
    //confirm invokes
    this.main_app.wrapper.register_channel("confirm-install", ["popup"], "unidirectional", (data: any[]) => confirm_install(this.main_app, data))
    this.main_app.wrapper.register_channel("confirm-settings", ["popup"], "unidirectional", () => this.main_app.frontend_handlers.confirm_settings())
    this.main_app.wrapper.register_channel("confirm-schedules", ["popup"], "unidirectional", () => this.main_app.frontend_handlers.confirm_schedules())
  
    //other invokes
    this.main_app.wrapper.register_channel("send-scenario-list", ["controller"], "bidirectional", (data: any[]) => this.main_app.frontend_handlers.send_scenario_list(data))
    this.main_app.wrapper.register_channel("rewrite-frontend-vars", ["controller"], "unidirectional", (data: any[]) => this.main_app.frontend_handlers.rewrite_frontend_vars(data))
  
    //setting all listeners to be active
    this.main_app.wrapper.set_all_listeners()
  }
 
  public add_listener_intervals(){
      //disable intervals on app exit
      try {
          if (this.main_app.app_status["app-running"]){
              //update all planes on one second
              setInterval(() => {
                  if (this.main_app.PlaneDatabase != undefined && this.main_app.map_data != undefined && this.main_app.workers.length != 0){
                      if (this.main_app.app_status["sim-running"]){
                          this.main_app.PlaneDatabase.update_planes(this.main_app.scale, 
                                          parseFloat(this.main_app.app_settings["std_bank_angle"]), 
                                          parseFloat(this.main_app.app_settings["standard_pitch_up"]), 
                                          parseFloat(this.main_app.app_settings["standard_pitch_down"]),
                                          parseFloat(this.main_app.app_settings["standard_accel"]), 
                                          parseInt(this.main_app.app_settings["plane_path_limit"]))
                      }
                      if (this.main_app.app_status["app-running"]){
                          //send updated plane database to all
                          this.main_app.enviro.broadcast_planes(this.main_app.PlaneDatabase.DB, this.main_app.PlaneDatabase.monitor_DB, this.main_app.PlaneDatabase.plane_paths_DB)
                      }
                  }
              }, 1000)
  
              //send updated time to all workers
              setInterval(() => {
                  if (this.main_app.enviro != undefined && this.main_app.app_status["sim-running"]){
                      //send date & time to frontend
                      this.main_app.wrapper.broadcast("workers", "time", [this.main_app.enviro.current_time])
                  }
              }, 1000)
  
              //send plane data to backend
              setInterval(() => {
                  if (this.main_app.app_status["turn-on-backend"]){
                      if (this.main_app.PlaneDatabase == undefined){
                          this.main_app.msc_wrapper.send_message("module", "ai_backend", "data", [])
                      }
                      else{
                          this.main_app.msc_wrapper.send_message("module", "ai_backend", "data", this.main_app.PlaneDatabase.DB)
                      }
                  }
              }, 500)
  
              //on every n minutes, save to local DB if app crashes
              setInterval(() => {
                  if (this.main_app.app_status["backup-db-on"] && (this.main_app.PlaneDatabase != undefined) && (this.main_app.map_data != undefined) && (this.main_app.workers.length != 0)){
                      let simulation_dict = {
                          "planes": this.main_app.PlaneDatabase.DB,
                          "monitor-planes": this.main_app.PlaneDatabase.monitor_DB,
                          "monitor-data": this.main_app.workers,
                          "map": this.main_app.map_data,
                          "map-name": this.main_app.map_name,
                          "command-preset": this.main_app.command_preset_data,
                          "command-preset-name": this.main_app.command_preset_name,
                          "aircraft-preset": this.main_app.aircraft_preset_data,
                          "aircraft-preset-name": this.main_app.aircraft_preset_name
                      }
              
                      //save to local db using database.ts 
                      this.main_app.backup_worker.postMessage(["save-to-db", JSON.stringify(simulation_dict, null, 2)])
                      this.main_app.logger.log("DEBUG", "Saving temporary backup...")
                  }
              }, this.main_app.backupdb_saving_frequency)
          }
      }
      catch(error){
          this.main_app.logger.log("ERROR", "An error happened, written down below")
          this.main_app.logger.log("", error)
      }
  }
  
  public constructor(app: MainAppInterface) {
    this.main_app = app
  }
}

//
// Frontend handlers (Grouped in one class so that it is not that much of a hassle to manage them)
//

export class FrontendHandlers implements FrontendHandlersInterface{
  private main_app: MainAppInterface;

  public save_settings(data: any[]) {
    //save settings
    this.main_app.logger.log("DEBUG", "saving settings")
  
    fs.writeFileSync(PATH_TO_SETTINGS, data[0])
    
    //inform user that settings are loaded only after restart
    this.main_app.current_popup_window = this.main_app.create_popup_window(
      this.main_app.logger,
      "alert",
      "confirm-settings",
      "Saved the settings",
      "Restart the app for changes to take the effect")
  }
  
  public send_info(window_type: string){
      if (window_type == "settings"){
  
          //reading settings gui layouts
          let settings_layout = utils.read_file_content(PATH_TO_SETTINGS_LAYOUT)
  
          //sending app data and alg configs
          console.log("sending app data")
          //TODO: rework this...
          this.main_app.wrapper.send_message("settings", "app-data", [this.main_app.app_settings, settings_layout])
      }
      else if (window_type == "controller"){
          //sending monitor data
  
          //acquiring airport map data
          this.main_app.map_configs_list = []
          var map_files = utils.list_files(PATH_TO_MAPS)
          for (let i = 0; i < map_files.length; i++){
              let map = utils.read_file_content(PATH_TO_MAPS, map_files[i])
              if (map_files[i].includes("config")){
                  this.main_app.map_configs_list.push({
                      "hash": "airport-" + utils.generate_hash(),
                      "content": map
                  })
              }
          }
  
          //acquiring list of aircraft presets
          this.main_app.aircraft_presets_list = []
          let aircraft_files = utils.list_files(PATH_TO_AIRCRAFTS)
          for (let i = 0; i < aircraft_files.length; i++){
              let aircraft_config = utils.read_file_content(PATH_TO_AIRCRAFTS, aircraft_files[i])
              this.main_app.aircraft_presets_list.push({
                  "path": aircraft_files[i],
                  "hash": "aircraft-" + utils.generate_hash(),
                  "name": aircraft_config["info"]["name"],
                  "content": JSON.stringify(aircraft_config["all_planes"])
              })
          }
  
          //acquiring list of command presets
          this.main_app.command_presets_list = []
          let command_files = utils.list_files(PATH_TO_COMMANDS)
          for (let i = 0; i < command_files.length; i++){
              let commands_config = utils.read_file_content(PATH_TO_COMMANDS, command_files[i])
              this.main_app.command_presets_list.push({
                  "path": command_files[i],
                  "hash": "command-" + utils.generate_hash(),
                  "name": commands_config["info"]["name"],
                  "content": JSON.stringify(commands_config["commands"])
              })
          }
          this.main_app.wrapper.send_message("controller", "init-info", ["window-info", 
                                  JSON.stringify(this.main_app.workers), 
                                  this.main_app.map_configs_list, 
                                  JSON.stringify(this.main_app.app_settings), 
                                  [this.main_app.map_name, this.main_app.command_preset_name, this.main_app.aircraft_preset_name, this.main_app.scenario_name], 
                                  this.main_app.aircraft_presets_list, 
                                  this.main_app.command_presets_list, 
                                  this.main_app.frontend_vars, 
                                  this.main_app.app_status])
      }
      else if (window_type == "worker"){
          //send to all workers
          this.main_app.wrapper.broadcast("workers", "init-info", ["window-info", JSON.stringify(this.main_app.app_settings)])
      }
  }
  
  public send_scenario_list(data: any[]){
      //rewrite scenario presets lists
      this.main_app.scenario_presets_list = []
      console.log(data)
  
      let selected_map_data = utils.read_file_content(PATH_TO_MAPS, data[0])
      let scenarios = selected_map_data["scenarios"]
      if (scenarios == undefined){
          this.main_app.wrapper.send_message("controller", "scenario-list", [])
          return
      }
  
      for (let i = 0; i < scenarios.length; i++){
          this.main_app.scenario_presets_list.push({
              "hash": "scenario-" + utils.generate_hash(),
              "name": scenarios[i]["name"],
              "content": scenarios[i],
          })
      }
  
      this.main_app.wrapper.send_message("controller", "scenario-list", this.main_app.scenario_presets_list)
  }
  
  public set_environment(data: any[]){
      //getting map info, command preset info, aircraft preset info from user
      let filename_map = data[0]
                  
      //map addons
      let scenario_hash = data[3]
  
      let filename_command = data[1]
      let filename_aircraft = data[2]
  
      //save map data to variable
      this.main_app.map_data = utils.read_file_content(PATH_TO_MAPS, filename_map)
  
      //get scenario data
      for (let i = 0; i < this.main_app.scenario_presets_list.length; i++){
          if (scenario_hash == this.main_app.scenario_presets_list[i]["hash"]){
              this.main_app.scenario_data = this.main_app.scenario_presets_list[i]["content"]
              this.main_app.scenario_name = this.main_app.scenario_presets_list[i]["name"]
          }
      }
  
      //save map name for backup usage
      let map_config = utils.read_file_content(PATH_TO_MAPS, this.main_app.map_data["CONFIG"])
      this.main_app.map_name = map_config["AIRPORT_NAME"]
  
      this.main_app.command_preset_data = utils.read_file_content(PATH_TO_COMMANDS, filename_command)
      this.main_app.command_preset_name = this.main_app.command_preset_data["info"]["name"]
  
      this.main_app.aircraft_preset_data = utils.read_file_content(PATH_TO_AIRCRAFTS, filename_aircraft)
      this.main_app.aircraft_preset_name = this.main_app.aircraft_preset_data["info"]["name"]
  
      //read scale
      this.main_app.scale = parse_scale(this.main_app.map_data["scale"])
  
      //for weather to align latitude, longtitude and zoom (https://www.maptiler.com/google-maps-coordinates-tile-bounds-projection/#1/131.42/4.37)
      if (this.main_app.map_data == undefined){
          //map wasn't selected
          this.main_app.longitude = undefined
          this.main_app.latitude = undefined
          this.main_app.zoom = undefined
      }
      else{
          this.main_app.longitude = this.main_app.map_data["long"]
          this.main_app.latitude = this.main_app.map_data["lat"]
          this.main_app.zoom = this.main_app.map_data["zoom"]
      }
  
      this.main_app.logger.log("DEBUG", `Selected presets: ${[this.main_app.map_name, this.main_app.command_preset_name, this.main_app.aircraft_preset_name]}`)
      
  
      this.main_app.loader = new ProgressiveLoader(this.main_app.app_settings, this.main_app.monitor_info, load_dict, this.main_app.logger)
      this.main_app.loader.setup_loader(5, "Setting up simulation, please wait...", "Initializing simulation setup")
      
      this.main_app.enviro_logger = new EventLogger(true, "enviro_log", "environment")
      this.main_app.enviro_logger.init_logger()
      this.main_app.enviro_logger.log("INFO", "EventLogger instance on Environment is set up")
  
      // turn on the modules
      if (this.main_app.app_status["turn-on-backend"]){
          this.main_app.msc_wrapper.send_message("action", "start")
      }
  
      this.main_app.loader.send_progress("Setting up environment")
      this.main_app.enviro = new Environment(
        this.main_app.logger,
        this.main_app,
        process.env.ABS_PATH,
        this.main_app.PlaneDatabase,
        this.main_app.command_preset_data,
        this.main_app.aircraft_preset_data,
        this.main_app.map_data, 
        this.main_app.scenario_data,
        parseFloat(this.main_app.app_settings["std_bank_angle"]),
        this.main_app.msc_wrapper,
        this.main_app.loader
      )
          
  
      this.main_app.loader.send_progress("Setting plane schedules")
      this.main_app.enviro_logger.log("INFO", "Setting plane shedules")
      let n_unused_schedules = this.main_app.enviro.set_plane_schedules()
      if (n_unused_schedules > 0){
          //some schedules are deleted because no avaliable plane was found matching
          
          this.main_app.current_popup_window = this.main_app.create_popup_window(
            this.main_app.logger,
            "alert", "confirm-schedules",
            `WARNING: ${n_unused_schedules} plane schedules are going to be unused`,
            "because plane was not matching schedule type"
          )
      }
      else{
          this.main_app.setup_environment()
      }
  }
  
  public render_map(){
      //rendering map data for user (invoked from worker)
      for (let i = 0; i < this.main_app.workers.length; i++){
          this.main_app.workers[i]["win"].send_message("map-data", [this.main_app.map_data, this.main_app.workers[i]["win"].win_type])
      }
  
      this.send_location_data()
  }
  
  public get_points(data: any[]){
      let spec_data: object;
      if (data[0].includes("ACC")){
          //selected monitor is in ACC mode
          spec_data = this.main_app.map_data["ACC"]
      }
      else if (data[0].includes("APP")){
          //selected monitor is in APP mode
          spec_data = this.main_app.map_data["APP"]
      }
      else if (data[0].includes("TWR")){
          //selected monitor is in TWR mode
          spec_data = this.main_app.map_data["TWR"]
      }
      let out_data = {}
      for (const [key, value] of Object.entries(spec_data)) {
          if (key == "POINTS" || key == "ARP" || key == "SID" || key == "STAR" || key == "RUNWAY"){
              out_data[key] = value
          }
      }
      this.main_app.wrapper.send_message("controller", "map-points", JSON.stringify(out_data))
  }
  
  public monitor_change_info(data: any[]){
      console.log(data)
      let mon_data = data[0]
      for (let i = 0; i < this.main_app.workers.length; i++){
          if (this.main_app.workers[i]["win"].win_type != mon_data[i]["type"]){
              //rewrite current window type and render to another one
              let path_to_render = "";
  
  
              switch(mon_data[i]["type"]){
                  case "ACC":
                      //rewrite to Area control
                      path_to_render = PATH_TO_WORKER_HTML
                      //command_presets_listTODO: add rendering
                      break
                  case "APP":
                      //rewrite to Approach control
                      path_to_render = PATH_TO_WORKER_HTML
                      //TODO: add rendering
                      break
                  case "TWR":
                      //rewrite to tower
                      path_to_render = PATH_TO_WORKER_HTML
                      //TODO: add rendering
                      break
                  case "weather":
                      //rewrite to weather forecast
                      path_to_render = PATH_TO_WEATHER_HTML
                      break
                  case "dep_arr":
                      //rewrite to departure/arrival list
                      path_to_render = PATH_TO_DEP_ARR_HTML
                      break
                  case "embed":
                      path_to_render = PATH_TO_EMBED_HTML
                      break
              }
  
              this.main_app.workers[i]["win"].win_type = mon_data[i]["type"]
              this.main_app.workers[i]["win"].show(path_to_render)
  
  
          }
          //change worker data in monitor_data DB
          this.main_app.PlaneDatabase.update_worker_data(this.main_app.workers)
      }
  }
  
  public rewrite_frontend_vars(data: any[]){
      this.main_app.frontend_vars = data[0]
      console.log(this.main_app.frontend_vars)
  }
  
  public confirm_settings(){
      this.main_app.current_popup_window.close()
      this.main_app.current_popup_window = undefined
  }
  
  public confirm_schedules(){
      this.main_app.setup_environment()
  
      this.main_app.current_popup_window.close()
      this.main_app.current_popup_window = undefined
  }
  
  public async ping(data: any[]){
      let status: boolean = await utils.ping(data[0])
      for (let i = 0; i < this.main_app.workers.length; i++){
          this.main_app.wrapper.send_message(this.main_app.workers[i]["win-name"], "ping-status", status)
      }
  }
  
  public json_description(data: any[]){
      if (data[1] == "command"){
          this.main_app.wrapper.send_message("controller", "description-data", this.main_app.command_presets_list[data[0]])
      }
      else if (data[1] == "aircraft"){
          this.main_app.wrapper.send_message("controller", "description-data", this.main_app.aircraft_presets_list[data[0]])
      }
  }
  
  public map_check(){
      if (this.main_app.map_data == undefined){
          this.main_app.logger.log("WARN", "user did not check any map")
          this.main_app.wrapper.send_message("controller", "map-checked", JSON.stringify({"user-check": false}))
      }
      else {
          this.main_app.logger.log("DEBUG", "user checked a map")
          this.main_app.wrapper.send_message("controller", "map-checked", JSON.stringify({"user-check": true}))
      }
  }
  
  public send_location_data() {
    for (let i = 0; i < this.main_app.workers.length; i++) {
      if (this.main_app.workers[i]["win"]["win_type"] == "weather") { //this layer is unchanged because IPC wrapper has no ways of handling different worker types (TODO)
        this.main_app.workers[i]["win"].send_message("geo-data", [this.main_app.latitude, this.main_app.longitude, this.main_app.zoom])
      }
    }
  }
  
  public constructor(main_app: MainAppInterface){
    this.main_app = main_app
  }
}