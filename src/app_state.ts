/*
  App state functions defined in this code, used for inner state management handling all the frontend routing
*/

import utils, {PyMonitor_object, JsonData} from "./app_utils"
import {
    //window configs
    main_menu_dict,
    exit_dict,
    popup_widget_dict,
    load_dict,

    // interfaces
    ProgressiveLoaderInterface,
    EventLoggerInterface
    
    //window classes
    Window,
    PopupWindow,

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
    
    //local storage paths
    PATH_TO_PLUGINS,
    PATH_TO_MODULES,

    PATH_TO_MSC,
    PATH_TO_INSTALLER,
    PATH_TO_SETTINGS,
    PATH_TO_MONITOR_CONFIGURATION,
    PATH_TO_BACKUP
} from "./app_config"

import {
  start_sim,
  stop_sim,
  start_mic_record,
  stop_mic_record,
  restore_sim,
  regenerate_map
} from "./environment"

//
// ProgressiveLoader to handle graceful App loading on sim load
// 

export class ProgressiveLoader implements ProgressiveLoaderInterface{
    /*
        Loader class used for loading any stuff in GUI (involves spawning windows too)
    */
    private loaders: any[] = [];
    private app_settings: any;
    private displays: any[]
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
        for(let i = 0; i < this.displays.length; i++){
            const [coords, display_info] = get_window_info(this.app_settings, this.displays, i, "load", this.load_dict)

            //creating loading window
            let LoadingWindow = new LoaderWindow(this.load_dict, PATH_TO_LOADER_HTML, coords!, this.ev_logger, display_info)
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

    public constructor(app_settings: any, displays: any[], load_dict: any, event_logger: EventLogger){
        this.app_settings = app_settings
        this.displays = displays
        this.load_dict = load_dict
        this.ev_logger = event_logger
    }
}

//
// App Frontend redirecting (to menu/main app/simulation)
//

export class FrontendRouter{
  public redirect_to_menu(window_type: string){
    this.app_status["redir-to-main"] = false
  
    //message call to redirect to main menu
    this.ev_logger.log("DEBUG", "redirect-to-menu event")
  
    if (window_type == "settings"){
      this.settingsWindow.close()
      this.wrapper.unregister_window(this.settingsWindow.window_id)
    }
    else if (window_type == "controller"){
      this.controllerWindow.close()
      this.wrapper.unregister_window(this.controllerWindow.window_id)
  
      for (let i = 0; i < this.workers.length; i++){
          this.workers[i]["win"].close()
          this.wrapper.unregister_window(this.workers[i]["win"].window_id)
      }
  
      this.widget_handler.exit_all(this.wrapper)
    }
  
    //calculate x, y
    let coords = utils.get_window_info(this.app_settings, this.displays, -1, "normal", main_menu_dict)[0]
  
    this.ev_logger.log("DEBUG", "main-menu show")
    this.mainMenuWindow = new Window(this.app_status, this.dev_panel, main_menu_dict, 
        PATH_TO_MAIN_HTML, coords, this.ev_logger, this)
    this.wrapper.register_window(this.mainMenuWindow, "main-menu")
  
    this.mainMenuWindow.show()
    
    this.workers = []
    this.controllerWindow = undefined
    this.PlaneDatabase = undefined
  }
  
  public redirect_to_settings(settings_dict: object){
    //message call to redirect to settings
    this.app_status["redir-to-main"] = true
  
    this.ev_logger.log("DEBUG", "redirect-to-settings event")
  
    this.mainMenuWindow.close()
    this.wrapper.unregister_window(this.mainMenuWindow.window_id)
  
    //calculate x, y
    const [coords, display_info] = utils.get_window_info(this.app_settings, this.displays, -1, "normal")
  
    this.ev_logger.log("DEBUG", "settings show")
    this.settingsWindow = new Window(this.app_status, this.dev_panel, settings_dict, PATH_TO_SETTINGS_HTML, coords, this.ev_logger, this, "settings", display_info)
    this.wrapper.register_window(this.settingsWindow, "settings")
    
    this.settingsWindow.show()
  }
  
