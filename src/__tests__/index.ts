import * as Y from 'yjs';
import * as Diff from 'diff';
import { EditorBinding } from '../y-editor';

test('ytext 更新节点属性', () => {
  const doc = new Y.Doc()
  const txt = doc.getText('xxx')
  txt.insert(0, '<img src="aaa"></img>')
  txt.delete(10, 3)
  txt.insert(10, 'bbb')
  expect(txt.toString()).toBe('<img src="bbb"></img>')
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

// test('EditorBinding 监听变化', (cb) => {
//   const binding = new EditorBinding('ttt')
//   const data = { blocks: [{ type: 'paragraph', data: {} }] }
//   binding.observe('other', (val) => {
//     expect(val).toEqual(data)
//     cb()
//   })
//   binding.observe('test', (val) => {
//     throw new Error('不应该触发自己的订阅')
//   })
//   binding.emitChange(data)
//   expect(binding.getState()).toEqual(data)
// })

test('EditorBinding 重复提交不触发更新', () => {
  const binding = new EditorBinding('ttt')
  const data = { blocks: [{ type: 'paragraph', data: {} }] }
  binding.emitChange(data)
  binding.observe('other', (val) => {
    throw new Error('重复提交不触发更新')
  })
  binding.emitChange(data)
  expect(binding.getState()).toEqual(data)
})