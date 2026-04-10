'use client'

import { useRef, useEffect, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls, Environment } from '@react-three/drei'
import type { Group, SkinnedMesh, Object3D } from 'three'

// Local robot avatar with facial expressions and animations
const DEFAULT_MODEL_URL = '/luma-avatar.glb'

// Map Luma states to robot animations
const STATE_TO_ANIMATION: Record<string, string> = {
  idle: 'Idle',
  listening: 'Idle',
  speaking: 'Walking',    // Slight movement while talking
  thinking: 'Sitting',    // Contemplative pose
  intrigued: 'ThumbsUp',
  challenging: 'Punch',
  delighted: 'Dance',
  celebrating: 'Dance',
  reviewing: 'Standing',
}

interface LipSyncDriverProps {
  audioAnalyser: AnalyserNode | null
  isSpeaking: boolean
  meshRef: React.MutableRefObject<SkinnedMesh | null>
}

function LipSyncDriver({ audioAnalyser, isSpeaking, meshRef }: LipSyncDriverProps) {
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

  useEffect(() => {
    if (audioAnalyser) {
      dataRef.current = new Uint8Array(audioAnalyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    }
  }, [audioAnalyser])

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh?.morphTargetDictionary || !mesh.morphTargetInfluences) return

    // Use 'Surprised' as a speaking morph (opens the face expression)
    const speakIndex = mesh.morphTargetDictionary['Surprised']
    if (speakIndex === undefined) return

    if (!isSpeaking || !audioAnalyser || !dataRef.current) {
      mesh.morphTargetInfluences[speakIndex] = Math.max(
        0,
        (mesh.morphTargetInfluences[speakIndex] ?? 0) - 0.05
      )
      return
    }

    audioAnalyser.getByteFrequencyData(dataRef.current)
    const avg = dataRef.current.reduce((s, v) => s + v, 0) / dataRef.current.length
    const target = Math.min(0.6, avg / 120) // Subtler than full mouth open
    const current = mesh.morphTargetInfluences[speakIndex] ?? 0
    mesh.morphTargetInfluences[speakIndex] = current + (target - current) * 0.3
  })

  return null
}

interface AvatarModelProps {
  modelSrc: string
  audioAnalyser: AnalyserNode | null
  isSpeaking: boolean
  lumaState: string
}

function AvatarModel({ modelSrc, audioAnalyser, isSpeaking, lumaState }: AvatarModelProps) {
  const groupRef = useRef<Group>(null)
  const { scene, animations } = useGLTF(modelSrc)
  const { actions } = useAnimations(animations, groupRef)
  const lipSyncMeshRef = useRef<SkinnedMesh | null>(null)
  const currentActionRef = useRef<string>('')

  // Clone scene to avoid shared state issues
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Find morph target mesh
  useEffect(() => {
    clonedScene.traverse((child: Object3D) => {
      const mesh = child as SkinnedMesh
      if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetDictionary['Surprised'] !== undefined) {
        lipSyncMeshRef.current = mesh
      }
    })
  }, [clonedScene])

  // Switch animations based on state
  useEffect(() => {
    const animName = STATE_TO_ANIMATION[lumaState] ?? 'Idle'
    if (animName === currentActionRef.current) return

    const prevAction = actions[currentActionRef.current]
    const nextAction = actions[animName]

    if (nextAction) {
      nextAction.reset().fadeIn(0.4).play()
      if (prevAction) prevAction.fadeOut(0.4)
      currentActionRef.current = animName
    }
  }, [lumaState, actions])

  // Start with Idle on mount
  useEffect(() => {
    const idle = actions['Idle']
    if (idle) {
      idle.reset().play()
      currentActionRef.current = 'Idle'
    }
  }, [actions])

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} position={[0, -1.15, 0]} scale={0.6} />
      <LipSyncDriver
        audioAnalyser={audioAnalyser}
        isSpeaking={isSpeaking}
        meshRef={lipSyncMeshRef}
      />
    </group>
  )
}

function AvatarFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color="#4a7c59" transparent opacity={0.5} />
    </mesh>
  )
}

interface LumaAvatarR3FProps {
  audioAnalyser: AnalyserNode | null
  isSpeaking: boolean
  lumaState?: string
  modelSrc?: string
  className?: string
}

export default function LumaAvatarR3F({
  audioAnalyser,
  isSpeaking,
  lumaState = 'idle',
  modelSrc = DEFAULT_MODEL_URL,
  className,
}: LumaAvatarR3FProps) {
  return (
    <div className={`w-full h-full ${className ?? ''}`}>
      <Canvas
        camera={{ position: [0, -0.05, 1.6], fov: 34 }}
        gl={{ antialias: true }}
      >
        {/* Soft studio lighting for face */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 3]} intensity={1.0} />
        <directionalLight position={[-2, 1, -1]} intensity={0.3} />
        <pointLight position={[0, 1, 2]} intensity={0.4} color="#8ecf9e" />
        {/* Subtle environment for reflections and atmosphere */}
        <Environment preset="sunset" background backgroundBlurriness={0.8} />
        <Suspense fallback={<AvatarFallback />}>
          <AvatarModel
            modelSrc={modelSrc}
            audioAnalyser={audioAnalyser}
            isSpeaking={isSpeaking}
            lumaState={lumaState}
          />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.2}
          maxPolarAngle={Math.PI / 2.0}
          target={[0, 0.05, 0]}
        />
      </Canvas>
    </div>
  )
}
