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
    // this.state = this.doc.getMap('test doc')
    // this.state.observeDeep((evts, tr) => {
    //   // this.emitChange(this.getState())
    //   this.listeners.forEach((handler) => {
    //     handler(this.getState())
    //   })
    // })
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
    let contentMutated = false;
    const changedBlockElements = []

    mutationList.forEach((mutation) => {
      const target = mutation.target as Element
      const blockSelector = '.' + Block.CSS.wrapper

      switch (mutation.type) {
        case 'childList':
        case 'characterData':
          changedBlockElements.push(
            target.closest 
              ? target.closest(blockSelector) 
              : target.parentElement.closest(blockSelector)
          )
          contentMutated = true;
          break;
        case 'attributes':
          /**
           * Changes on Element.ce-block usually is functional
           */
          if (!target.classList.contains(Block.CSS.wrapper)) {
            contentMutated = true;
            changedBlockElements.push(
              target.closest 
                ? target.closest(blockSelector) 
                : target.parentElement.closest(blockSelector)
            )
          }
          break;
      }
    });

    /** call once */
    if (contentMutated) {
      // change event
      console.log('------ binding onchange:', changedBlockElements);

      this.onBlockChange(changedBlockElements.filter(Boolean))
    }
  }

  private onBlockChange(changedElements: Element[]) {

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