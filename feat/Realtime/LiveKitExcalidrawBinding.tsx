/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import type { LiveKitYjsProvider } from '@/feat/Realtime/LiveKitYjsProvider' // sesuaikan path
import * as Y from 'yjs'
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExcalidrawElement {
  id: string
  type: string
  version: number
  [key: string]: unknown
}

export interface ExcalidrawFile {
  id?: string
  mimeType: string
  dataURL: string
  created: number
  [key: string]: unknown
}

export type ExcalidrawFiles = Record<string, ExcalidrawFile>

/** Subset dari Excalidraw API yang dibutuhkan binding */
export interface ExcalidrawAPI {
  getSceneElements(): readonly ExcalidrawElement[]
  updateScene(opts: {
    elements?: ExcalidrawElement[]
    collaborators?: Map<string, CollaboratorState>
  }): void
  addFiles(files: ExcalidrawFile[]): void
  onChange(
    callback: (
      elements: readonly ExcalidrawElement[],
      state: AppState,
      files: ExcalidrawFiles
    ) => void
  ): () => void
}

export interface AppState {
  cursorButton: 'up' | 'down'
  selectedElementIds: Record<string, boolean>
  [key: string]: unknown
}

export interface CollaboratorState {
  pointer?: { x: number; y: number }
  button?: string
  selectedElementIds?: Record<string, boolean>
  username?: string
  color?: { background: string; stroke: string }
  avatarUrl?: string
  userState?: string
}

// Internal tracker untuk posisi fractional-indexing
interface ElementMeta {
  id: string
  version: number
  pos: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isValidElement = (el: unknown): el is ExcalidrawElement => {
  if (!el || typeof el !== 'object') return false
  const e = el as Record<string, unknown>
  return typeof e.id === 'string' && typeof e.type === 'string' && typeof e.version === 'number'
}

const areElementsSame = (a: ElementMeta[], b: readonly ExcalidrawElement[]) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].version !== b[i].version) return false
  }
  return true
}

export const yjsToExcalidraw = (yElements: Y.Array<Y.Map<unknown>>): readonly ExcalidrawElement[] =>
  yElements
    .toArray()
    .sort((a, b) => {
      const p1 = a.get('pos') as string
      const p2 = b.get('pos') as string
      return p1 > p2 ? 1 : p1 < p2 ? -1 : 0
    })
    .map((m) => m.get('el') as ExcalidrawElement)
    .filter(isValidElement)
    .map((el) => ({ ...el }))

const metaFromYArray = (yElements: Y.Array<Y.Map<unknown>>): ElementMeta[] =>
  yElements
    .toArray()
    .filter((m) => isValidElement(m.get('el')))
    .map((m) => ({
      id: (m.get('el') as ExcalidrawElement).id,
      version: (m.get('el') as ExcalidrawElement).version,
      pos: m.get('pos') as string,
    }))
    .sort((a, b) => (a.pos > b.pos ? 1 : a.pos < b.pos ? -1 : 0))

// ---------------------------------------------------------------------------
// Diff & Apply (self-contained, tidak bergantung pada bundel lama)
// ---------------------------------------------------------------------------

interface UpdateOp {
  type: 'update'
  id: string
  index: number
  element: ExcalidrawElement
}
interface BulkAppendOp {
  type: 'bulkAppend'
  data: { id: string; pos: string; element: ExcalidrawElement }[]
}
interface BulkDeleteOp {
  type: 'bulkDelete'
  data: { id: string; index: number }[]
}
interface MoveOp {
  type: 'move'
  id: string
  fromIndex: number
  toIndex: number
  pos: string
}

type Operation = UpdateOp | BulkAppendOp | BulkDeleteOp | MoveOp

interface DiffResult {
  operations: Operation[]
  lastKnownElements: ElementMeta[]
}