  public redirect_to_main(){
    //message call to redirect to main program (start)
    this.app_status["redir-to-main"] = true
    this.main_app()
  }
  
  public constructor(){
    
  }
}

//
// Event-listener initializator
//

export class ListenerSetup{
  public add_listener_backend(){
      //backend-worker events
      if (main_app.app_status["turn-on-backend"]){
          main_app.msc_wrapper.set_listener((message: string[]) => {
              if (message[0] == "channels"){
                  // check which channels are permitted to send messages
                  main_app.msc_wrapper.enabled_channels = JSON.parse(message[1])
              }
              else if (message[0] == "module"){
                  let msg_command: string[] = JSON.parse(message[1])
                  if (msg_command[0] == "sedas_ai"){
                      let callsign: string = msg_command[1];
                      let value: string = msg_command[2];
                      let command: string = msg_command[3];
  
                      // update plane status
                      main_app.plane_value_change([command, value, callsign])
                  }
              }
          })
  
          /*
          main_app.backend_worker.on("message", (message: string) => {
              //processing from backend.js
              let arg = message.split(":")[0]
              let content = message.split(":")[1]
  
              switch(arg){
                  case "command":
                      let command_args = content.split(" ")
  
                      //TODO: add args to set command
                      main_app.PlaneDatabase.set_command(command_args[0], command_args[1], command_args[2])
                      break
                  case "debug":
                      //used for debug logging
                      EvLogger.log("DEBUG", content)
                      break
              }
          })
          */
      }
  }
  
  public add_listener_backup(main_app: any){
      //database worker events
      main_app.backup_worker.on("message", (message: string) => {
          if (Array.isArray(message)){
              switch(message[0]){
                  case "db-data":
                      var database_data = JSON.parse(message[1])
                      main_app.map_data = database_data["map"]
  
                      main_app.main_app(database_data) //start main app on backup restore
                      break
              }
          }
      })
  }
  
