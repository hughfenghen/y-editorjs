import * as Y from 'yjs';
import { isPlainObject, isString, uniqueId, isEqual } from 'lodash/fp';


export class EditorBinding {
  state = null
  listeners = new Map<string, Function>()
  doc = new Y.Doc()

  constructor(docName) {
    this.state = this.doc.getMap(docName)
    this.state.observeDeep((evts, tr) => {
      // this.emitChange(this.getState())
      this.listeners.forEach((handler) => {
        handler(this.getState())
      })
    })
  }

  // init(json) {
  //   if (Array.isArray(json)) {
  //     this.state = doc.getArray(this.bindingName)
  //     this.state.push(json.map((it) => jsonMap2Y(it)))
  //   } else if (isPlainObject(json)) {
  //     this.state = doc.getMap(this.bindingName)
  //     for (const key in json) {
  //       this.state.set(key, jsonMap2Y(json[key]))
  //     }
  //   }

  //   return this.state
  // }

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