const getDelta = (lastKnown: ElementMeta[], next: readonly ExcalidrawElement[]): DiffResult => {
  interface IdEntry {
    id: string
    version: number
    pos: string
    index: number
  }
  const idMap: Record<string, IdEntry> = {}
  const elementIds: string[] = lastKnown.map((m, i) => {
    idMap[m.id] = { ...m, index: i }
    return m.id
  })

  const rebuildIndex = () => {
    elementIds.forEach((id, i) => {
      idMap[id] = { ...idMap[id], index: i }
    })
  }

  const updateOps: UpdateOp[] = []
  const appendItems: { id: string; element: ExcalidrawElement }[] = []
  const deleteOps: { id: string; index: number }[] = []
  const moveOps: MoveOp[] = []

  // Pass 1: updates + new elements
  for (const el of next) {
    if (idMap[el.id]) {
      if (el.version !== idMap[el.id].version) {
        idMap[el.id].version = el.version
        updateOps.push({ type: 'update', id: el.id, index: idMap[el.id].index, element: el })
      }
    } else {
      appendItems.push({ id: el.id, element: el })
      elementIds.push(el.id)
      idMap[el.id] = { id: el.id, version: el.version, pos: '', index: elementIds.length - 1 }
    }
  }

  // Pass 2: deletions
  const nextIds = new Set(next.map((e) => e.id))
  const surviving: string[] = []
  let runIdx = 0
  for (const id of elementIds) {
    if (!nextIds.has(id)) {
      deleteOps.push({ id, index: runIdx })
    } else {
      surviving.push(id)
      runIdx++
    }
  }
  if (deleteOps.length) {
    elementIds.length = 0
    surviving.forEach((id) => elementIds.push(id))
    rebuildIndex()
  }

  // Pass 3: moves
  for (let toIdx = 0; toIdx < next.length; toIdx++) {
    const id = next[toIdx].id
    const fromIdx = idMap[id].index
    if (toIdx !== fromIdx) {
      const left = toIdx > 0 ? idMap[elementIds[toIdx - 1]]?.pos || null : null
      const right = toIdx < elementIds.length ? idMap[elementIds[toIdx]]?.pos || null : null
      let newPos: string
      try {
        newPos = generateKeyBetween(left, right)
      } catch {
        newPos = right ?? generateKeyBetween(null, null)
      }
      // splice in place
      elementIds.splice(toIdx, 0, elementIds.splice(fromIdx, 1)[0])
      idMap[id].pos = newPos
      rebuildIndex()
      moveOps.push({ type: 'move', id, fromIndex: fromIdx, toIndex: toIdx, pos: newPos })
    }
  }

  // Bulk append dengan fractional keys setelah elemen terakhir yang sudah ada
  const bulkAppendOps: BulkAppendOp[] = []
  if (appendItems.length) {
    const sortKeys = generateNKeysBetween(
      lastKnown[lastKnown.length - 1]?.pos ?? null,
      null,
      appendItems.length
    )
    appendItems.forEach(({ id }, i) => {
      idMap[id].pos = sortKeys[i]
    })
    bulkAppendOps.push({
      type: 'bulkAppend',
      data: appendItems.map(({ id, element }, i) => ({ id, pos: sortKeys[i], element })),
    })
  }

  // Bulk delete dikelompokkan
  const bulkDeleteOps: BulkDeleteOp[] = []
  if (deleteOps.length) {
    // Kelompokkan semua delete jadi satu operasi (diurutkan descending agar index tidak geser)
    bulkDeleteOps.push({ type: 'bulkDelete', data: deleteOps })
  }

  const operations: Operation[] = [...updateOps, ...bulkAppendOps, ...bulkDeleteOps, ...moveOps]

  const updatedMeta: ElementMeta[] = elementIds
    .filter((id) => nextIds.has(id))
    .map((id) => {
      const { index: _i, ...rest } = idMap[id]
      return rest
    })

  return { operations, lastKnownElements: updatedMeta }
}