  public add_listener_IPC(){
    //IPC listeners
  
    main_app.wrapper.register_channel("redirect-to-menu", ["controller"], "unidirectional", () => redirect_to_menu("controller"))
    main_app.wrapper.register_channel("redirect-to-menu", ["settings"], "unidirectional", () => redirect_to_menu("settings"))
    main_app.wrapper.register_channel("redirect-to-settings", ["menu"], "unidirectional", () => redirect_to_settings(main_app.settings_config))
    main_app.wrapper.register_channel("redirect-to-main", ["menu"], "unidirectional", () => redirect_to_main())
  
    main_app.wrapper.register_channel("save-settings", ["menu"], "unidirectional", (data: any[]) => save_settings(data))
    this.wrapper.register_channel("monitor-change-info", ["controller"], "unidirectional", (data: any[]) => monitor_change_info(data))
    this.wrapper.register_channel("exit", ["worker", "controller"], "unidirectional", () => main_app.exit())
    
    this.wrapper.register_channel("ping", ["controller", "settings", "embed"], "bidirectional", (data: any[]) => main_app.ping(data))
    
    //send app configuration to controller
    this.wrapper.register_channel("send-info", ["controller"], "bidirectional", () => send_info("controller"))
    this.wrapper.register_channel("send-info", ["worker"], "bidirectional", () => send_info("worker"))
    this.wrapper.register_channel("send-info", ["settings"], "bidirectional", () => send_info("settings"))
  
    //environment invokes
    this.wrapper.register_channel("start-sim", ["controller", "worker"], "unidirectional", () => start_sim())
    this.wrapper.register_channel("stop-sim", ["controller", "worker"], "unidirectional", () => stop_sim())
    this.wrapper.register_channel("start-mic", ["worker"], "unidirectional", () => start_mic_record())
    this.wrapper.register_channel("stop-mic", ["worker"], "unidirectional", () => stop_mic_record())
    this.wrapper.register_channel("restore-sim", ["controller"], "unidirectional", () => restore_sim())
    this.wrapper.register_channel("regenerate-map", ["controller"], "unidirectional", () => regenerate_map())
  
    this.wrapper.register_channel("set-environment", ["controller"], "unidirectional", (data: any[]) => set_environment(data))
    this.wrapper.register_channel("json-description", ["controller"], "bidirectional", (data: any[]) => json_description(data))
  
    this.wrapper.register_channel("render-map", ["controller", "worker"], "unidirectional", () => render_map())
    this.wrapper.register_channel("get-points", ["controller"], "bidirectional", (data: any[]) => get_points(data))
    this.wrapper.register_channel("map-check", ["controller"], "bidirectional", () => this.map_check())
    this.wrapper.register_channel("send-location-data", ["weather"], "unidirectional", () => this.send_location_data())
  
    //plane invokes
    this.wrapper.register_channel("spawn-plane", ["controller"], "unidirectional", (data: any[]) => this.spawn_plane(data))
    this.wrapper.register_channel("plane-value-change", ["controller"], "unidirectional", (data: any[]) => this.plane_value_change(data))
    this.wrapper.register_channel("plane-delete-record", ["controller"], "unidirectional", (data: any[]) => this.plane_delete_record(data))
    this.wrapper.register_channel("send-plane-data", ["dep_arra"], "unidirectional", () => this.send_plane_data())
    
    //widget invokes
    this.wrapper.register_channel("min-widget", ["worker-widget"], "unidirectional", (data: any[]) => this.widget_handler.minimize_widget(data))
    this.wrapper.register_channel("max-widget", ["worker-widget"], "unidirectional", (data: any[]) => this.widget_handler.maximize_widget(data))
    this.wrapper.register_channel("exit-widget", ["worker-widget"], "unidirectional", (data: any[]) => this.widget_handler.exit_widget(data, this.wrapper))
  
    //plugin invokes
    this.wrapper.register_channel("install-plugin", ["controller"], "unidirectional", (data: any[]) => this.install_plugin(data))
    this.wrapper.register_channel("get-plugin-list", ["controller"], "bidirectional", (data: any[]) => this.get_plugin_list())
  
    //confirm invokes
    this.wrapper.register_channel("confirm-install", ["popup"], "unidirectional", (data: any[]) => this.confirm_install(data))
    this.wrapper.register_channel("confirm-settings", ["popup"], "unidirectional", () => this.confirm_settings())
    this.wrapper.register_channel("confirm-schedules", ["popup"], "unidirectional", () => this.confirm_schedules())
  
    //other invokes
    this.wrapper.register_channel("send-scenario-list", ["controller"], "bidirectional", (data: any[]) => this.send_scenario_list(data))
    this.wrapper.register_channel("rewrite-frontend-vars", ["controller"], "unidirectional", (data: any[]) => this.rewrite_frontend_vars(data))
  
    //setting all listeners to be active
    this.wrapper.set_all_listeners()
  }
 
