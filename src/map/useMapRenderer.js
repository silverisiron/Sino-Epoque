import { useCallback, useMemo } from 'react'
import {
  drawProvinceAssignments,
  drawProvinceOverlay,
  drawProvincesOverlay,
} from './canvasRenderers'
import {
  drawCountryLayer,
  getCountryLayerAppearance,
} from './countryLayerRenderer'

export function useMapRenderer({
  overlayCanvasRef,
  overlayImageDataRef,
  provinceByIdRef,
  provincePixelCacheRef,
  countryLayerCanvasRef,
  countryLayerImageDataRef,
  invalidateWrappedMap,
}) {
  const renderProvinceAssignments = useCallback(
    (provinceAssignments, countries) => {
      drawProvinceAssignments(
        overlayCanvasRef.current,
        overlayImageDataRef.current,
        provincePixelCacheRef.current,
        provinceByIdRef.current,
        provinceAssignments,
        countries,
      )
      invalidateWrappedMap()
    },
    [
      overlayCanvasRef,
      overlayImageDataRef,
      provinceByIdRef,
      provincePixelCacheRef,
      invalidateWrappedMap,
    ],
  )

  const renderCountryLayer = useCallback(
    (
      provinceAssignments,
      countries,
      autonomyTypes,
      powerRankTypes,
      powerBlocs,
      settings,
    ) => {
      drawCountryLayer(
        countryLayerCanvasRef.current,
        countryLayerImageDataRef.current,
        provincePixelCacheRef.current,
        provinceAssignments,
        countries,
        autonomyTypes,
        powerRankTypes,
        powerBlocs,
        settings,
      )
      invalidateWrappedMap()
    },
    [
      countryLayerCanvasRef,
      countryLayerImageDataRef,
      provincePixelCacheRef,
      invalidateWrappedMap,
    ],
  )

  const renderProvinceAssignmentPatch = useCallback(
    ({
      provinces,
      countryId,
      countries,
      autonomyTypes,
      powerRankTypes,
      powerBlocs,
      settings,
    }) => {
      if (provinces.length === 0) {
        return
      }

      const overlayColor = countryId ? countries[countryId]?.color ?? null : null
      const countryLayerAppearance = countryId
        ? getCountryLayerAppearance(
            countryId,
            countries,
            autonomyTypes,
            powerRankTypes,
            powerBlocs,
            settings,
          )
        : null

      let dirtyRegion

      if (provinces.length > 1) {
        dirtyRegion = drawProvincesOverlay(
          overlayCanvasRef.current,
          overlayImageDataRef.current,
          provincePixelCacheRef.current,
          provinces,
          overlayColor,
        )
        drawProvincesOverlay(
          countryLayerCanvasRef.current,
          countryLayerImageDataRef.current,
          provincePixelCacheRef.current,
          provinces,
          countryLayerAppearance?.color ?? null,
          countryLayerAppearance?.opacity ?? 1,
        )
      } else {
        dirtyRegion = drawProvinceOverlay(
          overlayCanvasRef.current,
          overlayImageDataRef.current,
          provincePixelCacheRef.current,
          provinces[0],
          overlayColor,
        )
        drawProvinceOverlay(
          countryLayerCanvasRef.current,
          countryLayerImageDataRef.current,
          provincePixelCacheRef.current,
          provinces[0],
          countryLayerAppearance?.color ?? null,
          countryLayerAppearance?.opacity ?? 1,
        )
      }

      if (dirtyRegion) {
        invalidateWrappedMap(dirtyRegion)
      }
    },
    [
      overlayCanvasRef,
      overlayImageDataRef,
      provincePixelCacheRef,
      countryLayerCanvasRef,
      countryLayerImageDataRef,
      invalidateWrappedMap,
    ],
  )

  return useMemo(
    () => ({
      renderProvinceAssignmentPatch,
      renderProvinceAssignments,
      renderCountryLayer,
    }),
    [
      renderProvinceAssignmentPatch,
      renderProvinceAssignments,
      renderCountryLayer,
    ],
  )
}
