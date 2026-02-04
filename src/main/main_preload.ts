/*
    Preload running before the whole app startup
*/

export function parse_args(){
    let proc_args: string[] = process.argv
    let args: string[] = []
    if (proc_args[0].includes("electron")) args = proc_args.slice(2) // Development mode
    else args = proc_args.slice(1) // Production

    let processed_args: Record<string, string> = {}
    args.forEach(elem => {
        let name = elem.split("=")[0].substring(2)
        let value = elem.split("=")[1]

        processed_args[name] = value
    })
    
    return processed_args
}