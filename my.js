export async function run(cmd){
    const p = Deno.run({
        cmd: cmd,
        stdout: "piped",
        stderr: "piped",
    });
    //const status = await p.status();
    const rawOutput = await p.output();
    //const rawError = await p.stderrOutput();
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

export const htmlHeader = `<!DOCTYPE html>
<html lang=en>
    <head>
        <meta charset=utf-8>
        <meta name=viewport content="width=device-width">
        <title>Server-Admin - Denomin</title><head>
        <script type=module src="https://cdn.jsdelivr.net/gh/u1ui/u1@3.6.3/auto.min.js"></script>
        <style>
        input, textarea, select, button {
            width:100%;
            margin-top:.2rem;
            margin-bottom:.2rem;
        }
        body {
            padding:1vw;
        }
        </style>
        `


import { verify } from "https://deno.land/x/scrypt/mod.ts";

export async function showLogin(ctx){
    let msg = '';
    if (ctx.request.method === 'POST') {
        const form = await ctx.request.body({type: 'form'}).value
        // how to login as linux user and save in session?
        const pw = form.get('password');
        const tmpTobiHash = 'c2NyeXB0AA4AAAAIAAAAAUNqPIdUjYULJWbb4dx9QTj4kaV7dh+wN602yfpDMwmPfSfOMArIvsU5ngL+ahqjJQvVbBJqwmZwP5/fzq+sR6rrhHtnWkm1PHG1dOV5JdJT';
        if (verify(pw, tmpTobiHash)) {
            // Set persistent data in the session
            await ctx.state.session.set('user','tobi...');
            // Set flash data in the session. This will be removed the first time it's accessed with get
            //await ctx.state.session.flash('message', 'Login successful');
            ctx.response.redirect(ctx.request.url);
        } else {
            msg = '<h3>Failed!</h3>';
        }
    }
    ctx.response.type = 'html';
    ctx.response.body = `${htmlHeader}
        <body>
        <form method=post style="max-width:20rem; margin:auto">
            ${msg}
            <label>
                <span>Username:</span>
                <input name=username placeholder=Username autofocus>
            </label>
            <label>
                Password:
                <input type=password name=password placeholder=Password>
            </label>
            <button style="margin-top:1rem">Login</button>
        </form>
    `;
}


export async function listDir(dir) {
    const names = [];
    for await (const dirEntry of Deno.readDir(dir)) {
        names.push({
            name:dirEntry.name,
            type: dirEntry.isDirectory ? 'directory' : 'file',
        });
    }
    return names;
}

export function htmlEscape(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
