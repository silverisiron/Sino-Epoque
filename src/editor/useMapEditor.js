import { useEffect, useMemo, useRef, useState } from 'react'
import {
  drawProvinceOverlay,
  drawProvincesOverlay,
  getSphereLayerAppearance,
} from '../map/canvasRenderers'
import { isWater } from '../map/mapData'
import {
  createDefaultAutonomyTypes,
  DEFAULT_AUTONOMY_TYPE_ID,
  normalizePreset,
} from '../map/presetSchema'

const DEFAULT_SPHERE_LAYER_SETTINGS = {
  selectedTypeIds: [],
  opacity: 90,
}

function createsOverlordCycle(countryId, overlordId, countries) {
  const visited = new Set()
  let currentCountryId = overlordId

  while (currentCountryId) {
    if (currentCountryId === countryId || visited.has(currentCountryId)) {
      return true
    }

    visited.add(currentCountryId)
    currentCountryId = countries[currentCountryId]?.overlordId ?? null
  }

  return false
}

export function useMapEditor({
  activePage,
  baseCanvasRef,
  mapSize,
  mapScrollRef,
  overlayCanvasRef,
  overlayImageDataRef,
  provinceByRgbRef,
  provincePixelCacheRef,
  redrawAllOverlay,
  redrawSphereLayer,
  selectedPresetPath,
  setActivePage,
  setStatus,
  sourceImageDataRef,
  sphereCanvasRef,
  sphereImageDataRef,
  stateByProvinceRef,
  statesByIdRef,
}) {
  const assignmentsRef = useRef({})
  const isPaintingRef = useRef(false)
  const lastPaintedProvinceRef = useRef(null)
  const panRef = useRef(null)
  const sphereLayerSettingsRef = useRef(DEFAULT_SPHERE_LAYER_SETTINGS)

  const [activeTool, setActiveTool] = useState('paint')
  const [paintMode, setPaintMode] = useState('multi')
  const [paintUnit, setPaintUnit] = useState('state')
  const [autonomyTypes, setAutonomyTypes] = useState(() => createDefaultAutonomyTypes())
  const [countries, setCountries] = useState({
    country_1: {
      name: '국가 1',
      color: '#d94645',
      autonomyTypeId: DEFAULT_AUTONOMY_TYPE_ID,
      overlordId: null,
    },
  })
  const [countryOrder, setCountryOrder] = useState(['country_1'])
  const [activeCountryId, setActiveCountryId] = useState('country_1')
  const [assignments, setAssignments] = useState({})
  const [selectedProvince, setSelectedProvince] = useState(null)
  const [selectedState, setSelectedState] = useState(null)
  const [sphereLayerSettings, setSphereLayerSettings] = useState(
    DEFAULT_SPHERE_LAYER_SETTINGS,
  )

  const activeCountry = countries[activeCountryId]
  const preset = useMemo(
    () => ({
      version: 2,
      baseMap: 'base',
      autonomyTypes,
      countries,
      countryOrder,
      provinceAssignments: assignments,
    }),
    [assignments, autonomyTypes, countries, countryOrder],
  )

  useEffect(() => {
    assignmentsRef.current = assignments
  }, [assignments])

  useEffect(() => {
    redrawAllOverlay(assignmentsRef.current, countries)
  }, [countries, redrawAllOverlay])

  useEffect(() => {
    sphereLayerSettingsRef.current = sphereLayerSettings
    redrawSphereLayer(
      assignmentsRef.current,
      countries,
      autonomyTypes,
      sphereLayerSettings,
    )
  }, [autonomyTypes, countries, mapSize, redrawSphereLayer, sphereLayerSettings])

  function drawSphereForProvinces(provinces, countryId) {
    const appearance = countryId
      ? getSphereLayerAppearance(
          countryId,
          countries,
          autonomyTypes,
          sphereLayerSettingsRef.current,
        )
      : null

    if (provinces.length > 1) {
      drawProvincesOverlay(
        sphereCanvasRef.current,
        sphereImageDataRef.current,
        provincePixelCacheRef.current,
        provinces,
        appearance?.color ?? null,
        appearance?.opacity ?? 1,
      )
    } else {
      drawProvinceOverlay(
        sphereCanvasRef.current,
        sphereImageDataRef.current,
        provincePixelCacheRef.current,
        provinces[0],
        appearance?.color ?? null,
        appearance?.opacity ?? 1,
      )
    }
  }

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
    const data = sourceImageData.data
    const rgb = `${data[pixelIndex]},${data[pixelIndex + 1]},${data[pixelIndex + 2]}`
    const province = provinceByRgbRef.current.get(rgb)

    return { x, y, rgb, province }
  }

  function applyToolToProvince(clicked) {
    if (!clicked?.province || lastPaintedProvinceRef.current === clicked.province.id) {
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
        nextAssignments[province.id] = activeCountryId
      }
    }

    assignmentsRef.current = nextAssignments
    const overlayColor = activeTool === 'erase' ? null : activeCountry.color

    if (landProvinces.length > 1) {
      drawProvincesOverlay(
        overlayCanvasRef.current,
        overlayImageDataRef.current,
        provincePixelCacheRef.current,
        landProvinces,
        overlayColor,
      )
    } else {
      drawProvinceOverlay(
        overlayCanvasRef.current,
        overlayImageDataRef.current,
        provincePixelCacheRef.current,
        clicked.province,
        overlayColor,
      )
    }

    drawSphereForProvinces(
      landProvinces,
      activeTool === 'erase' ? null : activeCountryId,
    )

    setAssignments(nextAssignments)
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
    let countryNumber = countryOrder.length + 1
    let countryId = `country_${countryNumber}`

    while (countries[countryId]) {
      countryNumber += 1
      countryId = `country_${countryNumber}`
    }

    let color = '#4f46e5'
    let colorStep = 0
    const usedColors = new Set(Object.values(countries).map((country) => country.color.toLowerCase()))

    while (usedColors.has(color)) {
      colorStep += 1
      color = `#${((0x4f46e5 + colorStep * 0x12345) & 0xffffff).toString(16).padStart(6, '0')}`
    }

    setCountries((currentCountries) => ({
      ...currentCountries,
      [countryId]: {
        name: `국가 ${countryNumber}`,
        color,
        autonomyTypeId: DEFAULT_AUTONOMY_TYPE_ID,
        overlordId: null,
      },
    }))
    setCountryOrder((currentOrder) => [...currentOrder, countryId])
    setActiveCountryId(countryId)
  }

  function updateCountry(countryId, nextCountry) {
    const autonomyType = autonomyTypes[nextCountry.autonomyTypeId]
    const normalizedColor = nextCountry.color.toLowerCase()
    const colorIsUsed = Object.entries(countries).some(
      ([otherCountryId, country]) =>
        otherCountryId !== countryId && country.color.toLowerCase() === normalizedColor,
    )

    if (!autonomyType || colorIsUsed) {
      setStatus(colorIsUsed ? '이미 사용 중인 국가 색상입니다.' : '유효하지 않은 자치도 유형입니다.')
      return false
    }

    const overlordId = autonomyType.autonomy < 10 ? nextCountry.overlordId : null

    if (
      autonomyType.autonomy < 10 &&
      (!overlordId || !countries[overlordId] || createsOverlordCycle(countryId, overlordId, countries))
    ) {
      setStatus('종속국은 순환되지 않는 유효한 종주국을 선택해야 합니다.')
      return false
    }

    setCountries((currentCountries) => ({
      ...currentCountries,
      [countryId]: {
        ...currentCountries[countryId],
        ...nextCountry,
        color: normalizedColor,
        overlordId,
      },
    }))
    setStatus('국가 정보가 적용되었습니다.')
    return true
  }

  function reorderCountries(orderedCountryIds) {
    const knownCountryIds = new Set(Object.keys(countries))
    setCountryOrder(orderedCountryIds.filter((countryId) => knownCountryIds.has(countryId)))
  }

  function applySphereLayerSettings(nextSettings) {
    const selectedTypeIds = nextSettings.selectedTypeIds.filter(
      (typeId) => autonomyTypes[typeId]?.autonomy < 10,
    )
    const opacity = Math.min(100, Math.max(0, Number(nextSettings.opacity) || 0))
    setSphereLayerSettings({ selectedTypeIds, opacity })
  }

  function addAutonomyType() {
    let typeNumber = 1
    let typeId = `custom_${typeNumber}`

    while (autonomyTypes[typeId]) {
      typeNumber += 1
      typeId = `custom_${typeNumber}`
    }

    setAutonomyTypes((currentTypes) => ({
      ...currentTypes,
      [typeId]: {
        name: `새 자치도 유형 ${typeNumber}`,
        englishName: '',
        autonomy: 5,
        builtIn: false,
      },
    }))
  }

  function updateAutonomyType(typeId, nextType) {
    if (autonomyTypes[typeId]?.builtIn) {
      return false
    }

    const autonomy = Math.min(10, Math.max(1, Number.parseInt(nextType.autonomy, 10) || 1))
    const countriesUsingType = Object.entries(countries).filter(
      ([, country]) => country.autonomyTypeId === typeId,
    )

    if (autonomy < 10 && countriesUsingType.some(([, country]) => !country.overlordId)) {
      setStatus('이 유형을 사용하는 국가에 먼저 종주국을 지정해야 합니다.')
      return false
    }

    setAutonomyTypes((currentTypes) => ({
      ...currentTypes,
      [typeId]: {
        name: nextType.name.trim() || typeId,
        englishName: nextType.englishName.trim(),
        autonomy,
        builtIn: false,
      },
    }))

    if (autonomy === 10 && countriesUsingType.length > 0) {
      setCountries((currentCountries) => {
        const nextCountries = { ...currentCountries }

        for (const [countryId, country] of countriesUsingType) {
          nextCountries[countryId] = { ...country, overlordId: null }
        }

        return nextCountries
      })
    }

    setStatus('자치도 유형이 적용되었습니다.')
    return true
  }

  function deleteAutonomyType(typeId) {
    if (
      autonomyTypes[typeId]?.builtIn ||
      Object.values(countries).some((country) => country.autonomyTypeId === typeId)
    ) {
      setStatus('기본 유형 또는 사용 중인 자치도 유형은 삭제할 수 없습니다.')
      return false
    }

    setAutonomyTypes((currentTypes) => {
      const nextTypes = { ...currentTypes }
      delete nextTypes[typeId]
      return nextTypes
    })
    setStatus('자치도 유형이 삭제되었습니다.')
    return true
  }

  function removeAssignment() {
    if (!selectedProvince?.province) {
      return
    }

    setAssignments((currentAssignments) => {
      const nextAssignments = { ...currentAssignments }
      const stateId = stateByProvinceRef.current.get(selectedProvince.province.id)
      const selectedProvinceState = stateId ? statesByIdRef.current.get(stateId) : null
      const provincesToClear =
        paintUnit === 'state' && selectedProvinceState
          ? selectedProvinceState.provinces
          : [selectedProvince.province]

      for (const province of provincesToClear) {
        delete nextAssignments[province.id]
      }

      assignmentsRef.current = nextAssignments

      if (provincesToClear.length > 1) {
        drawProvincesOverlay(
          overlayCanvasRef.current,
          overlayImageDataRef.current,
          provincePixelCacheRef.current,
          provincesToClear,
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
      drawSphereForProvinces(provincesToClear, null)

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

    const normalizedPreset = normalizePreset(await response.json())
    assignmentsRef.current = normalizedPreset.provinceAssignments
    setAutonomyTypes(normalizedPreset.autonomyTypes)
    setCountries(normalizedPreset.countries)
    setCountryOrder(normalizedPreset.countryOrder)
    setAssignments(normalizedPreset.provinceAssignments)
    redrawAllOverlay(normalizedPreset.provinceAssignments, normalizedPreset.countries)
    redrawSphereLayer(
      normalizedPreset.provinceAssignments,
      normalizedPreset.countries,
      normalizedPreset.autonomyTypes,
      sphereLayerSettingsRef.current,
    )
    setActiveCountryId(normalizedPreset.countryOrder[0] ?? '')
    setActivePage('loader')
    setStatus('프리셋 로드 완료')
  }

  const selectedCountryId = selectedProvince?.province
    ? assignments[selectedProvince.province.id]
    : null
  const selectedCountry = selectedCountryId ? countries[selectedCountryId] : null

  return {
    activeCountryId,
    activeTool,
    addAutonomyType,
    addCountry,
    autonomyTypes,
    applySphereLayerSettings,
    countries,
    countryOrder,
    deleteAutonomyType,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    loadPreset,
    paintMode,
    paintUnit,
    preset,
    removeAssignment,
    reorderCountries,
    selectedCountry,
    selectedProvince,
    selectedState,
    setActiveCountryId,
    setActiveTool,
    setPaintMode,
    setPaintUnit,
    sphereLayerSettings,
    updateAutonomyType,
    updateCountry,
  }
}
