/*
    All IPCMessage types declared here
*/
export type IPCMessage = {
    "map-checked": [{
        "user-check": boolean
    }],
    "app-data": [Record<string, any>],
    "ack": string[],
    "nack": string[]
}