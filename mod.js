import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
//import {dump} from 'https://cdn.jsdelivr.net/gh/nuxodin/dump.js@1.2.1/mod.min.js';
import * as my from './my.js';
import * as system from './system.js';
import { Session } from "https://deno.land/x/oak_sessions/mod.ts"
import { typeByExtension } from "https://deno.land/std@0.145.0/media_types/mod.ts";

const port = 8761;
const app = new Application();
const router = new Router();
const session = new Session()

app.use(session.initMiddleware());

// force login
app.use(async (ctx, next) => {
    const user = await ctx.state.session.get('user');
    if (user) await next();
    else await my.showLogin(ctx);
});


router.get('/', async (ctx) => {

    const free = await system.physicalMemoryFree();
    const available = await system.physicalMemoryTotal();
    const memoryHtml = `
    Memory: <small>${available - free} / ${available}</small>
    <progress value="${available - free}" max="${available}"></progress>
    `;

    const bootedAt = await system.bootTime();
    const systemTime = await system.systemTime();


    ctx.response.type = 'html';
    ctx.response.body = `${my.htmlHeader}
            <body>

            Last boot:
            <span>
                <u1-time datetime="${bootedAt.toISOString()}" hour minute></u1-time>
                <u1-tooltip>
                    <u1-time datetime="${bootedAt.toISOString()}" hour minute type=date></u1-time>
                </u1-tooltip>
            </span>

            <br>
            System time: <u1-time type=date datetime="${systemTime.toISOString()}" hour minute></u1-time><br>
            ${memoryHtml}
        `;
});


// save api
router.post('/file/:file(.*)', async (ctx, next) => {
    const file = ctx.params.file;
    if (ctx.request.method === 'POST') {
        const data = ctx.request.body();
        const obj = await data.value;
        await Deno.writeTextFile(file, obj.content);
        ctx.response.body = {};
    }
});
// show edit
router.get('/file/:file(.*)', async (ctx, next) => {
    const file = ctx.params.file;
    const line = ctx.request.url.searchParams.get('line');
    const col = ctx.request.url.searchParams.get('col');


    const version = '5.65.5';
    const url = `https://cdn.jsdelivr.net/npm/codemirror@${version}`;
    const min = 'min.';

    const ext = file.replace(/.*\./, '');
    let mime = typeByExtension(ext);
    if (!mime) mime = 'text/plain';
    if (mime === 'image/svg+xml') mime = 'application/xml';
    mime = mime.replace('application/x-javascript', 'text/javascript');

    const content = await Deno.readTextFile(file);


    ctx.response.body = `${my.htmlHeader}
        <link rel="stylesheet" href="${url}/lib/codemirror.${min}css">
        <link rel="stylesheet" href="${url}/theme/eclipse.${min}css">
        <script src="${url}/lib/codemirror.${min}js"></script>
        <script src="${url}/addon/hint/show-hint.${min}js"></script>
        <link rel="stylesheet" href="${url}/addon/hint/show-hint.${min}css">
        <script src="${url}/addon/hint/javascript-hint.${min}js"></script>
        <script src="${url}/addon/scroll/annotatescrollbar.${min}js"></script>
        <script src="${url}/addon/search/matchesonscrollbar.${min}js"></script>
        <script src="${url}/addon/search/searchcursor.${min}js"></script>
        <script src="${url}/addon/search/match-highlighter.${min}js"></script>
        <script src="${url}/addon/fold/xml-fold.${min}js"></script>
        <script src="${url}/addon/edit/matchtags.${min}js"></script>
        <script src="${url}/addon/edit/trailingspace.${min}js"></script>
        <script src="${url}/mode/xml/xml.${min}js"></script>
        <script src="${url}/mode/javascript/javascript.${min}js"></script>
        <script src="${url}/mode/css/css.${min}js"></script>
        <script src="${url}/mode/clike/clike.${min}js"></script>
        <script src="${url}/mode/php/php.${min}js"></script>
        <script src="${url}/mode/htmlmixed/htmlmixed.${min}js"></script>
        <script src="${url}/keymap/sublime.${min}js"></script>
        <style>
        .markLine {
            background:rgba(255,255,180,.8);
        }
        html, body {
            height:100%;
            margin:0 !important;
        }
        .CodeMirror { height:100%; background:#fff; }
        .CodeMirror-scroll { height:100%; }
        .CodeMirror-gutter { min-width:.5em; }

        /* matchhighlighter */
        .CodeMirror-focused .cm-matchhighlight {
            background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQI12NgYGBgkKzc8x9CMDAwAAAmhwSbidEoSQAAAABJRU5ErkJggg==);
            background-position: bottom;
            background-repeat: repeat-x;
        }
        .cm-matchhighlight {background-color: #90ee9088}
        .CodeMirror-selection-highlight-scrollbar {background-color: green}

        /* trailing space */
        .cm-trailingspace {
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QUXCToH00Y1UgAAACFJREFUCNdjPMDBUc/AwNDAAAFMTAwMDA0OP34wQgX/AQBYgwYEx4f9lQAAAABJRU5ErkJggg==);
          background-position: bottom left;
          background-repeat: repeat-x;
        }

        /* new */
        .CodeMirror {
            line-height:normal;
            font-size:12px;
            scroll-behavior: auto;
        }
        .CodeMirror * {
            line-height:normal;
            scroll-behavior: auto;
        }

        </style>
        <body style="padding:0">
            <button
			class=q1Rst
			id=saveButton
			style="position:fixed;
					right:0;
					top:10px;
                    width:auto;
					z-index:10;
					padding:10px 12px;
					display:none;
					background-image: linear-gradient(rgba(255,255,255,.5),rgba(205,205,205,.5));">
            ${1?'save':'rechte zum speichern fehlen!'}
		</button>
		<div style="height:100%; width:100%">
			<textarea id=editor name="textareaContentCanBeCachedOnReload${Math.random()}" mime="${mime}" line="${line??''}" col="${col??''}" style="width:100%; height:100%;">${my.htmlEscape(content)}</textarea>
		</div>


        <script>



        async function postData(url, data) {
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            return response.json();
        }



        const btn = document.getElementById('saveButton');
        const editorEl = document.getElementById('editor');
        const mime   = editorEl.getAttribute('mime');
        let cmLine = editorEl.getAttribute('line')-1;
        const cmCol  = editorEl.getAttribute('col')-1;

        async function saveFile(content){
            btn.style.backgroundColor = '#fea';
            const res = await postData(location.href, {content});
            if ('todo') {
                btn.style.backgroundColor = '';
                btn.style.display = 'none';
            }
        };

        btn.addEventListener('click',()=>{
            saveFile(editor.getValue());
        });


        function saveEvent(e){
            if (e.key === 's' && e.ctrlKey) {
                btn.dispatchEvent(new Event('click'));
                e.preventDefault();
            }
        }
        var editor = CodeMirror.fromTextArea(editorEl, {
            lineNumbers: true,
            theme:       'eclipse',
            mode:        {name:mime, globalVars:true},
            keyMap:      'sublime',
            extraKeys:   {"Ctrl-Space": "autocomplete"},
            lineWrapping:true,
            matchTags:   {bothTags: true},
            showTrailingSpace: true,
            indentWithTabs: true,
            smartIndent: true,
            indentUnit: 4,
            tabSize: 4,
            highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true},
        });
        editor.focus();
        editor.getWrapperElement().ownerDocument.addEventListener('keydown', saveEvent, 0);

        editor.on('change', e=>{
            btn.style.display = 'block';
            btn.style.backgroundColor = '#faa';
        });

        if (cmLine !== '' && cmLine !== -1) {
            cmLine = parseInt(cmLine);
            setTimeout(()=>{
                editor.setCursor(cmLine, cmCol);
                editor.addLineClass(cmLine, null, 'markLine');
                const line = document.querySelector('.CodeMirror-lines .markLine');
                line && line.scrollIntoView({ behavior: 'auto', block:'center'});
            }, 200);
        }
        </script>
        `;

    await next();
});



