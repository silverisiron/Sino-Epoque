const HEIGHTMAP_IMAGE_PATH = '/maps/base/bmp/heightmap.bmp'
const RIVERS_IMAGE_PATH = '/maps/base/bmp/rivers.bmp'

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`이미지를 불러올 수 없습니다: ${source}`))
    image.src = source
  })
}

function createPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('PNG 이미지를 생성할 수 없습니다.'))
      }
    }, 'image/png')
  })
}

function downloadBlob(fileName, blob) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

function drawLayer(context, source, width, height) {
  if (source?.width) {
    context.drawImage(source, 0, 0, width, height)
  }
}

export async function downloadRenderedMapPng({
  baseCanvas,
  borderCanvas,
  heightmapVisible,
  overlayCanvas,
  riversVisible,
  sphereCanvas,
}) {
  if (!baseCanvas?.width || !baseCanvas.height) {
    throw new Error('내보낼 지도가 아직 준비되지 않았습니다.')
  }

  const [heightmapImage, riversImage] = await Promise.all([
    heightmapVisible ? loadImage(HEIGHTMAP_IMAGE_PATH) : null,
    riversVisible ? loadImage(RIVERS_IMAGE_PATH) : null,
  ])
  const exportCanvas = document.createElement('canvas')
  const width = baseCanvas.width
  const height = baseCanvas.height

  exportCanvas.width = width
  exportCanvas.height = height

  const context = exportCanvas.getContext('2d')

  context.imageSmoothingEnabled = true
  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
  drawLayer(context, baseCanvas, width, height)
  drawLayer(context, overlayCanvas, width, height)
  drawLayer(context, sphereCanvas, width, height)
  context.globalCompositeOperation = 'multiply'

  if (heightmapImage) {
    context.globalAlpha = 0.35
    drawLayer(context, heightmapImage, width, height)
  }

  if (riversImage) {
    context.globalAlpha = 1
    drawLayer(context, riversImage, width, height)
  }

  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
  drawLayer(context, borderCanvas, width, height)

  downloadBlob('map-render.png', await createPngBlob(exportCanvas))
}
