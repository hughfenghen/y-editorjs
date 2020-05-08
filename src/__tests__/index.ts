import * as Y from 'yjs';
import * as Diff from 'diff';
import { EditorBinding } from '../y-editor';
import EditorJS from '@editorjs/editorjs';
import { omit } from 'lodash/fp';

test('ytext 更新节点属性', () => {
  const doc = new Y.Doc()
  const txt = doc.getText('xxx')
  txt.insert(0, '<img src="aaa"></img>')
  txt.delete(10, 3)
  txt.insert(10, 'bbb')
  expect(txt.toString()).toBe('<img src="bbb"></img>')
})

test('Y.Array中的元素不会被改变引用', () => {
  const doc = new Y.Doc()
  const yarr = doc.getArray('ttt')
  const data = {}
  yarr.insert(0, [data])
  expect(yarr.toArray()[0]).toBe(data)
})

test('diff merge patch', () => {
  const oldStr = 'aaaaaaaa'
  const newStr = 'aaaabbbbaaabba'
  const patch = Diff.createPatch(null, oldStr, newStr)
  expect(Diff.applyPatch(oldStr, patch)).toBe(newStr)
  // base变化，无法合并
  expect(Diff.applyPatch('111', patch)).toBe(false)
})

test('ytext 多个删除操作索引', () => {
  const doc = new Y.Doc()
  const txt = doc.getText('ytext 多个删除操作索引')
  txt.insert(0, '0123456789')
  doc.transact(() => {
    txt.delete(1, 3)
    txt.delete(4, 3)
    // 每次操作，索引实时更新
    expect(txt.toString()).toBe('0456')
  })
})

test('内容相同的doc的update无法直接合并，必须有一个共同起点', (done) => {
  const doc1 = new Y.Doc()
  const doc2 = new Y.Doc()
  const a1 = doc1.getArray('arr')
  const a2 = doc2.getArray('arr')
  a1.push([1])
  a2.push([1])

  doc1.on('update', (update) => {
    Y.applyUpdate(doc2, update)
    expect(a1.toJSON()).not.toEqual(a2.toJSON())
    done()
  })
  a1.push([2])
})

function createEditor() {
  const holder = document.createElement('div')
  const editor = new EditorJS({
    holder,
    // @ts-ignore https://github.com/kulshekhar/ts-jest/issues/281
    logLevel: 'ERROR',
  })
  return { editor, holder }
}

test('ydoc初始化数据同步到editor.js', async () => {
  const { editor, holder } = createEditor()
  const ydoc = new Y.Doc()
  const yArray = ydoc.getArray('docId')
  const blockData = [
    {
      "type": "paragraph",
      "data": {
        "text": "111"
      },
    },
  ]
  yArray.push(blockData)
  const binding = new EditorBinding(editor, holder, yArray)
  await binding.isReady
  expect((await editor.save()).blocks).toEqual(blockData)
})

test('ydoc更新数据同步到editor.js', async () => {
  const { editor, holder } = createEditor()
  const ydoc = new Y.Doc()
  const yArray = ydoc.getArray('docId')
  const binding = new EditorBinding(editor, holder, yArray)
  const blockData = [
    {
      "type": "paragraph",
      "data": {
        "text": "111"
      },
      uuid: 'test-id'
    }
  ]
  yArray.push(blockData)

  await binding.isReady
  expect((await editor.save()).blocks).toEqual(blockData.map(omit('uuid')))
  expect(editor.blocks.getBlockByIndex(0).holder.dataset.blockId).toBe('test-id')
})
