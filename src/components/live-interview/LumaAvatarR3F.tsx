'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Avatar } from '@readyplayerme/visage'
import type { Mesh } from 'three'

interface LipSyncDriverProps {
  audioAnalyser: AnalyserNode | null
  isSpeaking: boolean
  meshRef: React.MutableRefObject<Mesh | null>
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
    if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return

    const mouthIndex = mesh.morphTargetDictionary['mouthOpen'] ?? mesh.morphTargetDictionary['viseme_O']
    if (mouthIndex === undefined) return

    if (!isSpeaking || !audioAnalyser || !dataRef.current) {
      // Smoothly close mouth when not speaking
      mesh.morphTargetInfluences[mouthIndex] = Math.max(0, (mesh.morphTargetInfluences[mouthIndex] ?? 0) - 0.05)
      return
    }

    audioAnalyser.getByteFrequencyData(dataRef.current)
    const avg = dataRef.current.reduce((s, v) => s + v, 0) / dataRef.current.length
    // Map 0-128 amplitude range to 0-1 mouth open, smoothed
    const target = Math.min(1, avg / 80)
    const current = mesh.morphTargetInfluences[mouthIndex] ?? 0
    // Lerp for smooth animation
    mesh.morphTargetInfluences[mouthIndex] = current + (target - current) * 0.3
  })

  return null
}

interface LumaAvatarR3FProps {
  audioAnalyser: AnalyserNode | null
  isSpeaking: boolean
  modelSrc: string
  className?: string
}

export default function LumaAvatarR3F({ audioAnalyser, isSpeaking, modelSrc, className }: LumaAvatarR3FProps) {
  const lipSyncMeshRef = useRef<Mesh | null>(null)

  const handleMeshCallback = (mesh: Mesh) => {
    // Find a mesh with mouthOpen or viseme morph targets for lip-sync
    if (
      mesh.morphTargetDictionary &&
      (mesh.morphTargetDictionary['mouthOpen'] !== undefined ||
        mesh.morphTargetDictionary['viseme_O'] !== undefined)
    ) {
      lipSyncMeshRef.current = mesh
    }
  }

  return (
    <div className={`w-full h-full ${className ?? ''}`}>
      <Avatar
        modelSrc={modelSrc}
        cameraTarget={1.65}
        cameraInitialDistance={2.5}
        halfBody={false}
        meshCallback={handleMeshCallback}
        style={{ background: 'transparent' }}
        className="w-full h-full"
      >
        <LipSyncDriver
          audioAnalyser={audioAnalyser}
          isSpeaking={isSpeaking}
          meshRef={lipSyncMeshRef}
        />
      </Avatar>
    </div>
  )
}
