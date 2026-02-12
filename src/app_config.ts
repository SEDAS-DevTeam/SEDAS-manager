/*
    Just a config file to keep all window definitions or anything that is predefined and isnt changed
    while running the program
*/

import { join } from "path"
import { BrowserWindow, App } from "electron";
import { Worker } from "worker_threads"

let default_path: string;
//if (process.env.DEV_MODE === "true") default_path = "http://localhost:5173"
//else default_path = `file://${join(process.env.ABS_PATH!, "/src/res/dist/index.html")}`
default_path = `file://${join(process.env.ABS_PATH!, "/src/res/dist/index.html")}`
console.log(default_path)

//paths for main html files
export const PATH_TO_MAIN_HTML = default_path + "#/external/main"//join(process.env.ABS_PATH!, "./src/res/html/other/main.html")
export const PATH_TO_SETTINGS_HTML = default_path + "#/external/settings"//join(process.env.ABS_PATH!, "./src/res/html/controller/settings.html")
export const PATH_TO_CONTROLLER_HTML = default_path + "#/controller/setup"//join(process.env.ABS_PATH!, "./src/res/html/controller/controller_set.html")
export const PATH_TO_EXIT_HTML = default_path + "#/external/exit"//join(process.env.ABS_PATH!, "./src/res/html/other/exit.html")
export const PATH_TO_POPUP_HTML = default_path + "#/external/popup"//join(process.env.ABS_PATH!, "./src/res/html/other/popup.html")
export const PATH_TO_LOADER_HTML = default_path + "#/external/load"//join(process.env.ABS_PATH!, "./src/res/html/other/load.html")

//paths to worker html files
export const PATH_TO_WORKER_HTML = default_path + "#/worker/map"//join(process.env.ABS_PATH!, "./src/res/html/worker/worker.html")
export const PATH_TO_DEP_ARR_HTML = default_path + "#/worker/dep_arr"//join(process.env.ABS_PATH!, "./src/res/html/worker/dep_arr.html")
export const PATH_TO_EMBED_HTML = default_path + "#/worker/embed"//join(process.env.ABS_PATH!, "./src/res/html/worker/embed.html")
export const PATH_TO_WEATHER_HTML = default_path + "#/worker/weather"//join(process.env.ABS_PATH!, "./src/res/html/worker/weather.html")

//paths to widget html files
export const PATH_TO_WIDGET_HTML = default_path + "#/widget"//join(process.env.ABS_PATH!, "./src/res/html/widget/worker_widget.html")

//paths for local storage
export const PATH_TO_LOGS: string = join(process.env.ABS_PATH!, "/src/res/data/tmp/")
export const PATH_TO_MAPS: string = join(process.env.ABS_PATH!, "/src/res/data/sim/maps/")
export const PATH_TO_COMMANDS: string = join(process.env.ABS_PATH!, "/src/res/data/sim/commands/")
export const PATH_TO_AIRCRAFTS: string = join(process.env.ABS_PATH!, "/src/res/data/sim/planes/")
export const PATH_TO_AIRLINES: string = join(process.env.ABS_PATH!, "/src/res/data/sim/airlines/")
export const PATH_TO_CACHE: string = join(process.env.ABS_PATH!, "/src/res/neural/alg_cache")
export const PATH_TO_CONFIG: string = join(process.env.ABS_PATH!, "/src/res/data/alg/")
export const PATH_TO_SETTINGS: string = join(process.env.ABS_PATH!, "/src/res/data/app/settings.json")
export const PATH_TO_PLUGINS: string = join(process.env.ABS_PATH!, "/src/res/data/app/config/plugins_config.json")
export const PATH_TO_MODULES: string = join(process.env.ABS_PATH!, "/src/res/data/app/config/modules_config.json")
export const PATH_TO_ICON: string = join(process.env.ABS_PATH!, "/src/res/img/sedas-manager-logo-rounded.png")

//paths to updater
export const PATH_TO_INSTALLER: string = join(process.env.ABS_PATH!, "/src/updater/dist/install")

//paths for workers
export const PATH_TO_MSC: string = join(process.env.ABS_PATH!, "/src/workers/backend.js")
export const PATH_TO_BACKUP: string = join(process.env.ABS_PATH!, "/src/workers/database.js")

//paths for gui layouts
export const PATH_TO_SETTINGS_LAYOUT: string = join(process.env.ABS_PATH!, "/src/res/data/app/gui/settings_layout.json")

