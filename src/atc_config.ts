/*
    Configuration file for all ATC paradigms used in this app
*/

export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
export const NUMS = "0123456789"

export const NATO_ALPHA = {
    "A": "alpha",
    "B": "beta",
    "C": "charlie",
    "D": "delta",
    "E": "echo",
    "F": "foxtrot",
    "G": "golf",
    "H": "hotel",
    "I": "india",
    "J": "juliet",
    "K": "kilo",
    "L": "lima",
    "M": "mike",
    "N": "november",
    "O": "oscar",
    "P": "papa",
    "Q": "quebec",
    "R": "romeo",
    "S": "sierra",
    "T": "tango",
    "U": "uniform",
    "V": "victor",
    "W": "whiskey",
    "X": "x-ray",
    "Y": "yankee",
    "Z": "zulu"
}
export const NATO_NUMS = {
    "0": "zero",
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "niner"
}

export function generate_callsign(){
    // Generating callsign for plane

    let out = ""

    for (let i_code = 0; i_code < 3; i_code++){
        out += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
    }

    //randomize selection of 4 or 3 digits
    var rand_len = Math.floor(Math.random() * 2)
    let i_sign_max = 0

    if (rand_len == 1) i_sign_max = 3
    else i_sign_max = 4

    for (let i_sign = 0; i_sign < i_sign_max; i_sign++){
        out += NUMS.charAt(Math.floor(Math.random() * NUMS.length))
    }
    
    return out
}

export class CallsignGenerator{
    //TODO: finish generated callsigns, etc.
}