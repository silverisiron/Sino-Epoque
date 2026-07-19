import { useEffect, useMemo, useRef, useState } from 'react'
import {
  drawProvinceOverlay,
  drawProvincesOverlay,
} from '../map/canvasRenderers'
import { isWater } from '../map/mapData'

export function useMapEditor({
  activePage,
  baseCanvasRef,
  mapScrollRef,
  overlayCanvasRef,
  overlayImageDataRef,
  provinceByRgbRef,
  provincePixelCacheRef,
  redrawAllOverlay,
  selectedPresetPath,
  setActivePage,
  setStatus,
  sourceImageDataRef,
  stateByProvinceRef,
  statesByIdRef,
}) {
  const assignmentsRef = useRef({})
  const isPaintingRef = useRef(false)
  const lastPaintedProvinceRef = useRef(null)
  const panRef = useRef(null)

  const [activeTool, setActiveTool] = useState('paint')
  const [paintMode, setPaintMode] = useState('multi')
  const [paintUnit, setPaintUnit] = useState('state')
  const [countries, setCountries] = useState({
    '#d94645': { name: '국가 1' },
  })
  const [activeColor, setActiveColor] = useState('#d94645')
  const [assignments, setAssignments] = useState({})
  const [selectedProvince, setSelectedProvince] = useState(null)
  const [selectedState, setSelectedState] = useState(null)

  const activeCountry = countries[activeColor]
  const preset = useMemo(
    () => ({
      version: 1,
      baseMap: 'base',
      countries,
      provinceAssignments: assignments,
    }),
    [assignments, countries],
  )

  useEffect(() => {
    assignmentsRef.current = assignments
  }, [assignments])

  useEffect(() => {
    redrawAllOverlay(assignmentsRef.current, countries)
  }, [countries, redrawAllOverlay])

  function getProvinceFromPointer(event) {
    const sourceImageData = sourceImageDataRef.current
    const canvas = baseCanvasRef.current

    if (!sourceImageData || !canvas) {
      return null
    }

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width)
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)
    const pixelIndex = (y * canvas.width + x) * 4
    const data = sourceImageDataRef.current.data
    const rgb = `${data[pixelIndex]},${data[pixelIndex + 1]},${data[pixelIndex + 2]}`
    const province = provinceByRgbRef.current.get(rgb)

    return { x, y, rgb, province }
  }

  function applyToolToProvince(clicked) {
    if (!clicked?.province) {
      return
    }

    if (lastPaintedProvinceRef.current === clicked.province.id) {
      return
    }

    setSelectedProvince(clicked)
    lastPaintedProvinceRef.current = clicked.province.id

    const stateId = stateByProvinceRef.current.get(clicked.province.id)
    const clickedState = stateId ? statesByIdRef.current.get(stateId) : null
    setSelectedState(clickedState ?? null)

    if (
      activePage !== 'editor' ||
      activeTool === 'hand' ||
      isWater(clicked.province) ||
      (activeTool === 'paint' && !activeCountry)
    ) {
      return
    }

    const landProvinces =
      paintUnit === 'state' && clickedState
        ? clickedState.provinces.filter((province) => !isWater(province))
        : [clicked.province]
    const nextAssignments = { ...assignmentsRef.current }

    for (const province of landProvinces) {
      if (activeTool === 'erase') {
        delete nextAssignments[province.id]
      } else {
        nextAssignments[province.id] = activeColor
      }
    }

    assignmentsRef.current = nextAssignments

    if (landProvinces.length > 1) {
      drawProvincesOverlay(
        overlayCanvasRef.current,
        overlayImageDataRef.current,
        provincePixelCacheRef.current,
        landProvinces,
        activeTool === 'erase' ? null : activeColor,
      )
    } else {
      drawProvinceOverlay(
        overlayCanvasRef.current,
        overlayImageDataRef.current,
        provincePixelCacheRef.current,
        clicked.province,
        activeTool === 'erase' ? null : activeColor,
      )
    }

    setAssignments(assignmentsRef.current)
  }

  function handlePointerDown(event) {
    const clicked = getProvinceFromPointer(event)

    if (activeTool === 'hand') {
      panRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: mapScrollRef.current.scrollLeft,
        scrollTop: mapScrollRef.current.scrollTop,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }

    if (paintMode === 'multi') {
      isPaintingRef.current = true
      lastPaintedProvinceRef.current = null
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    applyToolToProvince(clicked)
  }

  function handlePointerMove(event) {
    if (activeTool === 'hand' && panRef.current) {
      const scrollContainer = mapScrollRef.current
      scrollContainer.scrollLeft = panRef.current.scrollLeft - (event.clientX - panRef.current.startX)
      scrollContainer.scrollTop = panRef.current.scrollTop - (event.clientY - panRef.current.startY)
      return
    }

    if (activeTool !== 'hand' && paintMode === 'multi' && isPaintingRef.current) {
      applyToolToProvince(getProvinceFromPointer(event))
    }
  }

  function handlePointerUp(event) {
    if (panRef.current?.pointerId === event.pointerId) {
      panRef.current = null
    }

    isPaintingRef.current = false
    lastPaintedProvinceRef.current = null
  }

  function addCountry() {
    let color = '#4f46e5'
    let step = 0

    while (countries[color]) {
      step += 1
      color = `#${((0x4f46e5 + step * 0x12345) & 0xffffff).toString(16).padStart(6, '0')}`
    }

    setCountries((currentCountries) => ({
      ...currentCountries,
      [color]: { name: `국가 ${Object.keys(currentCountries).length + 1}` },
    }))
    setActiveColor(color)
  }

  function updateCountryName(color, name) {
    setCountries((currentCountries) => ({
      ...currentCountries,
      [color]: { name },
    }))
  }

  function updateCountryColor(previousColor, nextColor) {
    if (!nextColor || countries[nextColor]) {
      return
    }

    setCountries((currentCountries) => {
      const nextCountries = {}

      for (const [color, country] of Object.entries(currentCountries)) {
        nextCountries[color === previousColor ? nextColor : color] = country
      }

      return nextCountries
    })
    setAssignments((currentAssignments) => {
      const nextAssignments = {}

      for (const [provinceId, color] of Object.entries(currentAssignments)) {
        nextAssignments[provinceId] = color === previousColor ? nextColor : color
      }

      assignmentsRef.current = nextAssignments
      return nextAssignments
    })
    setActiveColor(nextColor)
  }

  function reorderCountries(orderedColors) {
    setCountries((currentCountries) => {
      const nextCountries = {}
      const includedColors = new Set(orderedColors)

      for (const color of orderedColors) {
        if (currentCountries[color]) {
          nextCountries[color] = currentCountries[color]
        }
      }

      for (const [color, country] of Object.entries(currentCountries)) {
        if (!includedColors.has(color)) {
          nextCountries[color] = country
        }
      }

      return nextCountries
    })
  }

  function removeAssignment() {
    if (!selectedProvince?.province) {
      return
    }

    setAssignments((currentAssignments) => {
      const nextAssignments = { ...currentAssignments }
      const stateId = stateByProvinceRef.current.get(selectedProvince.province.id)
      const selectedProvinceState = stateId ? statesByIdRef.current.get(stateId) : null

      if (paintUnit === 'state' && selectedProvinceState) {
        for (const province of selectedProvinceState.provinces) {
          delete nextAssignments[province.id]
        }
      } else {
        delete nextAssignments[selectedProvince.province.id]
      }

      assignmentsRef.current = nextAssignments

      if (paintUnit === 'state' && selectedProvinceState) {
        drawProvincesOverlay(
          overlayCanvasRef.current,
          overlayImageDataRef.current,
          provincePixelCacheRef.current,
          selectedProvinceState.provinces,
          null,
        )
      } else {
        drawProvinceOverlay(
          overlayCanvasRef.current,
          overlayImageDataRef.current,
          provincePixelCacheRef.current,
          selectedProvince.province,
          null,
        )
      }

      return nextAssignments
    })
  }

  async function loadPreset(path = selectedPresetPath) {
    if (!path) {
      return
    }

    const response = await fetch(path)

    if (!response.ok) {
      setStatus(`프리셋 로드 실패: ${response.status}`)
      return
    }

    const presetJson = await response.json()
    assignmentsRef.current = presetJson.provinceAssignments ?? {}
    setCountries(presetJson.countries ?? {})
    setAssignments(assignmentsRef.current)
    redrawAllOverlay(assignmentsRef.current, presetJson.countries ?? {})
    setActiveColor(Object.keys(presetJson.countries ?? {})[0] ?? '')
    setActivePage('loader')
    setStatus('프리셋 로드 완료')
  }

  const selectedCountryColor = selectedProvince?.province
    ? assignments[selectedProvince.province.id]
    : null
  const selectedCountry = selectedCountryColor ? countries[selectedCountryColor] : null

  return {
    activeColor,
    activeTool,
    countries,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    loadPreset,
    paintMode,
    paintUnit,
    preset,
    reorderCountries,
    removeAssignment,
    selectedCountry,
    selectedProvince,
    selectedState,
    setActiveColor,
    setActiveTool,
    setPaintMode,
    setPaintUnit,
    addCountry,
    updateCountryColor,
    updateCountryName,
  }
}