  public add_listener_intervals(){
      //disable intervals on app exit
      try {
          if (this.app_status["app-running"]){
              //update all planes on one second
              setInterval(() => {
                  if (this.PlaneDatabase != undefined && this.map_data != undefined && this.workers.length != 0){
                      if (this.app_status["sim-running"]){
                          this.PlaneDatabase.update_planes(this.scale, 
                                          parseFloat(app_settings["std_bank_angle"]), 
                                          parseFloat(app_settings["standard_pitch_up"]), 
                                          parseFloat(app_settings["standard_pitch_down"]),
                                          parseFloat(app_settings["standard_accel"]), 
                                          parseInt(app_settings["plane_path_limit"]))
                      }
                      if (this.app_status["app-running"]){
                          //send updated plane database to all
                          this.broadcast_planes(this.PlaneDatabase.DB, this.PlaneDatabase.monitor_DB, this.PlaneDatabase.plane_paths_DB)
                      }
                  }
              }, 1000)
  
              //send updated time to all workers
              setInterval(() => {
                  if (this.enviro != undefined && this.app_status["sim-running"]){
                      //send date & time to frontend
                      this.wrapper.broadcast("workers", "time", [this.enviro.current_time])
                  }
              }, 1000)
  
              //send plane data to backend
              setInterval(() => {
                  if (this.app_status["turn-on-backend"]){
                      if (this.PlaneDatabase == undefined){
                          this.msc_wrapper.send_message("module", "ai_backend", "data", [])
                      }
                      else{
                          this.msc_wrapper.send_message("module", "ai_backend", "data", this.PlaneDatabase.DB)
                      }
                  }
              }, 500)
  
              //on every n minutes, save to local DB if app crashes
              setInterval(() => {
                  if (this.app_status["backup-db-on"] && (this.PlaneDatabase != undefined) && (this.map_data != undefined) && (this.workers.length != 0)){
                      let simulation_dict = {
                          "planes": this.PlaneDatabase.DB,
                          "monitor-planes": this.PlaneDatabase.monitor_DB,
                          "monitor-data": this.workers,
                          "map": this.map_data,
                          "map-name": this.map_name,
                          "command-preset": this.command_preset_data,
                          "command-preset-name": this.command_preset_name,
                          "aircraft-preset": this.aircraft_preset_data,
                          "aircraft-preset-name": this.aircraft_preset_name
                      }
              
                      //save to local db using database.ts 
                      this.backup_worker.postMessage(["save-to-db", JSON.stringify(simulation_dict, null, 2)])
                      EvLogger.log("DEBUG", "Saving temporary backup...")
                  }
              }, this.backupdb_saving_frequency)
          }
      }
      catch(error){
          EvLogger.log("ERROR", "An error happened, written down below")
          EvLogger.log("", error)
      }
  }
  
  public constructor(){
    
  }
}

//
// Frontend handlers (Grouped in one class so that it is not that much of a hassle to manage them)
//

export class FrontendHandlers{
  public save_settings(data: any[]){
    //save settings
    this.ev_logger.log("DEBUG", "saving settings")
  
    fs.writeFileSync(PATH_TO_SETTINGS, data[0])
    
    //inform user that settings are loaded only after restart
    this.current_popup_window = utils.create_popup_window(this.app_settings, this.ev_logger, this.displays,
      "alert", "confirm-settings",
      "Saved the settings",
      "Restart the app for changes to take the effect")
  }
  
  public send_info(window_type: string){
      if (window_type == "settings"){
  
          //reading settings gui layouts
          let settings_layout = utils.readJSON(PATH_TO_SETTINGS_LAYOUT)
  
          //sending app data and alg configs
          console.log("sending app data")
          //TODO: rework this...
          this.wrapper.send_message("settings", "app-data", [this.app_settings, settings_layout])
      }
      else if (window_type == "controller"){
          //sending monitor data
  
          //acquiring airport map data
          this.map_configs_list = []
          var map_files = utils.list_files(PATH_TO_MAPS)
          for (let i = 0; i < map_files.length; i++){
              let map = utils.read_file_content(PATH_TO_MAPS, map_files[i])
              if (map_files[i].includes("config")){
                  this.map_configs_list.push({
                      "hash": "airport-" + utils.generate_hash(),
                      "content": map
                  })
              }
          }
  
          //acquiring list of aircraft presets
          this.aircraft_presets_list = []
          let aircraft_files = utils.list_files(PATH_TO_AIRCRAFTS)
          for (let i = 0; i < aircraft_files.length; i++){
              let aircraft_config = utils.read_file_content(PATH_TO_AIRCRAFTS, aircraft_files[i])
              this.aircraft_presets_list.push({
                  "path": aircraft_files[i],
                  "hash": "aircraft-" + utils.generate_hash(),
                  "name": aircraft_config["info"]["name"],
                  "content": JSON.stringify(aircraft_config["all_planes"])
              })
          }
  
          //acquiring list of command presets
          this.command_presets_list = []
          let command_files = utils.list_files(PATH_TO_COMMANDS)
          for (let i = 0; i < command_files.length; i++){
              let commands_config = utils.read_file_content(PATH_TO_COMMANDS, command_files[i])
              this.command_presets_list.push({
                  "path": command_files[i],
                  "hash": "command-" + utils.generate_hash(),
                  "name": commands_config["info"]["name"],
                  "content": JSON.stringify(commands_config["commands"])
              })
          }
          this.wrapper.send_message("controller", "init-info", ["window-info", 
                                  JSON.stringify(this.workers), 
                                  this.map_configs_list, 
                                  JSON.stringify(this.app_settings), 
                                  [this.map_name, this.command_preset_name, this.aircraft_preset_name, this.scenario_name], 
                                  this.aircraft_presets_list, 
                                  this.command_presets_list, 
                                  this.frontend_vars, 
                                  this.app_status])
      }
      else if (window_type == "worker"){
          //send to all workers
          this.wrapper.broadcast("workers", "init-info", ["window-info", JSON.stringify(this.app_settings)])
      }
  }
  