//paths for backup
export const PATH_TO_DATABASE: string = join(process.env.ABS_PATH!, "/src/res/data/tmp/backup.json")

//constants used in this app
export const WIDGET_OFFSET = 50
export const ALPHABET: string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');


// other paths
export const PATH_TO_PRELOAD: string = join(process.env.ABS_PATH!, "src/res/components/preload.js")

//constants in app build
export const APP_NAME: string = "sedasmanager"
export const APP_IDENTIFIER_BETA: string = "com.beta.sedasmanager.app"
export const APP_IDENTIFIER_PROD: string = "com.sedasmanager.app"
export const IS_PRERELEASE: boolean = true
export const APP_TAG_BETA: string = "beta"
export const APP_TAG_PROD: string = "prod"
export const PATH_TO_OUT: string = join(process.env.ABS_PATH!, "/out/")
export const PATH_TO_SRC: string = join(process.env.ABS_PATH!, "/src")
export const PATH_TO_PACKAGE: string = join(process.env.ABS_PATH!, "/package.json")

//constants in build exclusions
//TODO build some better exclusion based mechanism in forge.config!
export const PATH_EXC_ADDONS: string = "./src/addons";
export const PATH_EXC_ENV: string = "./sedas_manager_env";
export const PATH_EXC_DOC: string = "./doc";
export const PATH_EXC_VSCODE: string = "./.vscode";
export const PATH_EXC_GITIGNORE: string = "./.gitignore";
export const PATH_EXC_GITMODULES: string = "./.gitmodules";
export const PATH_EXC_REQUIREMENTS: string = "./requirements.txt";
export const PATH_EXC_INVOKE: string = "./tasks.py";
export const PATH_EXC_TSCONF: string = "./tsconfig.json";

/*
    Two unfortunate functions that I have to export here otherwise the whole codebase would fall on my head
*/

export function generate_id(){
    var n_pos: number = 5;
    var res_str: string = ""

    for (let i = 0; i < n_pos; i++){
        let rand_choice = Math.random() < 0.5;
        let elem: string;
        if (rand_choice){ //alphabet
            elem = ALPHABET[(Math.floor(Math.random() * ALPHABET.length))]
        }
        else{ //number
            elem = Math.floor(Math.random() * 11).toString()
        }
        res_str += elem
    }
    return res_str
}

export function generate_win_id(){
    var res_str: string = "win-"
    var n_pos: number = 4;


    for (let i = 0; i < n_pos; i++){
        res_str += Math.floor(Math.random() * 9).toString()
    }
    return res_str
}


/*
    Main app interface definiton (used in parameter passing - trying to avoid circual imports)
*/

export interface IPCwrapperInterface {
  window_communication_configuration: any[]
  register_window(window: Window, window_name: string): void,
  unregister_window(window_id: string): void,
  register_channel(channel_name: string, sender: string[], type: string, callback: Function): void,
  set_all_listeners(): void,
  open_channels(): void,
  close_channels(): void,
  send_message(destination: string, channel: string, data: any): void,
  broadcast(type: string, channel: string, data: any): void,
}

export interface MSCwrapperInterface {
  worker: Worker,
  enabled_channels: string[],
  send_message(...message: any[]): void,
  set_listener(callback: Function): void,
  terminate(): void
}

export interface ProgressiveLoaderInterface {
  num_segments: number,
  curr_n_segments: number,
  setup_loader(n_segments: number, loader_header: string, first_message: string): void,
  send_progress(message: string): void,
  destroy_loaders(): void
}

export interface EventLoggerInterface {
  log_header: string,
  init_logger(): void,
  log(cat_name: string, message: string): void,
  end(): void,
}

export interface ListenerSetupInterface {
  add_listener_backend(): void,
  add_listener_backup(): void,
  add_listener_IPC(): void,
  add_listener_intervals(): void
}

export interface FrontendRouterInterface {
  redirect_to_menu(window_type: string): void,
  redirect_to_settings(): void,
  redirect_to_main(): void
}

export interface OSBridgeInterface {
  get_info(): Record<string, any>,
  check_env(): string[],
  
}

export interface FrontendHandlersInterface {
  save_settings(data: any[]): void,
  send_info(window_type: string): void,
  send_scenario_list(data: any[]): void,
  set_environment(data: any[]): void,
  render_map(): void,
  get_points(data: any[]): void,
  monitor_change_info(data: any[]): void,
  rewrite_frontend_vars(data: any[]): void,
  confirm_settings(): void,
  confirm_schedules(): void,
  ping(data: any[]): void,
  json_description(data: any[]): void,
  map_check(): void,
  send_location_data(): void
}