const applyOpsToYjs = (yElements: Y.Array<Y.Map<unknown>>, ops: Operation[], origin: unknown) => {
  yElements.doc!.transact(() => {
    // Build id → yjs-index map
    const idxMap: Record<string, number> = {}
    const rebuildIdx = () => {
      for (let i = 0; i < yElements.length; i++) {
        const el = yElements.get(i).get('el') as ExcalidrawElement
        if (isValidElement(el)) idxMap[el.id] = i
      }
    }
    rebuildIdx()

    for (const op of ops) {
      switch (op.type) {
        case 'update': {
          yElements.get(idxMap[op.id]).set('el', { ...op.element })
          break
        }
        case 'bulkAppend': {
          const maps = op.data.map(
            ({ pos, element }) => new Y.Map(Object.entries({ pos, el: { ...element } }))
          )
          yElements.push(maps)
          rebuildIdx()
          break
        }
        case 'bulkDelete': {
          const indices = op.data
            .map(({ id }) => idxMap[id])
            .filter((i) => i !== undefined)
            .sort((a, b) => b - a) // descending agar index tidak bergeser
          for (const i of indices) {
            yElements.delete(i, 1)
          }
          rebuildIdx()
          break
        }
        case 'move': {
          yElements.get(idxMap[op.id]).set('pos', op.pos)
          break
        }
      }
    }
  }, origin)
}

// ---------------------------------------------------------------------------
// Main Binding Class
// ---------------------------------------------------------------------------

export interface BindingOptions {
  /**
   * Nama key di Y.Doc untuk array elemen. Default: 'excalidraw-elements'
   */
  elementsKey?: string
  /**
   * Nama key di Y.Doc untuk map asset/file. Default: 'excalidraw-files'
   */
  assetsKey?: string
}

export class ExcalidrawLiveKitBinding {
  private yElements: Y.Array<Y.Map<unknown>>
  private yAssets: Y.Map<ExcalidrawFile>
  private api: ExcalidrawImperativeAPI
  private provider: LiveKitYjsProvider
  private subscriptions: (() => void)[] = []
  private lastKnownElements: ElementMeta[] = []
  private lastKnownFileIds = new Set<string>()
  collaborators = new Map<string, CollaboratorState>()

