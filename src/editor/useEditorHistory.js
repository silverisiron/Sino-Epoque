import { useCallback, useRef, useState } from 'react'

const HISTORY_LIMIT = 30

function trimHistory(history) {
  if (history.length > HISTORY_LIMIT) {
    history.shift()
  }
}

export function useEditorHistory(initialEditorState) {
  const editorStateRef = useRef(initialEditorState)
  const pastHistoryRef = useRef([])
  const futureHistoryRef = useRef([])
  const [editorState, setEditorState] = useState(initialEditorState)
  const [historyAvailability, setHistoryAvailability] = useState({
    canUndo: false,
    canRedo: false,
  })

  const updateHistoryAvailability = useCallback(() => {
    setHistoryAvailability({
      canUndo: pastHistoryRef.current.length > 0,
      canRedo: futureHistoryRef.current.length > 0,
    })
  }, [])

  const recordHistoryCheckpoint = useCallback(() => {
    pastHistoryRef.current.push(editorStateRef.current)
    trimHistory(pastHistoryRef.current)
    futureHistoryRef.current = []
    updateHistoryAvailability()
  }, [updateHistoryAvailability])

  const commitEditorState = useCallback(
    (nextEditorState, { recordHistory = true } = {}) => {
      const currentEditorState = editorStateRef.current
      const resolvedEditorState =
        typeof nextEditorState === 'function'
          ? nextEditorState(currentEditorState)
          : nextEditorState

      if (!resolvedEditorState || resolvedEditorState === currentEditorState) {
        return false
      }

      if (recordHistory) {
        pastHistoryRef.current.push(currentEditorState)
        trimHistory(pastHistoryRef.current)
        futureHistoryRef.current = []
      }

      editorStateRef.current = resolvedEditorState
      setEditorState(resolvedEditorState)
      updateHistoryAvailability()
      return true
    },
    [updateHistoryAvailability],
  )

  const replaceEditorState = useCallback(
    (nextEditorState) => {
      pastHistoryRef.current = []
      futureHistoryRef.current = []
      editorStateRef.current = nextEditorState
      setEditorState(nextEditorState)
      updateHistoryAvailability()
    },
    [updateHistoryAvailability],
  )

  const undoEditorState = useCallback(() => {
    const previousEditorState = pastHistoryRef.current.pop()

    if (!previousEditorState) {
      return null
    }

    futureHistoryRef.current.push(editorStateRef.current)
    editorStateRef.current = previousEditorState
    setEditorState(previousEditorState)
    updateHistoryAvailability()
    return previousEditorState
  }, [updateHistoryAvailability])

  const redoEditorState = useCallback(() => {
    const nextEditorState = futureHistoryRef.current.pop()

    if (!nextEditorState) {
      return null
    }

    pastHistoryRef.current.push(editorStateRef.current)
    trimHistory(pastHistoryRef.current)
    editorStateRef.current = nextEditorState
    setEditorState(nextEditorState)
    updateHistoryAvailability()
    return nextEditorState
  }, [updateHistoryAvailability])

  return {
    canRedo: historyAvailability.canRedo,
    canUndo: historyAvailability.canUndo,
    commitEditorState,
    editorState,
    editorStateRef,
    recordHistoryCheckpoint,
    redoEditorState,
    replaceEditorState,
    undoEditorState,
  }
}
