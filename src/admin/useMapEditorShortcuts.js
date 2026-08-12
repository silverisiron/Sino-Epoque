import { useEffect } from 'react'

const MAP_TOOL_SHORTCUTS = {
  KeyQ: 'paint',
  KeyW: 'eyedropper',
  KeyE: 'erase',
  KeyR: 'hand',
}

function blocksMapToolShortcut(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable ||
    target?.closest?.('[role="dialog"]')
  )
}

export function useMapEditorShortcuts({
  viewMode,
  workspaceMode,
  redo,
  undo,
  selectTool,
  setTemporaryPanActive,
}) {
  useEffect(() => {
    function handleHistoryShortcut(event) {
      const target = event.target

      if (
        viewMode !== '2d' ||
        event.defaultPrevented ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable ||
        (!event.ctrlKey && !event.metaKey)
      ) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleHistoryShortcut)
    return () => window.removeEventListener('keydown', handleHistoryShortcut)
  }, [redo, undo, viewMode])

  useEffect(() => {
    function handleToolShortcut(event) {
      if (event.key === 'Alt') {
        if (
          viewMode === '2d' &&
          workspaceMode === 'editor' &&
          !event.repeat &&
          !blocksMapToolShortcut(event.target)
        ) {
          event.preventDefault()
          setTemporaryPanActive(true)
        }

        return
      }

      const nextTool = MAP_TOOL_SHORTCUTS[event.code]

      if (
        viewMode !== '2d' ||
        workspaceMode !== 'editor' ||
        !nextTool ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        blocksMapToolShortcut(event.target)
      ) {
        return
      }

      event.preventDefault()
      selectTool(nextTool)
    }

    function releaseTemporaryPan(event) {
      if (!event || event.type !== 'keyup' || event.key === 'Alt') {
        setTemporaryPanActive(false)
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        releaseTemporaryPan()
      }
    }

    window.addEventListener('keydown', handleToolShortcut)
    window.addEventListener('keyup', releaseTemporaryPan)
    window.addEventListener('blur', releaseTemporaryPan)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('keydown', handleToolShortcut)
      window.removeEventListener('keyup', releaseTemporaryPan)
      window.removeEventListener('blur', releaseTemporaryPan)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      setTemporaryPanActive(false)
    }
  }, [selectTool, setTemporaryPanActive, viewMode, workspaceMode])
}