export interface PluginRegisterInterface {}

export interface EnvironmentInterface {
  current_time: Date,
  start_time: Date,

  plane_schedules: any,
  plane_objects: object[],
  plane_conditions: PlaneConditions,

  setup_enviro(loader: ProgressiveLoaderInterface, logger: EventLoggerInterface): void,
  kill_enviro(): void,
  set_plane_schedules(): number,
  set_plane_trajectories(): void,
  broadcast_planes(planes: object[], plane_monitor_data: object[], plane_paths_data: object[]): void,
}

export interface PlaneInterface {
  id: string,
  callsign: string,

  heading: number,
  updated_heading: number,

  level: number,
  updated_level: number,

  speed: number,
  screen_speed: number,
  updated_speed: number,

  departure: string,
  arrival: string,
  arrival_time: string,
  x: number,
  y: number,

  current_command_level: string,
  current_command_speed: string,
  current_command_heading: string

  special_comm: string[],

  forward(scale: number): void,
  check_heading(std_bank_angle: number, plane_turn_DB: object[]): void,
  check_level(std_climb_angle: number, std_descent_angle: number, scale: number): void,
  check_speed(std_accel: number): void,
  change_heading(command: string, value: any): void,
  change_speed(command: string, value: any): void,
  change_level(command: string, value: any): void,
}

export interface PlaneDBInterface {
  DB: PlaneInterface[],
  monitor_DB: PlaneLocObject[],
  plane_paths_DB: any[],
  plane_turn_DB: PlaneTurnObject[],
  command_config: Record<string, any>,

  set_command(callsign: string, command: string, value: any): void,
  update_worker_data(monitor_data: any): void,
  add_record(plane_obj: any, monitor_spawn: string): void,
  add_path_record(id: string, coords: any): void,
  find_record(id: string): PlaneInterface | undefined,
  delete_record(id: string): void,
  delete_all(): void,
  update_planes(scale: number, std_bank_angle: number, std_climb_angle: number, std_descent_angle: number, std_accel: number, path_limit: number): void
}

export interface MainAppInterface {
  app_instance: App,
  app_abs_path: string,
  os_bridge: OSBridgeInterface,
  os_info: Record<string, string>,
  
  wrapper: IPCwrapperInterface,
  loader: ProgressiveLoaderInterface | undefined,
  logger: EventLoggerInterface,
  widget_handler: WidgetWindowHandler,
  msc_wrapper: MSCwrapperInterface,
  plugin_register: PluginRegisterInterface,
  listeners: ListenerSetupInterface,
  frontend_router: FrontendRouterInterface,
  frontend_handlers: FrontendHandlersInterface

  mainMenuWindow: Window | undefined,
  settingsWindow: Window | undefined,
  controllerWindow: Window | undefined,
  exitWindow: Window | undefined,
  
  enviro: EnvironmentInterface,
  enviro_logger: EventLoggerInterface,
  
  app_status: Record<string, boolean>,
  frontend_vars: object,
  app_settings: Record<string, any>,
  backup_worker: Worker,

  dev_panel: boolean | undefined,
  workers: WorkerType[],
  worker_coords: object[],
  selected_plugin_id: string,
  current_popup_window: PopupWindow | undefined,
  backupdb_saving_frequency: number,
  local_plugin_list: object[],
  monitor_info: MonitorInfo<DisplayObject[], DisplayObject>,

  map_configs_list: object[],
  map_data: MapPreset,
  map_name: string,
  scenario_presets_list: ScenarioPreset[],
  scenario_data: any,
  scenario_name: string,

  scale: number,
  longitude: number | undefined,
  latitude: number | undefined,
  zoom: number | undefined,

  command_presets_list: PresetList
  command_preset_data: CommandPreset | undefined,
  command_preset_name: string,
  
  aircraft_presets_list: PresetList,
  aircraft_preset_data: AircraftPreset | undefined,
  aircraft_preset_name: string,
  PlaneDatabase: PlaneDBInterface | undefined,

  main_menu_config: object,
  exit_config: object,
  popup_widget_config: object,
  load_config: object,
  settings_config: object,

  create_popup_window(event_logger: EventLoggerInterface, type: string, channel: string, header: string, text: string): PopupWindow,
  run_updater(path: string, app_abs_path: string): Promise<boolean>,
  setup_environment(): void,

