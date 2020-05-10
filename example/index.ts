import * as Y from 'yjs';
import EditorJS from '@editorjs/editorjs';
import { WebsocketProvider } from 'y-websocket'
import { EditorBinding } from '../src/y-editor';

const holder1 = document.getElementById('codex-editor1')
const editor1 = new EditorJS({
  holder: holder1,
})

const ydoc1 = new Y.Doc()

const provider = new WebsocketProvider('wss://demos.yjs.dev', 'editorjs-demo', ydoc1)

const binding1 = new EditorBinding(editor1, holder1, ydoc1.getArray('docId'))

// @ts-ignore
window.editor = editor1
// @ts-ignore
window.binding = binding1
