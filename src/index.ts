import * as Y from 'yjs';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Table from '@editorjs/table';
import { WebsocketProvider } from 'y-websocket'
import { EditorBinding } from './y-editor';
import { isEqual } from 'lodash/fp';

const holder = document.getElementById('codex-editor1')
// const provider = new WebsocketProvider('wss://demos.yjs.dev', 'editorjs-demo', binding.doc)

// binding.observe('editor2', (data) => {
//   console.log(2222, data);
//   editor2.render(data)
// })

const editor1 = new EditorJS({
  holder,

  tools: {
    header: {
      class: Header,
      inlineToolbar: ['link']
    },
    list: {
      class: List,
      inlineToolbar: true
    },
    table: Table,
  },
})

const ydoc = new Y.Doc()
const binding = new EditorBinding(editor1, holder, ydoc.getArray('docId'))

// @ts-ignore
window.editor = editor1
// @ts-ignore
window.binding = binding

// const editor2 = new EditorJS({
//   holderId: 'codex-editor2',

//   async onChange() {
//     const { blocks } = await editor2.save();
//     if (isEqual(blocks, binding.getState())) return;
//     binding.emitChange({ blocks });
//   },

//   tools: {
//     header: {
//       class: Header,
//       inlineToolbar: ['link']
//     },
//     list: {
//       class: List,
//       inlineToolbar: true
//     },
//   },
// })