  public send_scenario_list(data: any[]){
      //rewrite scenario presets lists
      this.scenario_presets_list = []
      console.log(data)
  
      let selected_map_data = utils.read_file_content(PATH_TO_MAPS, data[0])
      let scenarios = selected_map_data["scenarios"]
      if (scenarios == undefined){
          this.wrapper.send_message("controller", "scenario-list", [])
          return
      }
  
      for (let i = 0; i < scenarios.length; i++){
          this.scenario_presets_list.push({
              "hash": "scenario-" + utils.generate_hash(),
              "name": scenarios[i]["name"],
              "content": scenarios[i],
          })
      }
  
      this.wrapper.send_message("controller", "scenario-list", this.scenario_presets_list)
  }
  
  public set_environment(data: any[]){
      //getting map info, command preset info, aircraft preset info from user
      let filename_map = data[0]
                  
      //map addons
      let scenario_hash = data[3]
  
      let filename_command = data[1]
      let filename_aircraft = data[2]
  
      //save map data to variable
      this.map_data = utils.read_file_content(PATH_TO_MAPS, filename_map)
  
      //get scenario data
      for (let i = 0; i < this.scenario_presets_list.length; i++){
          if (scenario_hash == this.scenario_presets_list[i]["hash"]){
              this.scenario_data = this.scenario_presets_list[i]["content"]
              this.scenario_name = this.scenario_presets_list[i]["name"]
          }
      }
  
      //save map name for backup usage
      let map_config = utils.read_file_content(PATH_TO_MAPS, this.map_data["CONFIG"])
      this.map_name = map_config["AIRPORT_NAME"]
  
      this.command_preset_data = utils.read_file_content(PATH_TO_COMMANDS, filename_command)
      this.command_preset_name = this.command_preset_data["info"]["name"]
  
      this.aircraft_preset_data = utils.read_file_content(PATH_TO_AIRCRAFTS, filename_aircraft)
      this.aircraft_preset_name = this.aircraft_preset_data["info"]["name"]
  
      //read scale
      this.scale = utils.parse_scale(this.map_data["scale"])
  
      //for weather to align latitude, longtitude and zoom (https://www.maptiler.com/google-maps-coordinates-tile-bounds-projection/#1/131.42/4.37)
      if (this.map_data == undefined){
          //map wasn't selected
          this.longitude = undefined
          this.latitude = undefined
          this.zoom = undefined
      }
      else{
          this.longitude = this.map_data["long"]
          this.latitude = this.map_data["lat"]
          this.zoom = this.map_data["zoom"]
      }
  
      this.ev_logger.log("DEBUG", `Selected presets: ${[this.map_name, this.command_preset_name, this.aircraft_preset_name]}`)
      
  
      this.loader = new ProgressiveLoader(this.app_settings, this.displays, load_dict, this.ev_logger)
      this.loader.setup_loader(5, "Setting up simulation, please wait...", "Initializing simulation setup")
      
      this.enviro_logger = new EventLogger(true, "enviro_log", "environment")
      this.enviro_logger.init_logger()
      this.enviro_logger.log("INFO", "EventLogger instance on Environment is set up")
  
      // turn on the modules
      if (this.app_status["turn-on-backend"]){
          this.msc_wrapper.send_message("action", "start")
      }
  
      this.loader.send_progress("Setting up environment")
      this.enviro = new Environment(this.ev_logger, this, process.env.ABS_PATH, this.PlaneDatabase,
          this.command_preset_data,
          this.aircraft_preset_data,
          this.map_data, 
          this.scenario_data,
          parseFloat(this.app_settings["std_bank_angle"]),
          this.msc_wrapper)
      
  
      this.loader.send_progress("Setting plane schedules")
      this.enviro_logger.log("INFO", "Setting plane shedules")
      let n_unused_schedules = this.enviro.set_plane_schedules()
      if (n_unused_schedules > 0){
          //some schedules are deleted because no avaliable plane was found matching
          
          this.current_popup_window = utils.create_popup_window(this.app_settings, this.ev_logger, this.displays,
                                  "alert", "confirm-schedules",
                                  `WARNING: ${n_unused_schedules} plane schedules are going to be unused`,
                                  "because plane was not matching schedule type")
      }
      else{
          this.setup_environment()
      }
  }
  
