const HEIGHTMAP_WATER_LEVEL = 89

function getSourceSize(source) {
  return {
    width: source.naturalWidth || source.width,
    height: source.naturalHeight || source.height,
  }
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export function createRasterLayerMask(source, layerType) {
  const { width, height } = getSourceSize(source)
  const sourceCanvas = createCanvas(width, height)
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })

  sourceContext.drawImage(source, 0, 0, width, height)

  const sourceImageData = sourceContext.getImageData(0, 0, width, height)
  const maskImageData = new ImageData(width, height)
  const sourcePixels = sourceImageData.data
  const maskPixels = maskImageData.data

  for (let index = 0; index < sourcePixels.length; index += 4) {
    const red = sourcePixels[index]
    const green = sourcePixels[index + 1]
    const blue = sourcePixels[index + 2]
    let alpha = 0

    if (layerType === 'heightmap') {
      const elevation = (red + green + blue) / 3
      const normalizedElevation = Math.max(
        0,
        (elevation - HEIGHTMAP_WATER_LEVEL) / (255 - HEIGHTMAP_WATER_LEVEL),
      )
      alpha = Math.round(255 * Math.pow(normalizedElevation, 0.55))
    } else if (layerType === 'rivers') {
      const saturationRange = Math.max(red, green, blue) - Math.min(red, green, blue)
      alpha = saturationRange >= 20 ? 255 : 0
    }

    maskPixels[index] = 255
    maskPixels[index + 1] = 255
    maskPixels[index + 2] = 255
    maskPixels[index + 3] = alpha
  }

  const maskCanvas = createCanvas(width, height)
  maskCanvas.getContext('2d').putImageData(maskImageData, 0, 0)
  return maskCanvas
}

export function colorizeCanvasMask(
  maskCanvas,
  color,
  targetCanvas,
  backgroundColor = null,
) {
  if (!maskCanvas?.width || !targetCanvas) {
    return
  }

  if (
    targetCanvas.width !== maskCanvas.width ||
    targetCanvas.height !== maskCanvas.height
  ) {
    targetCanvas.width = maskCanvas.width
    targetCanvas.height = maskCanvas.height
  }

  const context = targetCanvas.getContext('2d')
  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
  context.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
  context.fillStyle = color
  context.fillRect(0, 0, targetCanvas.width, targetCanvas.height)
  context.globalCompositeOperation = 'destination-in'
  context.drawImage(maskCanvas, 0, 0)

  if (backgroundColor) {
    context.globalCompositeOperation = 'destination-over'
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, targetCanvas.width, targetCanvas.height)
  }

  context.globalCompositeOperation = 'source-over'
}

export function colorizeRasterLayer(maskCanvas, color, targetCanvas) {
  colorizeCanvasMask(maskCanvas, color, targetCanvas)
}

export function tintCanvasMask(canvas, color) {
  if (!canvas?.width) {
    return
  }

  const context = canvas.getContext('2d')
  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-in'
  context.fillStyle = color
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.globalCompositeOperation = 'source-over'
}

export function createColorizedRasterLayer(source, layerType, color) {
  const maskCanvas = createRasterLayerMask(source, layerType)
  const outputCanvas = createCanvas(maskCanvas.width, maskCanvas.height)
  colorizeRasterLayer(maskCanvas, color, outputCanvas)
  return outputCanvas
}