  init_app(): void,
  init_gui(): void,
  main_app(backup_db: object | undefined): void,
  exit_app(): void
}

export type JsonData = { [key: string]: any }
export type DisplayObject = { center: [number, number], size: [number, number] }
export type MonitorInfo<Disp_A, Disp> = [Disp_A, Disp]
export type Coords<x, y> = [x, y]
export type WorkerType = {
  win: WorkerWindow,
  id: string
}
export type PlaneObject = {
  properties: {
    min_kias: number
  }
  name: string,
  hash: string,
  schedule: JsonData,
  trajectory: any[]
}
export type PlaneLocObject = {
  type: string,
  planes_id: string[]
}
export type PlaneConditions = {
  category: string,
  wtc_category: string
}
export type PlaneTurnObject = {
  id: string,
  rate_of_turn: any
}

export type PlaneSpawnerConfiguration = {
  id: string,
  time: Date
}[]
export type PlaneCommanderConfiguration = {
  id: string,
  content: any[] // similar to trajectory
}[]

// Types for maps/scenarios/aircraft/command configurations
export type MapPreset = {
  CONFIG: string,
  ACC: JsonData,
  APP: JsonData,
  TWR: JsonData,
  long: number,
  lat: number,
  zoom: number,
  scale: string,
  scenarios: JsonData
}

export type MapPresetConfig = {
  FILENAME: string,
  AIRPORT_NAME: string,
  TYPE: string,
  CODE: string,
  COUNTRY: string,
  CITY: string,
  DESC: string
}

export type ScenarioPreset = {
  hash: string,
  content: JsonData,
  name: string
}

export type PresetList = {
  path: string,
  hash: string,
  name: string,
  content: string
}[]

export type AircraftPreset = {
  info: Record<string, string>,
  all_planes: JsonData[]
}
export type CommandPreset = {
  info: Record<string, string>,
  commands: JsonData
}


/*
    Window configs for electron
*/
export const main_menu_dict = {
    width: 800,
    height: 600,
    title: "SEDAS manager",
    resizable: false,
    icon: PATH_TO_ICON,
    webPreferences: {
        preload: PATH_TO_PRELOAD
    }
}

export const load_dict = {
    width: 800,
    height: 600,
    title: "SEDAS manager - loading",
    resizable: false,
    icon: PATH_TO_ICON,
    frame: false,
    webPreferences: {
        preload: PATH_TO_PRELOAD
    }
}


export const settings_dict = {
    width: 1920,
    height: 1080,
    title: "SEDAS manager - settings",
    resizable: true,
    icon: PATH_TO_ICON,
    webPreferences: {
        preload: PATH_TO_PRELOAD
    }
}

export const exit_dict = {
    width: 500,
    height: 300,
    title: "SEDAS manager - exit tray",
    resizable: false,
    icon: PATH_TO_ICON,
    frame: false,
    webPreferences: {
        preload: PATH_TO_PRELOAD
    }
}

export const controller_dict = {
    title: "SEDAS manager - control",
    resizable: true,
    icon: PATH_TO_ICON,
    frame: true,
    //focusable: true,
    webPreferences: {
        preload: PATH_TO_PRELOAD
    }
}

export const worker_dict = {
    title: "SEDAS",
    resizable: false,
    icon: PATH_TO_ICON,
    //frame: false, //TODO turn off when testing
    //focusable: false, //same here
    webPreferences: {
        preload: PATH_TO_PRELOAD
    }
}

export const basic_worker_widget_dict = {
    width: 300,
    height: 300,
    title: "SEDAS widget",
    resizable: true,
    icon: PATH_TO_ICON,
    frame: false,
    webPreferences: {
        preload: PATH_TO_PRELOAD
    }
}

export const popup_widget_dict = {
    width: 500,
    height: 300,
    title: "SEDAS popup",
    resizable: false,
    icon: PATH_TO_ICON,
    frame: false,
    webPreferences: {
        preload: PATH_TO_PRELOAD
    }
}

/*
    Window classes
*/

class BaseWindow{
    public window!: BrowserWindow;
    public win_type: string = "none";
    public isClosed: boolean = false;
    public win_coordinates!: number[];
    public path_load!: string;
    public localConfig: any = {}; //contains local config of window
    public window_id!: string;
    public event_logger!: EventLoggerInterface;
    public display_resolution!: number[];