  public render_map(){
      //rendering map data for user (invoked from worker)
      for (let i = 0; i < this.workers.length; i++){
          this.workers[i]["win"].send_message("map-data", [this.map_data, this.workers[i]["win"].win_type])
      }
  
      this.send_location_data()
  }
  
  public get_points(data: any[]){
      let spec_data: object;
      if (data[0].includes("ACC")){
          //selected monitor is in ACC mode
          spec_data = this.map_data["ACC"]
      }
      else if (data[0].includes("APP")){
          //selected monitor is in APP mode
          spec_data = this.map_data["APP"]
      }
      else if (data[0].includes("TWR")){
          //selected monitor is in TWR mode
          spec_data = this.map_data["TWR"]
      }
      let out_data = {}
      for (const [key, value] of Object.entries(spec_data)) {
          if (key == "POINTS" || key == "ARP" || key == "SID" || key == "STAR" || key == "RUNWAY"){
              out_data[key] = value
          }
      }
      this.wrapper.send_message("controller", "map-points", JSON.stringify(out_data))
  }
  
  public monitor_change_info(data: any[]){
      console.log(data)
      let mon_data = data[0]
      for (let i = 0; i < this.workers.length; i++){
          if (this.workers[i]["win"].win_type != mon_data[i]["type"]){
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
  
              this.workers[i]["win"].win_type = mon_data[i]["type"]
              this.workers[i]["win"].show(path_to_render)
  
  
          }
          //change worker data in monitor_data DB
          this.PlaneDatabase.update_worker_data(this.workers)
      }
  }
  
  public rewrite_frontend_vars(data: any[]){
      this.frontend_vars = data[0]
      console.log(this.frontend_vars)
  }
  
  public confirm_settings(){
      this.current_popup_window.close()
      this.current_popup_window = undefined
  }
  
  public confirm_schedules(){
      this.setup_environment()
  
      this.current_popup_window.close()
      this.current_popup_window = undefined
  }
  
  public function ping(data: any[]){
      let status: boolean = await utils.ping(data[0])
      for (let i = 0; i < this.workers.length; i++){
          this.wrapper.send_message(this.workers[i]["win-name"], "ping-status", status)
      }
  }
  
  public json_description(data: any[]){
      if (data[1] == "command"){
          this.wrapper.send_message("controller", "description-data", this.command_presets_list[data[0]])
      }
      else if (data[1] == "aircraft"){
          this.wrapper.send_message("controller", "description-data", this.aircraft_presets_list[data[0]])
      }
  }
  
  public map_check(){
      if (this.map_data == undefined){
          this.ev_logger.log("WARN", "user did not check any map")
          this.wrapper.send_message("controller", "map-checked", JSON.stringify({"user-check": false}))
      }
      else {
          this.ev_logger.log("DEBUG", "user checked a map")
          this.wrapper.send_message("controller", "map-checked", JSON.stringify({"user-check": true}))
      }
  }
  
  public send_location_data() {
    for (let i = 0; i < this.workers.length; i++) {
      if (this.workers[i]["win"]["win_type"] == "weather") { //this layer is unchanged because IPC wrapper has no ways of handling different worker types (TODO)
        this.workers[i]["win"].send_message("geo-data", [this.latitude, this.longitude, this.zoom])
      }
    }
  }
  
  public constructor(){
    
  }
}