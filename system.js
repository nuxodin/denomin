import * as my from './my.js';

// linux
// https://www.looklinux.com/how-to-check-memory-usage-on-linux-centosrhel/
// # /proc/meminfo
// # vmstat
// # free




export async function physicalMemoryFree(){
    const val = await my.run(["cmd", "/c", "wmic OS get FreePhysicalMemory"]);
    return val.split("\r\n")[1].trim();
}


export async function physicalMemoryTotal(){
    const val = await my.run(["cmd", "/c", "wmic ComputerSystem get TotalPhysicalMemory"]);
    return val.split("\r\n")[1].trim();
}

export async function bootTime(){
    const val = await my.run(["cmd", "/c", "wmic os get lastbootuptime"]);
    return my.yyyymmddhhmmssToDate( val.split("\r\n")[1].trim() );
}
export async function systemTime(){
    const val = await my.run(["cmd", "/c", "wmic os get LocalDateTime"]);
    // system time for linux
    //const valLinux = await my.run(["cmd", "/c", "date"]);



    return my.yyyymmddhhmmssToDate( val.split("\r\n")[1].trim() );
}
