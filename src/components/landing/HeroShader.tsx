'use client'

import { useEffect, useRef } from 'react'

const VERTEX_SHADER = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_motion;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotate = mat2(0.82, -0.58, 0.58, 0.82);

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotate * p * 2.08 + 18.4;
    amplitude *= 0.48;
  }

  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_motion;
  vec2 flow = vec2(
    fbm(p * 1.25 + vec2(t * 0.05, -t * 0.035)),
    fbm(p * 1.35 + vec2(-t * 0.04, t * 0.045))
  );

  float field = fbm(p * 2.25 + flow * 1.45 + vec2(t * 0.035, 0.0));
  float caustic = sin((p.x * 3.1 + p.y * 2.2 + field * 2.4 + t * 0.22) * 3.14159);
  float vein = smoothstep(0.2, 0.96, field + caustic * 0.14);
  float leftGlow = smoothstep(0.92, 0.05, distance(uv, vec2(0.12, 0.72)));
  float rightGlow = smoothstep(0.88, 0.05, distance(uv, vec2(0.82, 0.18)));
  float stageGlow = smoothstep(0.7, 0.1, distance(uv, vec2(0.56, 0.52)));

  vec3 base = vec3(0.035, 0.073, 0.052);
  vec3 forest = vec3(0.055, 0.18, 0.12);
  vec3 mint = vec3(0.55, 0.88, 0.63);
  vec3 amber = vec3(0.95, 0.56, 0.18);
  vec3 blue = vec3(0.20, 0.42, 0.76);

  vec3 color = mix(base, forest, vein * 0.72 + stageGlow * 0.22);
  color += mint * leftGlow * 0.26;
  color += amber * rightGlow * 0.18;
  color += blue * stageGlow * 0.12;

  float gridX = smoothstep(0.98, 1.0, 1.0 - abs(fract(uv.x * 31.0) - 0.5) * 2.0);
  float gridY = smoothstep(0.985, 1.0, 1.0 - abs(fract(uv.y * 18.0) - 0.5) * 2.0);
  float grid = (gridX + gridY) * 0.045;
  color += vec3(0.68, 0.95, 0.76) * grid;

  float vignette = smoothstep(0.98, 0.22, distance(uv, vec2(0.5, 0.42)));
  color *= 0.62 + vignette * 0.58;

  float grain = hash(gl_FragCoord.xy + t * 42.0) * 0.035;
  color += grain;

  gl_FragColor = vec4(color, 1.0);
}
`

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()
  if (!program) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  return program
}

export function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
    })

    if (!gl) {
      canvas.dataset.fallback = 'true'
      return
    }

    const shaderCanvas = canvas
    const context = gl

    const program = createProgram(context)
    if (!program) {
      shaderCanvas.dataset.fallback = 'true'
      return
    }

    const positionLocation = context.getAttribLocation(program, 'a_position')
    const resolutionLocation = context.getUniformLocation(program, 'u_resolution')
    const timeLocation = context.getUniformLocation(program, 'u_time')
    const motionLocation = context.getUniformLocation(program, 'u_motion')
    const buffer = context.createBuffer()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let start = performance.now()

    context.bindBuffer(context.ARRAY_BUFFER, buffer)
    context.bufferData(
      context.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      context.STATIC_DRAW,
    )

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.75)
      const width = Math.max(1, Math.floor(shaderCanvas.clientWidth * ratio))
      const height = Math.max(1, Math.floor(shaderCanvas.clientHeight * ratio))

      if (shaderCanvas.width !== width || shaderCanvas.height !== height) {
        shaderCanvas.width = width
        shaderCanvas.height = height
        context.viewport(0, 0, width, height)
      }
    }

    function render(now: number) {
      resize()

      context.useProgram(program)
      context.enableVertexAttribArray(positionLocation)
      context.bindBuffer(context.ARRAY_BUFFER, buffer)
      context.vertexAttribPointer(positionLocation, 2, context.FLOAT, false, 0, 0)
      context.uniform2f(resolutionLocation, shaderCanvas.width, shaderCanvas.height)
      context.uniform1f(timeLocation, (now - start) / 1000)
      context.uniform1f(motionLocation, reducedMotion ? 0 : 1)
      context.drawArrays(context.TRIANGLES, 0, 6)

      if (!reducedMotion) {
        frame = window.requestAnimationFrame(render)
      }
    }

    frame = window.requestAnimationFrame((now) => {
      start = now
      render(now)
    })
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      window.cancelAnimationFrame(frame)
      context.deleteBuffer(buffer)
      context.deleteProgram(program)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="mkt-shader-canvas"
      aria-hidden="true"
    />
  )
}
