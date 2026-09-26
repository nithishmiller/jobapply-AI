"use client"

import { useRef, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Points } from "@react-three/drei"
import * as THREE from "three"

const PARTICLE_COUNT = 120
const CONNECTION_DISTANCE = 1.8

export function HeroNeuralCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!canvasRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    canvasRef.current.addEventListener("mousemove", handleMouseMove)
    return () => canvasRef.current?.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none" ref={canvasRef}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ touchAction: "none" }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        shadows={false}
      >
        <NeuralParticles />
      </Canvas>
    </div>
  )
}

function NeuralParticles() {
  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 2.5 + Math.random() * 1.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = radius * Math.cos(phi)
    }
    return arr
  }, [])

  const colors = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = 0.42
      arr[i * 3 + 1] = 0.78
      arr[i * 3 + 2] = 0.83
    }
    return arr
  }, [])

  const sizes = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i] = 2 + Math.random() * 3
    }
    return arr
  }, [])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1))
    return g
  }, [positions, colors, sizes])

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      vertexColors: true,
      size: 0.05,
    })
  }, [])

  return (
    <>
      <Points
        geometry={geometry}
        material={material}
      />
      <ConnectionLines positions={positions} />
    </>
  )
}

function ConnectionLines({ positions }: { positions: Float32Array }) {
  const { scene } = useThree()
  const linesRef = useRef<THREE.LineSegments | null>(null)

  useEffect(() => {
    const geometry = new THREE.BufferGeometry()
    const linePositions: number[] = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const dx = positions[i * 3] - positions[j * 3]
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1]
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (dist < CONNECTION_DISTANCE) {
          linePositions.push(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2],
            positions[j * 3],
            positions[j * 3 + 1],
            positions[j * 3 + 2]
          )
        }
      }
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3))
    const material = new THREE.LineBasicMaterial({
      color: 0x6cc6d4,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    })
    const lines = new THREE.LineSegments(geometry, material)
    linesRef.current = lines
    scene.add(lines)

    return () => {
      scene.remove(lines)
      geometry.dispose()
      material.dispose()
    }
  }, [scene, positions])

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime()
    if (linesRef.current) {
      linesRef.current.rotation.y = elapsed * 0.015
      linesRef.current.rotation.x = Math.sin(elapsed * 0.1) * 0.05
    }
  })

  return null
}