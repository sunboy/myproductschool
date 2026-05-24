'use client'

import { useEffect, useRef } from 'react'

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`

const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_color_a;
  uniform vec3 u_color_b;
  uniform vec3 u_color_c;
  uniform vec3 u_accent;
  uniform float u_intensity;

  vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  float fbm(vec2 p){
    float v = 0.0;
    float a = 0.5;
    for(int i = 0; i < 5; i++){
      v += a * snoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }
  void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;
    float t = u_time * 0.08;
    vec2 q = vec2(fbm(p * 1.2 + vec2(0.0, t)), fbm(p * 1.2 + vec2(5.2, 1.3 + t)));
    vec2 r = vec2(fbm(p * 1.4 + 2.0 * q + vec2(1.7, 9.2) + t * 0.5), fbm(p * 1.4 + 2.0 * q + vec2(8.3, 2.8) - t * 0.3));
    float n = fbm(p * 1.6 + 3.0 * r);
    float n2 = fbm(p * 2.4 - r * 1.2 - t * 0.4);
    float k1 = smoothstep(-0.3, 0.6, n);
    float k2 = smoothstep(-0.1, 0.7, n2);
    vec3 col = mix(u_color_a, u_color_b, k1);
    col = mix(col, u_color_c, k2 * 0.55);
    float vein = smoothstep(0.55, 0.62, n) - smoothstep(0.62, 0.68, n);
    col += u_accent * vein * 0.35;
    vec2 vc = uv - 0.5;
    float vig = smoothstep(0.95, 0.3, length(vc * vec2(1.2, 1.0)));
    col *= mix(0.78, 1.0, vig);
    float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.018;
    col += grain;
    col = mix(u_color_a, col, u_intensity);
    gl_FragColor = vec4(col, 1.0);
  }
`

const FOREST_PALETTE = ['#0c1410', '#1a3528', '#2d4a3e', '#7ee099'] as const

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export function ShaderCanvas({ className = '', speed = 1, intensity = 0.9 }: { className?: string; speed?: number; intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) {
      canvas.dataset.fallback = 'true'
      return
    }

    const compileShader = (type: number, source: string) => {
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

    const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)

    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      colorA: gl.getUniformLocation(program, 'u_color_a'),
      colorB: gl.getUniformLocation(program, 'u_color_b'),
      colorC: gl.getUniformLocation(program, 'u_color_c'),
      accent: gl.getUniformLocation(program, 'u_accent'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
    }
    const palette = FOREST_PALETTE.map(hexToRgb)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const start = performance.now()
    let frameId = 0
    let running = true
    let visible = true

    const render = (now: number) => {
      if (!running) return
      if (!visible) {
        frameId = requestAnimationFrame(render)
        return
      }
      resize()
      const time = reduced ? 0.4 : ((now - start) / 1000) * speed
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
      gl.uniform1f(uniforms.time, time)
      gl.uniform3f(uniforms.colorA, palette[0][0], palette[0][1], palette[0][2])
      gl.uniform3f(uniforms.colorB, palette[1][0], palette[1][1], palette[1][2])
      gl.uniform3f(uniforms.colorC, palette[2][0], palette[2][1], palette[2][2])
      gl.uniform3f(uniforms.accent, palette[3][0], palette[3][1], palette[3][2])
      gl.uniform1f(uniforms.intensity, intensity)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      if (reduced) return
      frameId = requestAnimationFrame(render)
    }

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting },
      { threshold: 0 }
    )
    visibilityObserver.observe(canvas)

    frameId = requestAnimationFrame(render)

    return () => {
      running = false
      cancelAnimationFrame(frameId)
      visibilityObserver.disconnect()
    }
  }, [intensity, speed])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
