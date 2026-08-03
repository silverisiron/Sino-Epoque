function drawLayer(context, source, sourceRegion, targetRegion) {
  if (!source?.width) {
    return
  }

  context.drawImage(
    source,
    sourceRegion.x,
    sourceRegion.y,
    sourceRegion.width,
    sourceRegion.height,
    targetRegion.x,
    targetRegion.y,
    targetRegion.width,
    targetRegion.height,
  )
}

export function compositeMapLayers({
  baseCanvas,
  borderCanvas,
  context,
  countryLayerCanvas,
  heightmapSource,
  heightmapVisible,
  overlayCanvas,
  riversSource,
  riversVisible,
  sourceRegion,
  targetRegion,
}) {
  context.imageSmoothingEnabled = true
  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
  drawLayer(context, baseCanvas, sourceRegion, targetRegion)
  drawLayer(context, overlayCanvas, sourceRegion, targetRegion)
  drawLayer(context, countryLayerCanvas, sourceRegion, targetRegion)
  context.globalCompositeOperation = 'multiply'

  if (heightmapVisible && heightmapSource?.naturalWidth) {
    context.globalAlpha = 0.35
    drawLayer(context, heightmapSource, sourceRegion, targetRegion)
  }

  if (riversVisible && riversSource?.naturalWidth) {
    context.globalAlpha = 1
    drawLayer(context, riversSource, sourceRegion, targetRegion)
  }

  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
  drawLayer(context, borderCanvas, sourceRegion, targetRegion)
}
