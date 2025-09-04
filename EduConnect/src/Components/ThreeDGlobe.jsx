import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function ThreeDGlobe() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    const width = mountNode.clientWidth;
    const height = mountNode.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mountNode.appendChild(renderer.domElement);

    // Create the globe (sphere)
    const geometry = new THREE.SphereGeometry(0.9, 48, 48);
    const material = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.45,
      metalness: 0.5,
      transparent: true,
      opacity: 0.94,
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Optional: Add a wireframe overlay for a modern effect
    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x60a5fa, linewidth: 1 })
    );
    globe.add(wireframe);

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    // Animation loop
    let frameId;
    const animate = () => {
      globe.rotation.y += 0.009;
      globe.rotation.x += 0.002;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (mountNode && mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "180px",
        margin: "0 auto 1.5rem auto",
        borderRadius: "1rem",
        background: "transparent",
        overflow: "hidden",
      }}
      aria-label="Animated 3D EduConnect Globe"
    />
  );
}
