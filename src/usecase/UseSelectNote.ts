import type { Note } from '@/entities/Note'
import { injectUseNoteCollection } from '@/store/UseNoteCollection'
import { injectUseNoteSingle } from '@/store/UseNoteSingle'

export const useSelectNote = () => {
  const { fetch } = injectUseNoteCollection()
  const { read, destroy, setCurrentHtml, getText } = injectUseNoteSingle()

  const pushTextToUrl = (text: string) => {
    // Encode UTF-8 -> base64
    const utf8 = new TextEncoder().encode(text)
    let binary = ''
    utf8.forEach((b) => (binary += String.fromCharCode(b)))
    const b64 = btoa(binary)
    const url = new URL(window.location.href)
    url.searchParams.set('text', b64)
    url.searchParams.delete('id')
    window.history.pushState({}, '', url)
  }

  const selectNote = async (id: Note['id']) => {
    await read(id)
    await setCurrentHtml()
    pushTextToUrl(getText())
  }

  const deleteNote = async (note: Note) => {
    await destroy(note)
    await fetch()
  }

  return {
    selectNote,
    deleteNote
  }
}