    public close(){
        if (!this.isClosed){
            this.window.close()
        }
        this.isClosed = true
    }

    public show(path: string = ""){
        if (path.length != 0){
            //rewrite path_load (used for controller window_manipulation
            this.path_load = path
        }

        this.isClosed = false
        this.window.loadURL(this.path_load)
        this.window.show()
    }

    public send_message(channel: string, message: any){
        this.window.webContents.postMessage(channel, message)
    }
}

export class Window extends BaseWindow{
    public checkClose(callback: any = undefined){
        this.window.on("closed", () => {
            this.isClosed = true
            if (callback != undefined){
                callback()
            }
        })
    }

    public constructor(app_status: Record<string, boolean>,
        dev_panel: boolean = false,
        config: any,
        path: string,
        coords: Coords<number, number>,
        ev_logger: EventLoggerInterface,
        main_app: any,
        window_type: string = "none",
        display_res: number[] = []){

        super();

        //generate id for window
        this.window_id = generate_win_id()

        this.win_coordinates = coords
        this.event_logger = ev_logger

        //retype window_type
        this.win_type = window_type
        this.display_resolution = display_res

        Object.assign(this.localConfig, config)

        this.localConfig.x = coords[0]
        this.localConfig.y = coords[1]
        if (display_res.length > 0){
            this.localConfig.width = display_res[0]
            this.localConfig.height = display_res[1]
        }

        this.window = new BrowserWindow(this.localConfig);
        this.window.setMenu(null);

        if (dev_panel){
            this.window.webContents.openDevTools()
        }

        this.path_load = path
        this.window.maximize()

        if (path.includes("main")){
            this.checkClose(() => {
                if (!app_status["redir-to-main"]){
                    this.event_logger.log("DEBUG", "Closing app... Bye Bye")
                    main_app.exit_app()
                }
            })
        }

        this.event_logger.log("DEBUG", `Created window object(win_type=${this.win_type},path_load=${this.path_load}, coords=${coords})`)
    }
}

export class WorkerWindow extends Window{

    public title_bar_height: number;

    public constructor(app_status: Record<string, boolean>,
        dev_panel: boolean = false,
        config: any,
        path: string,
        coords: Coords<number, number>,
        ev_logger: EventLoggerInterface,
        main_app: any,
        window_type: string = "none",
        display_res: number[] = []){

            super(app_status,
                dev_panel,
                config,
                path,
                coords,
                ev_logger,
                main_app,
                window_type,
                display_res
            );

            // Getting title bar height to offset the content and position of the window
            this.title_bar_height = this.window.getBounds().height - this.window.getContentBounds().height
        }

    public show(path: string = ""){
        if (path.length != 0){
            //rewrite path_load (used for controller window_manipulation
            this.path_load = path
        }

        this.isClosed = false
        this.window.loadFile(this.path_load);

        this.window.once("ready-to-show", () => {
            if (this.display_resolution.length > 0 && this.win_coordinates.length > 0){
                this.window.setContentSize(this.display_resolution[0], this.display_resolution[1] - this.title_bar_height)
                this.window.setPosition(this.win_coordinates[0], this.win_coordinates[1] + this.title_bar_height)
                this.window.show()
            }
        })
    }

}

export class LoaderWindow extends BaseWindow{
    public wait_for_load(callback: any){
        return new Promise<void>((resolve, reject) => {
            this.window.webContents.on("did-finish-load", async () => {
                await callback()
                resolve()
            })
        })
    }

    public constructor(config: any, path: string, coords: number[],
        ev_logger: EventLoggerInterface, display_res: (number | undefined)[] = []){

        super()

        this.win_coordinates = coords //store to use later
        this.event_logger = ev_logger

        Object.assign(this.localConfig, config)
        if (display_res.length > 0 && !display_res.includes(undefined)){
            //set resolution according to display resolution
            this.localConfig.width = display_res[0]
            this.localConfig.height = display_res[1]
        }

        this.localConfig.x = coords[0]
        this.localConfig.y = coords[1]

        this.window = new BrowserWindow(this.localConfig);
        this.window.setMenu(null);

        this.path_load = path

        this.event_logger.log("DEBUG", `Created window object(win_type=${this.win_type},path_load=${this.path_load}, coords=${coords})`)
    }
}

export class WidgetWindow extends BaseWindow{

    public wait_for_load(callback: any){
        this.window.webContents.on("did-finish-load", () => {
            callback()
        })
    }

