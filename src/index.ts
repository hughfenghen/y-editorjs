import * as Y from 'yjs';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Table from '@editorjs/table';
import { WebsocketProvider } from 'y-websocket'
import { EditorBinding } from './y-editor';
import { isEqual } from 'lodash/fp';


const binding = new EditorBinding('tttt')
const provider = new WebsocketProvider('wss://demos.yjs.dev', 'editorjs-demo', binding.doc)

// binding.observe('editor2', (data) => {
//   console.log(2222, data);
//   editor2.render(data)
// })

const editor1 = new EditorJS({
  holderId: 'codex-editor1',

  async onChange() {
    console.time('onChange')
    const { blocks } = await editor1.save()
    binding.emitChange({ blocks })
    console.timeEnd('onChange')
  },

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
// @ts-ignore
window.editor = editor1

binding.observe('editor1', async (data) => {
  console.log(1111, data, editor1);
  await editor1.isReady
  editor1.render(data)
})

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