  constructor(
    api: ExcalidrawImperativeAPI,
    provider: LiveKitYjsProvider,
    options: BindingOptions = {}
  ) {
    this.api = api
    this.provider = provider

    const { doc, awareness } = provider
    const elementsKey = options.elementsKey ?? 'excalidraw-elements'
    const assetsKey = options.assetsKey ?? 'excalidraw-files'

    this.yElements = doc.getArray<Y.Map<unknown>>(elementsKey)
    this.yAssets = doc.getMap<ExcalidrawFile>(assetsKey)

    // ── 1. Local → Yjs ──────────────────────────────────────────────────────
    const unsubExcalidraw = api.onChange((_elements, state, files) => {
      const elements = api.getSceneElements().filter(isValidElement)

      // Hanya flush ke Yjs saat cursor diangkat (sama seperti referensi)
      if (state.cursorButton === 'up' && !areElementsSame(this.lastKnownElements, elements)) {
        const { operations, lastKnownElements } = getDelta(this.lastKnownElements, elements)
        this.lastKnownElements = lastKnownElements
        if (operations.length) applyOpsToYjs(this.yElements, operations, this)
      }

      // Asset sync (tidak perlu tunggu cursor up)
      this._syncFiles(files)

      // Awareness: broadcast selected elements
      awareness.setLocalStateField('selectedElementIds', state.selectedElementIds)
    })
    this.subscriptions.push(unsubExcalidraw)

    // ── 2. Yjs → Local (elements) ───────────────────────────────────────────
    const remoteElementsHandler = (events: Y.YEvent<any>[], txn: Y.Transaction) => {
      if (txn.origin === this) return

      const changedIds = new Set(
        events.flatMap((e) => {
          if (e instanceof Y.YMapEvent) {
            const el = (e.target as Y.Map<unknown>).get('el') as ExcalidrawElement
            return isValidElement(el) ? [el.id] : []
          }
          return []
        })
      )

      const remote = yjsToExcalidraw(this.yElements)
      const merged = remote.map((el) => {
        if (changedIds.has(el.id)) return el
        return api.getSceneElements().find((ex) => ex.id === el.id) ?? el
      })

      this.lastKnownElements = metaFromYArray(this.yElements)
      api.updateScene({ elements: merged.filter(isValidElement) as never })
    }

    this.yElements.observeDeep(remoteElementsHandler)
    this.subscriptions.push(() => this.yElements.unobserveDeep(remoteElementsHandler))

    // ── 3. Yjs → Local (assets) ─────────────────────────────────────────────
    const remoteFilesHandler = (event: Y.YMapEvent<ExcalidrawFile>, txn: Y.Transaction) => {
      if (txn.origin === this) return
      const added = [...event.keysChanged]
        .map((k) => this.yAssets.get(k))
        .filter((f): f is ExcalidrawFile => !!f)
      if (added.length) api.addFiles(added as never)
    }

    this.yAssets.observe(remoteFilesHandler)
    this.subscriptions.push(() => this.yAssets.unobserve(remoteFilesHandler))

    // ── 4. Awareness (remote cursors & collaborators) ───────────────────────
    const awarenessHandler = ({
      added,
      updated,
      removed,
    }: {
      added: number[]
      updated: number[]
      removed: number[]
    }) => {
      const states = awareness.getStates()
      const collab = new Map(this.collaborators)

      for (const id of [...added, ...updated]) {
        const s = states.get(id)
        if (!s) continue

        collab.set(id.toString(), {
          pointer: s.cursor ? { x: s.cursor.x, y: s.cursor.y } : undefined,
          selectedElementIds: s.selectedElementIds,
          username: s.name,
          color: s.color ? { background: s.color.hex, stroke: s.color.hex } : undefined,
        })
      }

      for (const id of removed) {
        collab.delete(id.toString())
      }
      collab.delete(awareness.clientID.toString())

      this.collaborators = collab
      api.updateScene({ collaborators: collab as never })
    }

    awareness.on('change', awarenessHandler)
    this.subscriptions.push(() => awareness.off('change', awarenessHandler))

    // ── 5. Pointer update helper (opsional, panggil dari onPointerUpdate) ───
    // Diekspor sebagai method publik — lihat onPointerUpdate() di bawah.

    // ── Init: seed scene dari state Yjs yang sudah ada ──────────────────────
    const initial = yjsToExcalidraw(this.yElements)
    this.lastKnownElements = metaFromYArray(this.yElements)
    api.updateScene({ elements: initial.filter(isValidElement) as never })

    const existingFiles = [...this.yAssets.keys()]
      .map((k) => this.yAssets.get(k))
      .filter((f): f is ExcalidrawFile => !!f)
    if (existingFiles.length) api.addFiles(existingFiles as never)

    // Seed collaborators dari awareness yang sudah ada
    awarenessHandler({
      added: [...awareness.getStates().keys()],
      updated: [],
      removed: [],
    })
  }

  /**
   * Broadcast posisi pointer lokal ke semua participant.
   * Panggil dari prop onPointerUpdate Excalidraw.
   */
  onPointerUpdate = (payload: { pointer: { x: number; y: number }; button: string }) => {
    this.provider.awareness.setLocalStateField('cursor', payload.pointer)
    this.provider.awareness.setLocalStateField('button', payload.button)
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _syncFiles(files: ExcalidrawFiles) {
    const ops: { type: 'append'; id: string; file: ExcalidrawFile }[] = []

    for (const fileId in files) {
      if (!Object.prototype.hasOwnProperty.call(files, fileId)) continue
      if (!this.lastKnownFileIds.has(fileId)) {
        ops.push({ type: 'append', id: fileId, file: files[fileId] })
      }
      this.lastKnownFileIds.add(fileId)
    }

    if (!ops.length) return

    this.yAssets.doc!.transact(() => {
      for (const op of ops) {
        this.yAssets.set(op.id, op.file)
      }
    }, this)
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  destroy() {
    for (const unsub of this.subscriptions) {
      unsub()
    }
    this.subscriptions = []
  }
}