    public minimize(){
        this.window.setSize(this.localConfig.width, 35) //default height of the header
    }

    public maximize(){
        this.window.setSize(this.localConfig.width, this.localConfig.height)
    }

    public constructor(config: any, path: string, coords: number[],
                        ev_logger: EventLoggerInterface){

        super()

        //generate id for window
        this.window_id = generate_win_id()

        this.event_logger = ev_logger
        Object.assign(this.localConfig, config)

        this.localConfig.x = coords[0]
        this.localConfig.y = coords[1]

        this.window = new BrowserWindow(this.localConfig);
        this.window.setMenu(null);
        this.window.setAlwaysOnTop(true);

        this.path_load = path

        this.event_logger.log("DEBUG", `Created worker widget window object(path_load=${this.path_load}, coords=${coords})`)
    }
}

export class PopupWindow extends BaseWindow{
    public popup_type: string;
    private comm_channel: string;

    public constructor(config: any,
                        path: string,
                        coords: number[],
                        ev_logger: EventLoggerInterface,
                        type: string,
                        channel: string){
        super()

        this.event_logger = ev_logger
        Object.assign(this.localConfig, config)

        this.localConfig.x = coords[0]
        this.localConfig.y = coords[1]

        this.path_load = path
        this.popup_type = type
        this.comm_channel = channel

        this.window = new BrowserWindow(this.localConfig);
        this.window.setMenu(null);
        this.window.setAlwaysOnTop(true);

        this.event_logger.log("DEBUG", `Created popup window object(path_load=${this.path_load}, coords=${coords})`)
    }

    public load_popup(header: string, text: string){
        this.show()
        this.wait_for_load(() => {
            this.send_message("popup-init-info", [this.popup_type, this.comm_channel, header, text])
        })
    }

    private wait_for_load(callback: any){
        return new Promise<void>((resolve, reject) => {
            this.window.webContents.on("did-finish-load", async () => {
                await callback()
                resolve()
            })
        })
    }
}

/*
    Window handler classes
*/

export class WidgetWindowHandler{
    private widget_workers: any[] = [];

    public show_all(){
        for (let i = 0; i < this.widget_workers.length; i++){
            this.widget_workers[i]["win"].show()
            this.widget_workers[i]["win"].wait_for_load(() => {
                this.widget_workers[i]["win"].send_message("register", ["id", this.widget_workers[i]["id"]])
            })
        }
    }

    public setup_all(worker_coords: any[], EvLogger: EventLoggerInterface){
        for (let i = 0; i < worker_coords.length; i++){
            //setting up all layer widgets (overlaying whole map) TODO

            // add offset to coord spawn
            let coords = [worker_coords[i][0] + WIDGET_OFFSET, worker_coords[i][1] + WIDGET_OFFSET]

            this.create_widget_window(basic_worker_widget_dict, PATH_TO_WIDGET_HTML, EvLogger, coords)
        }
    }

    public exit_all(wrapper: any){
        for (let i = 0; i < this.widget_workers.length; i++){
            this.widget_workers[i]["win"].close()
            wrapper.unregister_window(this.widget_workers[i]["win"].window_id)
        }
        this.widget_workers = []
    }

    public minimize_widget(data: any[]){
        for (let i = 0; i < this.widget_workers.length; i++){
            if (this.widget_workers[i]["id"] == data[0]){
                this.widget_workers[i]["win"].minimize()
            }
        }
    }

    public maximize_widget(data: any[]){
        for (let i = 0; i < this.widget_workers.length; i++){
            if (this.widget_workers[i]["id"] == data[0]){
                this.widget_workers[i]["win"].maximize()
            }
        }
    }

    public exit_widget(data: any[], wrapper: any){
        for (let i = 0; i < this.widget_workers.length; i++){
            if (this.widget_workers[i]["id"] == data[0]){
                this.widget_workers[i]["win"].close()
                wrapper.unregister_window(this.widget_workers[i]["win"].window_id)

                this.widget_workers.splice(i, 1)
            }
        }
    }


    public create_widget_window(widget_dict: object, path_load: string,
                                        event_logger: EventLoggerInterface,
                                        coords: number[]){
        let datetimeWidgetWindow = new WidgetWindow(widget_dict, path_load, coords, event_logger)
        let datetime_id = generate_id()

        this.widget_workers.push({
            "id": datetime_id,
            "win": datetimeWidgetWindow
        })
    }
}
