import * as Y from 'yjs';
import uuid from 'uuid/dist/v4';
import EditorJS from '@editorjs/editorjs';
import { isPlainObject, isString } from 'lodash/fp';


// from editor.js
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
  yArray: Y.Array<any>

  observer: MutationObserver

  holder: HTMLElement

  editor: EditorJS

  isReady: Promise<any>

  constructor(editor, holder, yArray) {
    this.holder = holder
    this.editor = editor
    this.yArray = yArray
    this.isReady = this.initYDoc()
    this.setObserver()
  }

  private async initYDoc() {
    await this.editor.isReady
    await this.editor.blocks.render({ 
      blocks: this.yArray.toArray()
    })  
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
    const changed = []

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
      const blockElements = Array.from(this.holder.querySelectorAll(blockSelector))
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
            changed.push({
              changeType,
              blockElement,
              index: blockElements.indexOf(blockElement),
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
              changed.push({
                changeType,
                blockElement,
                index: blockElements.indexOf(blockElement),
              });
            }
            break;
          }
      }
    });

    if (changed.length > 0) {
      this.onBlockChange(changed)
    }
  }

  private async onBlockChange(changed) {
    const blockCount = this.editor.blocks.getBlocksCount()
    const blocks = []
    for (let i = 0; i < blockCount; i += 1) {
      blocks.push(this.editor.blocks.getBlockByIndex(i))
    }

    // todo: maybe optimize, merge call save()
    for await (const { changeType, blockElement, index } of changed) {
      const savedData = await blocks[index]?.save()
      switch (changeType) {
        case 'add':
          const blockId = uuid()
          blockElement.setAttribute('data-block-id', blockId)
          this.yArray.insert(index, [{ type: savedData.tool, data: savedData.data }])
          break;
        case 'remove':
          this.yArray.delete(index, 1)
          break;
        case 'update':
          // todo: diff block data and doc data
          // diff(blocks.find(block => block.holder === blockElement), this.doc.getMap('<uuid>'))
          this.yArray.delete(index, 1)
          this.yArray.insert(index, [await blocks[index].save()])
          this.yArray.insert(index, [{ type: savedData.tool, data: savedData.data }])
          break;
      }
    }

    console.log('------ binding onchange:', changed, this.yArray.toJSON());
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