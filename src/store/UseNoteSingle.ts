import { computed, inject, type InjectionKey, provide, reactive, ref, toRaw } from 'vue'
import { noteCacheRepository } from '@/repository/NoteCacheRepository'
import { noteSingleRepository } from '@/repository/NoteSingleRepository'
import { noteCollectionRepository } from '@/repository/NoteCollectionRepository'
import { getDefaultNote, type Note } from '@/entities/Note'
import { convertToHtml } from '@/plugin/Marked'
import { parser } from '@/lib/NoteParser'

type State = {
  note: Note
}

const useNoteSingle = () => {
  const QUERY_KEY_TEXT = 'text'

  const pushTextToUrl = (text: string) => {
    const utf8 = new TextEncoder().encode(text)
    let binary = ''
    utf8.forEach((b) => (binary += String.fromCharCode(b)))
    const b64 = btoa(binary)
    const url = new URL(window.location.href)
    url.searchParams.set(QUERY_KEY_TEXT, b64)
    url.searchParams.delete('id')
    window.history.pushState({}, '', url)
  }

  const state = reactive<State>({
    note: getDefaultNote()
  })
  const htmlString = ref('')

  const read = async (id: Note['id']) => {
    const result = await noteSingleRepository.read(id)
    Object.assign(state.note, result)
    noteCacheRepository.save(id)
  }

  const readCache = async () => {
    // 1) Prefer URL-embedded text if present
    const url = new URL(window.location.href)
    const textParam = url.searchParams.get(QUERY_KEY_TEXT)
    if (textParam) {
      try {
        // Base64 decode UTF-8
        const bin = atob(textParam)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        const decoded = new TextDecoder().decode(bytes)
        state.note.text = decoded
        htmlString.value = convertToHtml(decoded)
        return
      } catch (e) {
        // fall through to cache load
      }
    }

    // 2) Otherwise load last opened note by id (legacy)
    const id = noteCacheRepository.fetch()
    id && (await read(id))
  }

  const getText = () => {
    return state.note.text
  }

  const setTextLocal = (text: Note['text']) => {
    state.note.text = text
  }

  const getPermalink = () => {
    const text = state.note.text || ''
    const utf8 = new TextEncoder().encode(text)
    let binary = ''
    utf8.forEach((b) => (binary += String.fromCharCode(b)))
    const b64 = btoa(binary)
    const url = new URL(window.location.href)
    url.searchParams.set('text', b64)
    return url.toString()
  }

  const update = async (text: Note['text']) => {
    const { diagrams } = parser(text)
    if (!state.note.id) {
      // First modification of a non-persisted (URL/default) note: create it
      const id = await noteCollectionRepository.add({ ...getDefaultNote(), text, diagrams })
      await read(id)
      return
    }
    state.note.text = text
    state.note.diagrams = diagrams
    const result = await noteSingleRepository.update(toRaw(state.note))
    // updatedAt が更新される
    Object.assign(state.note, result)
  }

  const destroy = async (note: Note) => {
    await noteSingleRepository.delete(note.id)
    if (state.note.id === note.id) {
      Object.assign(state.note, getDefaultNote())
      htmlString.value = ''
      noteCacheRepository.reset()
    }
  }

  const setCurrentHtml = (text?: Note['text']) => {
    htmlString.value = convertToHtml(text || state.note.text)
  }

  const renderHtml = async (text: Note['text']) => {
    // Allow rendering even when note isn't persisted (URL-only)
    const { diagrams } = parser(text)
    state.note.diagrams = diagrams
    if (state.note.id) {
      // Persisted note: also update storage
      await update(text)
    } else {
      state.note.text = text
    }
    // Update URL to reflect the rendered content
    pushTextToUrl(text)
    htmlString.value = convertToHtml(text)
  }

  return {
    current: computed(() => state.note),
    htmlString: computed(() => htmlString.value),
    read,
    readCache,
    getText,
    setTextLocal,
    getPermalink,
    update,
    destroy,
    setCurrentHtml,
    renderHtml
  }
}

const USE_NOTE_SINGLE: InjectionKey<ReturnType<typeof useNoteSingle>> = Symbol('USE_NOTE_SINGLE')

export const provideUseNoteSingle = () => {
  const useObj = useNoteSingle()

  provide(USE_NOTE_SINGLE, useObj)

  return useObj
}

export const injectUseNoteSingle = () => {
  const useObj = inject(USE_NOTE_SINGLE)

  if (useObj) {
    return useObj
  } else {
    throw new Error('error injectUseNoteSingle')
  }
}
