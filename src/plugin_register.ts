/*
    File that handles plugins, their fetching, registering, etc.
*/

export class PluginRegister{
    public plugin_list: object[] = []

    public fetch_plugin_list(){
        //TODO
    
        let initial_list = [
            {
                "header": {
                    "id": "asdasdsdasdasd4561" //TODO
                },
                "data": {
                    "plugin": "SEDAC MapBuilder",
                    "version": "ver 1.0.0",
                    "last-updated": "Last week",
                    "installed": true
                }
            },
            {
                "header": {
                    "id": "abfhagbakgnk"
                },
                "data": {
                    "plugin": "Lorem Ipsum",
                    "version": "ver 1.0.0",
                    "last-updated": "Last year",
                    "installed": false
                }
            },
            {
                "header": {
                    "id": "angjkang"
                },
                "data": {
                    "plugin": "Map Randgen",
                    "version": "ver 1.0.0",
                    "last-updated": "Last year",
                    "installed": false
                }
            }
        ]
    
        this.plugin_list = initial_list
    }

    public load_local_plugins(){

    }
}