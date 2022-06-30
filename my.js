export async function run(cmd){
    const p = Deno.run({
        cmd: cmd,
        stdout: "piped",
        stderr: "piped",
    });
    //const status = await p.status();
    const rawOutput = await p.output();
    const rawError = await p.stderrOutput();
    return new TextDecoder().decode(rawOutput);
    /*
    return {
        output: new TextDecoder().decode(rawOutput),
        error: new TextDecoder().decode(rawError),
    }
    */
}

export function yyyymmddhhmmssToDate(value){
    return new Date(value.replace(
        /^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)\..*$/,
        '$4:$5:$6 $2/$3/$1'
    ));
}
