import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix3,
  Matrix4,
  Mesh,
  OrthographicCamera,
  Quaternion,
  Raycaster,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'

const SPHERE_MARGIN_PX = 24
const DRAG_THRESHOLD_PX = 5
const KEYBOARD_ROTATION_RADIANS = Math.PI / 24
const KEYBOARD_SELECTION_HEIGHT_RATIO = 0.55
const MAX_DEVICE_PIXEL_RATIO = 2

const vertexShader = /* glsl */ `
  varying vec3 vSphereDirection;

  void main() {
    vSphereDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform mat3 uTextureRotation;

  varying vec3 vSphereDirection;

  const float PI = 3.141592653589793;

  void main() {
    vec3 sourceDirection = normalize(
      uTextureRotation * normalize(vSphereDirection)
    );
    float longitude = atan(sourceDirection.x, sourceDirection.z);
    float latitude = asin(clamp(sourceDirection.y, -1.0, 1.0));
    vec2 mapUv = vec2(
      fract(0.5 + longitude / (2.0 * PI)),
      clamp(0.5 - latitude / PI, 0.0, 1.0)
    );

    gl_FragColor = texture2D(uMap, mapUv);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function createEmptyTexture() {
  const texture = new DataTexture(
    new Uint8Array([255, 255, 255, 0]),
    1,
    1,
    RGBAFormat,
    UnsignedByteType,
  )

  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function markTextureForUpdate(texture) {
  texture.needsUpdate = true
}

function updateTextureRotation(material, orientation, scratchQuaternion, scratchMatrix) {
  scratchQuaternion.copy(orientation).invert()
  scratchMatrix.makeRotationFromQuaternion(scratchQuaternion)
  material.uniforms.uTextureRotation.value.setFromMatrix4(scratchMatrix)
}

function projectPointerToTrackball({ clientX, clientY, rect, radius, target }) {
  if (radius <= 0) {
    return null
  }

  const x = (clientX - (rect.left + rect.width / 2)) / radius
  const y = (rect.bottom - clientY) / radius
  const distanceSquared = x * x + y * y

  if (distanceSquared <= 1) {
    return target.set(x, y, Math.sqrt(1 - distanceSquared))
  }

  const inverseDistance = 1 / Math.sqrt(distanceSquared)
  return target.set(x * inverseDistance, y * inverseDistance, 0)
}

function getMapPixelFromDirection(direction, imageData) {
  const longitude = Math.atan2(direction.x, direction.z)
  const latitude = Math.asin(Math.min(1, Math.max(-1, direction.y)))
  const normalizedX = ((0.5 + longitude / (Math.PI * 2)) % 1 + 1) % 1
  const normalizedY = Math.min(1, Math.max(0, 0.5 - latitude / Math.PI))

  return {
    x: Math.min(imageData.width - 1, Math.floor(normalizedX * imageData.width)),
    y: Math.min(imageData.height - 1, Math.floor(normalizedY * imageData.height)),
  }
}

export function ThreeHemisphereMap({
  mapSize,
  sourceImageDataRef,
  provinceByRgbRef,
  mapTextureCanvasRef,
  mapTextureUpdateListenerRef,
  onProvinceInspect,
  isMapRendering,
}) {
  const instructionsId = useId()
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const meshRef = useRef(null)
  const materialRef = useRef(null)
  const emptyTextureRef = useRef(null)
  const mapTextureRef = useRef(null)
  const sphereRadiusRef = useRef(0)
  const renderFrameRef = useRef(null)
  const interactionRef = useRef(null)
  const onProvinceInspectRef = useRef(onProvinceInspect)
  const orientationRef = useRef(new Quaternion())
  const raycasterRef = useRef(new Raycaster())
  const pointerNdcRef = useRef(new Vector2())
  const pointerVectorRef = useRef(new Vector3())
  const sourceDirectionRef = useRef(new Vector3())
  const inverseOrientationRef = useRef(new Quaternion())
  const deltaQuaternionRef = useRef(new Quaternion())
  const keyboardQuaternionRef = useRef(new Quaternion())
  const horizontalAxisRef = useRef(new Vector3(0, 1, 0))
  const verticalAxisRef = useRef(new Vector3(1, 0, 0))
  const rotationMatrixRef = useRef(new Matrix4())
  const [hasTexture, setHasTexture] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [renderError, setRenderError] = useState('')
  const [textureVersion, setTextureVersion] = useState(0)

  const queueRender = useCallback(() => {
    if (renderFrameRef.current !== null) {
      return
    }

    renderFrameRef.current = requestAnimationFrame(() => {
      renderFrameRef.current = null

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    })
  }, [])

  const getSphereDirectionFromPointer = useCallback((event, target) => {
    const canvas = canvasRef.current
    const camera = cameraRef.current
    const mesh = meshRef.current

    if (!canvas || !camera || !mesh) {
      return null
    }

    const rect = canvas.getBoundingClientRect()

    if (!rect.width || !rect.height) {
      return null
    }

    pointerNdcRef.current.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycasterRef.current.setFromCamera(pointerNdcRef.current, camera)

    const intersection = raycasterRef.current.intersectObject(mesh, false)[0]

    return intersection ? target.copy(intersection.point).normalize() : null
  }, [])

  const inspectProvinceAtPointer = useCallback(
    (event) => {
      const imageData = sourceImageDataRef.current

      if (!imageData?.width || !imageData.height) {
        return
      }

      const visibleDirection = getSphereDirectionFromPointer(
        event,
        sourceDirectionRef.current,
      )

      if (!visibleDirection) {
        return
      }

      visibleDirection.applyQuaternion(
        inverseOrientationRef.current.copy(orientationRef.current).invert(),
      )

      const { x, y } = getMapPixelFromDirection(visibleDirection, imageData)
      const pixelIndex = (y * imageData.width + x) * 4
      const data = imageData.data
      const rgb = `${data[pixelIndex]},${data[pixelIndex + 1]},${data[pixelIndex + 2]}`

      onProvinceInspectRef.current?.({
        province: provinceByRgbRef.current.get(rgb),
        rgb,
        x,
        y,
      })
    },
    [getSphereDirectionFromPointer, provinceByRgbRef, sourceImageDataRef],
  )

  const finishPointerInteraction = useCallback(
    (event, shouldInspect) => {
      const interaction = interactionRef.current

      if (!interaction || interaction.pointerId !== event.pointerId) {
        return
      }

      interactionRef.current = null
      setIsDragging(false)

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      if (shouldInspect && !interaction.didDrag) {
        inspectProvinceAtPointer(event)
      }
    },
    [inspectProvinceAtPointer],
  )

  function handlePointerDown(event) {
    if (
      event.button !== 0 ||
      interactionRef.current ||
      !hasTexture ||
      isMapRendering ||
      renderError
    ) {
      return
    }

    const startVector = getSphereDirectionFromPointer(event, new Vector3())

    if (!startVector) {
      return
    }

    interactionRef.current = {
      didDrag: false,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOrientation: orientationRef.current.clone(),
      startVector,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
    event.preventDefault()
  }

  function handlePointerMove(event) {
    const interaction = interactionRef.current

    if (!interaction || interaction.pointerId !== event.pointerId) {
      return
    }

    if ((event.buttons & 1) === 0) {
      finishPointerInteraction(event, false)
      return
    }

    const distance = Math.hypot(
      event.clientX - interaction.startClientX,
      event.clientY - interaction.startClientY,
    )

    if (!interaction.didDrag && distance < DRAG_THRESHOLD_PX) {
      return
    }

    interaction.didDrag = true

    const canvas = canvasRef.current
    const material = materialRef.current

    if (!canvas || !material) {
      return
    }

    const currentVector = projectPointerToTrackball({
      clientX: event.clientX,
      clientY: event.clientY,
      rect: canvas.getBoundingClientRect(),
      radius: sphereRadiusRef.current,
      target: pointerVectorRef.current,
    })

    if (!currentVector) {
      return
    }

    deltaQuaternionRef.current.setFromUnitVectors(
      interaction.startVector,
      currentVector,
    )
    orientationRef.current
      .copy(interaction.startOrientation)
      .premultiply(deltaQuaternionRef.current)
      .normalize()
    updateTextureRotation(
      material,
      orientationRef.current,
      inverseOrientationRef.current,
      rotationMatrixRef.current,
    )
    queueRender()
    event.preventDefault()
  }

  function handlePointerUp(event) {
    finishPointerInteraction(event, true)
  }

  function handlePointerCancel(event) {
    finishPointerInteraction(event, false)
  }

  function handleKeyDown(event) {
    if (!hasTexture || isMapRendering || renderError) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      const canvas = canvasRef.current

      if (canvas) {
        const rect = canvas.getBoundingClientRect()

        inspectProvinceAtPointer({
          clientX: rect.left + rect.width / 2,
          clientY:
            rect.bottom -
            sphereRadiusRef.current * KEYBOARD_SELECTION_HEIGHT_RATIO,
        })
      }

      event.preventDefault()
      return
    }

    const material = materialRef.current
    let axis
    let angle

    if (event.key === 'ArrowLeft') {
      axis = horizontalAxisRef.current
      angle = -KEYBOARD_ROTATION_RADIANS
    } else if (event.key === 'ArrowRight') {
      axis = horizontalAxisRef.current
      angle = KEYBOARD_ROTATION_RADIANS
    } else if (event.key === 'ArrowUp') {
      axis = verticalAxisRef.current
      angle = -KEYBOARD_ROTATION_RADIANS
    } else if (event.key === 'ArrowDown') {
      axis = verticalAxisRef.current
      angle = KEYBOARD_ROTATION_RADIANS
    } else {
      return
    }

    if (!material) {
      return
    }

    keyboardQuaternionRef.current.setFromAxisAngle(axis, angle)
    orientationRef.current
      .premultiply(keyboardQuaternionRef.current)
      .normalize()
    updateTextureRotation(
      material,
      orientationRef.current,
      inverseOrientationRef.current,
      rotationMatrixRef.current,
    )
    queueRender()
    event.preventDefault()
  }

  useEffect(() => {
    onProvinceInspectRef.current = onProvinceInspect
  }, [onProvinceInspect])

  useEffect(() => {
    function handleTextureUpdate() {
      setTextureVersion((currentVersion) => currentVersion + 1)
    }

    mapTextureUpdateListenerRef.current = handleTextureUpdate

    return () => {
      if (mapTextureUpdateListenerRef.current === handleTextureUpdate) {
        mapTextureUpdateListenerRef.current = null
      }
    }
  }, [mapTextureUpdateListenerRef])

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current

    if (!root || !canvas) {
      return undefined
    }

    let renderer

    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        powerPreference: 'high-performance',
      })
    } catch {
      const errorFrame = requestAnimationFrame(() => {
        setRenderError('이 브라우저에서 3D 지도를 시작할 수 없습니다.')
      })

      return () => cancelAnimationFrame(errorFrame)
    }

    renderer.outputColorSpace = SRGBColorSpace
    renderer.setClearColor(0x000000, 0)

    const scene = new Scene()
    const camera = new OrthographicCamera(-1, 1, 1, 0, 0.1, 20000)
    camera.position.set(0, 0, 10000)
    camera.lookAt(0, 0, 0)

    const emptyTexture = createEmptyTexture()
    const geometry = new SphereGeometry(1, 128, 64)
    const material = new ShaderMaterial({
      fragmentShader,
      uniforms: {
        uMap: { value: emptyTexture },
        uTextureRotation: { value: new Matrix3() },
      },
      vertexShader,
    })
    const mesh = new Mesh(geometry, material)
    scene.add(mesh)

    rendererRef.current = renderer
    sceneRef.current = scene
    cameraRef.current = camera
    meshRef.current = mesh
    materialRef.current = material
    emptyTextureRef.current = emptyTexture

    updateTextureRotation(
      material,
      orientationRef.current,
      inverseOrientationRef.current,
      rotationMatrixRef.current,
    )

    function resize() {
      const rect = root.getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))
      const horizontalRadius = Math.max(1, width / 2 - SPHERE_MARGIN_PX)
      const verticalRadius = Math.max(1, height - SPHERE_MARGIN_PX)
      const radius = Math.min(horizontalRadius, verticalRadius)

      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO),
      )
      renderer.setSize(width, height, false)

      camera.left = -width / 2
      camera.right = width / 2
      camera.top = height
      camera.bottom = 0
      camera.updateProjectionMatrix()

      mesh.scale.setScalar(radius)
      mesh.updateMatrixWorld(true)
      sphereRadiusRef.current = radius
      root.style.setProperty(
        '--hemisphere-keyboard-target-bottom',
        `${radius * KEYBOARD_SELECTION_HEIGHT_RATIO}px`,
      )
      queueRender()
    }

    resize()

    let resizeObserver

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', resize)
    } else {
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(root)
    }

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', resize)

      if (renderFrameRef.current !== null) {
        cancelAnimationFrame(renderFrameRef.current)
        renderFrameRef.current = null
      }

      mapTextureRef.current?.dispose()
      mapTextureRef.current = null
      emptyTexture.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()

      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      meshRef.current = null
      materialRef.current = null
      emptyTextureRef.current = null
      interactionRef.current = null
    }
  }, [queueRender])

  useEffect(() => {
    const material = materialRef.current
    const renderer = rendererRef.current
    const sourceCanvas = mapTextureCanvasRef.current

    if (!material || !renderer) {
      return
    }

    if (!sourceCanvas?.width || !sourceCanvas.height) {
      mapTextureRef.current?.dispose()
      mapTextureRef.current = null
      material.uniforms.uMap.value = emptyTextureRef.current
      queueRender()

      const statusFrame = requestAnimationFrame(() => setHasTexture(false))
      return () => cancelAnimationFrame(statusFrame)
    }

    let texture = mapTextureRef.current

    if (!texture || texture.image !== sourceCanvas) {
      texture?.dispose()
      texture = new CanvasTexture(sourceCanvas)
      texture.colorSpace = SRGBColorSpace
      texture.flipY = false
      texture.wrapS = RepeatWrapping
      texture.wrapT = ClampToEdgeWrapping
      texture.magFilter = LinearFilter
      texture.minFilter = LinearMipmapLinearFilter
      texture.anisotropy = Math.min(
        8,
        renderer.capabilities.getMaxAnisotropy(),
      )
      mapTextureRef.current = texture
      material.uniforms.uMap.value = texture
    }

    markTextureForUpdate(texture)
    queueRender()

    const statusFrame = requestAnimationFrame(() => setHasTexture(true))
    return () => cancelAnimationFrame(statusFrame)
  }, [
    mapSize?.height,
    mapSize?.width,
    queueRender,
    mapTextureCanvasRef,
    textureVersion,
  ])

  const mapIsExpected = Boolean(mapSize?.width && mapSize.height)
  const statusMessage = renderError
    ? renderError
    : isMapRendering
      ? '3D 지도를 준비하고 있습니다.'
      : !hasTexture
        ? mapIsExpected
          ? '3D 지도 텍스처를 준비하고 있습니다.'
          : '표시할 지도 데이터가 없습니다.'
        : ''

  return (
    <section
      ref={rootRef}
      className="group absolute inset-0 min-h-0 min-w-0 overflow-hidden bg-slate-950 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
      aria-busy={Boolean(isMapRendering || (!hasTexture && mapIsExpected))}
      aria-describedby={instructionsId}
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Enter Space"
      aria-label="3D 반구 지도"
      onKeyDown={handleKeyDown}
      tabIndex={hasTexture && !isMapRendering && !renderError ? 0 : -1}
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 block size-full touch-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onLostPointerCapture={handlePointerCancel}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-hidden="true"
      />

      <p id={instructionsId} className="sr-only">
        지도를 드래그하면 반구 안의 지도가 회전합니다. 프로빈스를 확인하려면
        드래그하지 않고 클릭하세요. 키보드에서는 화살표 키로 회전하고 Enter
        또는 Space 키로 표시된 위치의 프로빈스를 확인할 수 있습니다.
      </p>

      <span
        className="pointer-events-none absolute bottom-[var(--hemisphere-keyboard-target-bottom)] left-1/2 z-5 size-4 translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-slate-950 bg-white/80 opacity-0 shadow-[0_0_0_2px_rgba(255,255,255,0.9)] transition-opacity group-focus-visible:opacity-100"
        aria-hidden="true"
      />

      {statusMessage ? (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <p
            className="bg-white px-3 py-2 text-sm font-semibold text-primary"
            role={renderError ? 'alert' : 'status'}
            aria-live="polite"
          >
            {statusMessage}
          </p>
        </div>
      ) : null}
    </section>
  )
}