router.get('/files', async (ctx) => {
    const items = await my.listDir('/');

    ctx.response.type = 'html';
    ctx.response.body = `${my.htmlHeader}
            <body>
            <u1-tree1 name="" id=fileRoot>
                Files
                ${items.map(item=>`<u1-tree1 aria-expanded aria-live=off name="${item.name}">${item.name}</u1-tree1>`).join('')}
            </u1-tree1>
            <script>
            fileRoot.addEventListener('u1-tree1-expand',e=>{
                const tree = e.target;
                if (e.load) {
                    const path = e.target.path().map(el=>el.getAttribute('name'));
                    const encPath = encodeURI(path.join('/'));
                    const load = fetch('/api/dirlist/' + encPath).then(r=>r.json()).then(data=>{
                        let html = '';
                        data.forEach(item=>{
                            const attr = item.type==='file'?'':'aria-expanded aria-live=off';
                            const icon = item.type==='file'?'📄':'📁';
                            html +=
                            '<u1-tree1 '+attr+' name="'+item.name+'">'+
                                '<span slot=icon>'+icon+'</span>'+
                                '<a href="/file/'+encPath+'/'+encodeURI(item.name)+'">'+
                                    item.name+
                                '</a>'+
                            '</u1-tree1>';
                        });
                        tree.innerHTML += html;
                    });
                    e.load(load);
                }
            });
            </script>
        `;
});
//router.get('/api/:x(.*)', (ctx, next) => {


// serve directory listing
app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.startsWith('/api/dirlist')) {
        const path = ctx.request.url.pathname.split('/api/dirlist/')[1];
        const names = await my.listDir(decodeURI(path));
        ctx.response.body = names;
    } else {
        await next();
    }
});

app.use(router.routes());
//app.use(router.allowedMethods());






app.addEventListener('listen', () => {
  console.log(`Listening on localhost:${port}`);
});
await app.listen({ port });
