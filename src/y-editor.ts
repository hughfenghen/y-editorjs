import * as Y from 'yjs';
import EditorJS from '@editorjs/editorjs';
import { isPlainObject, isString, uniqueId, isEqual } from 'lodash/fp';


// editor.blocks.delete(0); editor.blocks.insert(b1.name, (await b1.save()).data, b1.config)

// from editorjs
const Block = {
  CSS: {
    wrapper: 'ce-block',
    wrapperStretched: 'ce-block--stretched',
    content: 'ce-block__content',
    focused: 'ce-block--focused',
    selected: 'ce-block--selected',
    dropTarget: 'ce-block--drop-target',
  }
}

export class EditorBinding {
  state = null
  listeners = new Map<string, Function>()
  doc = new Y.Doc()

  observer: MutationObserver

  holder: HTMLElement

  editor: EditorJS

  constructor(editor, holder) {
    this.holder = holder
    this.editor = editor
    this.setObserver()
    this.initYDoc()
    // this.state = this.doc.getMap('test doc')
    // this.state.observeDeep((evts, tr) => {
    //   // this.emitChange(this.getState())
    //   this.listeners.forEach((handler) => {
    //     handler(this.getState())
    //   })
    // })
  }

  private async initYDoc() {
    await this.editor.isReady
    console.log(
      '------- initYDoc',
      await this.editor.save(),
      jsonMap2Y(await this.editor.save()).toJSON()
    );
  }

  private async setObserver() {
    const observerOptions = {
      childList: true,
      attributes: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    };

    this.observer = new MutationObserver((mutationList, observer) => {
      this.mutationHandler(mutationList, observer);
    });
    await this.editor.isReady
    this.observer.observe(this.holder.querySelector('.codex-editor__redactor'), observerOptions)
  }

  private mutationHandler(mutationList: MutationRecord[], observer): void {
    /**
     * We divide two Mutation types:
     * 1) mutations that concerns client changes: settings changes, symbol added, deletion, insertions and so on
     * 2) functional changes. On each client actions we set functional identifiers to interact with user
     */
    const changedBlockElements = []

    mutationList.forEach((mutation) => {
      const target = mutation.target as Element
      const blockSelector = '.' + Block.CSS.wrapper

      function findChangedBlockElement(el) {
        // text element not contains closest
        return el.closest
          ? el.closest(blockSelector)
          // parentElement is null when text element removed
          : el.parentElement?.closest(blockSelector)
      }

      const { addedNodes, removedNodes } = mutation
      const changeType = addedNodes.length
        ? 'add'
        : removedNodes.length
          ? 'remove'
          : 'update'

      switch (mutation.type) {
        case 'childList':
        case 'characterData':
          const blockElement = findChangedBlockElement(target)
          if (blockElement) {
            changedBlockElements.push({
              changeType,
              blockElement,
            });
          }
          break;
        case 'attributes':
          /**
           * Changes on Element.ce-block usually is functional
           */
          if (!target.classList.contains(Block.CSS.wrapper)) {
            const blockElement = findChangedBlockElement(target)
            if (blockElement) {
              changedBlockElements.push({
                changeType,
                blockElement,
              });
            }
            break;
          }
      }
    });

    if (changedBlockElements.length > 0) {
      this.onBlockChange(changedBlockElements)
    }
  }

  private onBlockChange(changedElements: HTMLElement[]) {
    const blockCount = this.editor.blocks.getBlocksCount()
    const blocks = []
    for (let i = 0; i < blockCount; i += 1) {
      blocks.push(this.editor.blocks.getBlockByIndex(i))
    }
    const changedBlocks = blocks.filter(block => changedElements.includes(block.holder))

    // changedElements.forEach(el => {
    //   if (!el.dataset.blockId) { 
    //     el.setAttribute('data-block-id', '')
    //   }
    // })

    console.log('------ binding onchange:', changedElements, changedBlocks);
  }

  getState() {
    return this.state.toJSON()
  }

  updateDoc(json) {
    for (const key in json) {
      this.state.set(key, jsonMap2Y(json[key]))
    }
  }

  emitChange(newData) {
    if (isEqual(newData, this.getState())) return;

    this.updateDoc(newData)
  }

  observe(bindingName, handler) {
    this.listeners.set(bindingName, handler)
  }
}


export function jsonMap2Y(json) {
  if (Array.isArray(json)) {
    const arr = new Y.Array()
    const rs = json.map((it) => jsonMap2Y(it))
    arr.push(rs)
    return arr
  } else if (isPlainObject(json)) {
    const map = new Y.Map()
    for (const key in json) {
      map.set(key, jsonMap2Y(json[key]))
    }
    return map
  } else if (isString(json)) {
    return new Y.Text(json)
  }
  return json
}

export function changes2ops() {

}