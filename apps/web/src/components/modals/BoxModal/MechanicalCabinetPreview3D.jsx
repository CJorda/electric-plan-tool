import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const FACE_OPTIONS = [
  { id: "front", short: "F", label: "Frontal" },
  { id: "back", short: "T", label: "Trasera" },
  { id: "right", short: "D", label: "Derecha" },
  { id: "left", short: "I", label: "Izquierda" },
  { id: "top", short: "S", label: "Superior" },
  { id: "bottom", short: "B", label: "Inferior" },
];

const FACE_PRESETS = {
  front: { direction: [0, 0, 1], up: [0, 1, 0] },
  back: { direction: [0, 0, -1], up: [0, 1, 0] },
  right: { direction: [1, 0, 0], up: [0, 1, 0] },
  left: { direction: [-1, 0, 0], up: [0, 1, 0] },
  top: { direction: [0, 1, 0], up: [0, 0, -1] },
  bottom: { direction: [0, -1, 0], up: [0, 0, 1] },
};

const RAL_7035 = "#c5c7c4";

const toVector3 = (value = [0, 0, 0]) => new THREE.Vector3(value[0], value[1], value[2]);

const getFitDistance = (camera, sphereRadius, aspect, margin = 1.45) => {
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(aspect, 0.001));
  const limitingFov = Math.min(verticalFov, horizontalFov);
  return (sphereRadius / Math.sin(limitingFov / 2)) * margin;
};

const applyFaceTarget = (faceId, targetDirection, targetUp) => {
  const preset = FACE_PRESETS[faceId] || FACE_PRESETS.front;
  targetDirection.copy(toVector3(preset.direction)).normalize();
  targetUp.copy(toVector3(preset.up)).normalize();
};

const disposeObject = (root) => {
  root.traverse((node) => {
    if (node.geometry) {
      node.geometry.dispose();
    }
    if (node.material) {
      if (Array.isArray(node.material)) {
        node.material.forEach((material) => material.dispose());
      } else {
        node.material.dispose();
      }
    }
  });
};

function MechanicalCabinetPreview3D({ model, placement }) {
  const stageRef = useRef(null);
  const sceneApiRef = useRef({
    setFace: null,
    setMarker: null,
  });
  const initialModelRef = useRef(model);
  const initialPlacementRef = useRef(placement);
  const [activeFace, setActiveFace] = useState("front");

  useEffect(() => {
    const host = stageRef.current;
    if (!host) return undefined;

    let frameId = 0;
    let renderer = null;
    let observer = null;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#f3f5f7");

      const lookAtTarget = new THREE.Vector3(0, 0.18, 0);
      const desiredPosition = new THREE.Vector3();
      const desiredDirection = toVector3(FACE_PRESETS.front.direction).normalize();
      const desiredUp = toVector3(FACE_PRESETS.front.up);
      const boxBounds = new THREE.Box3();
      const sphereBounds = new THREE.Sphere();
      let currentFaceId = "front";

      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 70);
      camera.position.set(3.9, 2.7, 3.85);
      camera.up.set(0, 1, 0);
      camera.lookAt(lookAtTarget);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.28;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      host.innerHTML = "";
      host.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambient);

      const hemi = new THREE.HemisphereLight(0xffffff, 0xd7dee6, 0.45);
      hemi.position.set(0, 4, 0);
      scene.add(hemi);

      const key = new THREE.DirectionalLight(0xffffff, 1.45);
      key.position.set(4.4, 6.2, 4.2);
      key.castShadow = true;
      key.shadow.mapSize.width = 1024;
      key.shadow.mapSize.height = 1024;
      key.shadow.camera.near = 0.2;
      key.shadow.camera.far = 20;
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xbfd4ff, 0.72);
      fill.position.set(-4.5, 2.8, -3.2);
      scene.add(fill);

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(6, 96),
        new THREE.MeshStandardMaterial({
          color: "#e4e9ef",
          metalness: 0.02,
          roughness: 0.95,
        })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.5;
      floor.receiveShadow = true;
      scene.add(floor);

      const cabinetGroup = new THREE.Group();
      scene.add(cabinetGroup);

      const bodyWidth = 2.02;
      const bodyHeight = 2.48;
      const bodyDepth = 1.36;
      const bodyCenterY = 0.08;
      const bodyHalfHeight = bodyHeight / 2;
      const bodyFrontZ = bodyDepth / 2;

      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: RAL_7035,
        metalness: 0.28,
        roughness: 0.54,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth), bodyMaterial);
      body.position.y = bodyCenterY;
      body.castShadow = true;
      body.receiveShadow = true;
      cabinetGroup.add(body);

      const topCap = new THREE.Mesh(
        new THREE.BoxGeometry(bodyWidth + 0.04, 0.05, bodyDepth + 0.04),
        new THREE.MeshStandardMaterial({
          color: "#d1d3ce",
          metalness: 0.25,
          roughness: 0.5,
        })
      );
      topCap.position.set(0, bodyCenterY + bodyHalfHeight + 0.025, 0);
      topCap.castShadow = true;
      cabinetGroup.add(topCap);

      const bottomLip = new THREE.Mesh(
        new THREE.BoxGeometry(bodyWidth + 0.03, 0.04, bodyDepth + 0.03),
        new THREE.MeshStandardMaterial({
          color: "#b7bbb3",
          metalness: 0.18,
          roughness: 0.66,
        })
      );
      bottomLip.position.set(0, bodyCenterY - bodyHalfHeight + 0.02, 0);
      cabinetGroup.add(bottomLip);

      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.68, 2.18, 0.06),
        new THREE.MeshStandardMaterial({
          color: "#d8dad5",
          metalness: 0.22,
          roughness: 0.61,
        })
      );
      door.position.set(0, bodyCenterY, bodyFrontZ + 0.03);
      door.castShadow = true;
      cabinetGroup.add(door);

      const doorRecess = new THREE.Mesh(
        new THREE.BoxGeometry(1.42, 1.92, 0.018),
        new THREE.MeshStandardMaterial({
          color: "#cdd0c9",
          metalness: 0.18,
          roughness: 0.68,
        })
      );
      doorRecess.position.set(0, bodyCenterY, bodyFrontZ + 0.056);
      cabinetGroup.add(doorRecess);

      const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(1.78, 2.28, 0.014),
        new THREE.MeshStandardMaterial({
          color: "#b6bab3",
          metalness: 0.25,
          roughness: 0.58,
        })
      );
      doorFrame.position.set(0, bodyCenterY, bodyFrontZ + 0.005);
      cabinetGroup.add(doorFrame);

      const frame = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(bodyWidth + 0.02, bodyHeight + 0.02, bodyDepth + 0.02)),
        new THREE.LineBasicMaterial({ color: "#6b7280" })
      );
      frame.position.y = bodyCenterY;
      cabinetGroup.add(frame);

      const sideSeamMaterial = new THREE.MeshStandardMaterial({
        color: "#a8ada5",
        metalness: 0.2,
        roughness: 0.68,
      });
      const rightSeam = new THREE.Mesh(new THREE.BoxGeometry(0.016, bodyHeight - 0.16, bodyDepth - 0.14), sideSeamMaterial);
      rightSeam.position.set(bodyWidth / 2, bodyCenterY, 0);
      cabinetGroup.add(rightSeam);
      const leftSeam = rightSeam.clone();
      leftSeam.position.x = -bodyWidth / 2;
      cabinetGroup.add(leftSeam);

      const upperHinge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.52, 12),
        new THREE.MeshStandardMaterial({ color: "#6b7280", metalness: 0.7, roughness: 0.32 })
      );
      upperHinge.rotation.x = Math.PI / 2;
      upperHinge.position.set(-0.8, 0.62, bodyFrontZ + 0.064);
      cabinetGroup.add(upperHinge);

      const lowerHinge = upperHinge.clone();
      lowerHinge.position.y = -0.48;
      cabinetGroup.add(lowerHinge);

      const handleHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.48, 0.058),
        new THREE.MeshStandardMaterial({
          color: "#2f3742",
          metalness: 0.52,
          roughness: 0.38,
        })
      );
      handleHousing.position.set(0.7, 0.08, bodyFrontZ + 0.06);
      cabinetGroup.add(handleHousing);

      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.24, 0.08),
        new THREE.MeshStandardMaterial({
          color: "#8a95a2",
          metalness: 0.85,
          roughness: 0.2,
        })
      );
      handle.position.set(0.7, 0.08, bodyFrontZ + 0.095);
      cabinetGroup.add(handle);

      const latch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.013, 0.09, 12),
        new THREE.MeshStandardMaterial({ color: "#cfd6de", metalness: 0.8, roughness: 0.26 })
      );
      latch.rotation.z = Math.PI / 2;
      latch.position.set(0.7, -0.04, bodyFrontZ + 0.093);
      cabinetGroup.add(latch);

      const bracketMaterial = new THREE.MeshStandardMaterial({
        color: "#aeb3ab",
        metalness: 0.18,
        roughness: 0.7,
      });
      const bracketGeometry = new THREE.BoxGeometry(0.16, 0.12, 0.05);
      const bracketOffsets = [
        [0.84, 1.06, -0.71],
        [-0.84, 1.06, -0.71],
        [0.84, -0.9, -0.71],
        [-0.84, -0.9, -0.71],
      ];
      bracketOffsets.forEach(([x, y, z]) => {
        const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
        bracket.position.set(x, y, z);
        cabinetGroup.add(bracket);
      });

      const markerGroup = new THREE.Group();
      cabinetGroup.add(markerGroup);

      const getCabinetBoundsSphere = () => {
        boxBounds.setFromObject(cabinetGroup);
        boxBounds.getBoundingSphere(sphereBounds);
        return sphereBounds;
      };

      const clearMarker = () => {
        while (markerGroup.children.length > 0) {
          const child = markerGroup.children[0];
          markerGroup.remove(child);
          child.traverse((node) => {
            if (node.geometry) {
              node.geometry.dispose();
            }
            if (node.material) {
              if (Array.isArray(node.material)) {
                node.material.forEach((material) => material.dispose());
              } else {
                node.material.dispose();
              }
            }
          });
        }
      };

      const setMarker = () => {
        clearMarker();
      };

      const updateFaceCameraTarget = (faceId, immediate = false) => {
        currentFaceId = faceId;
        applyFaceTarget(faceId, desiredDirection, desiredUp);
        const boundsSphere = getCabinetBoundsSphere();
        const fitDistance = getFitDistance(
          camera,
          Math.max(boundsSphere.radius, 1.4),
          camera.aspect,
          1.45
        );
        lookAtTarget.copy(boundsSphere.center);
        desiredPosition.copy(boundsSphere.center).add(desiredDirection.clone().multiplyScalar(fitDistance));

        if (immediate) {
          camera.position.copy(desiredPosition);
          camera.up.copy(desiredUp);
          camera.lookAt(lookAtTarget);
        }
      };

      const setFace = (faceId, immediate = false) => {
        updateFaceCameraTarget(faceId, immediate);
      };

      sceneApiRef.current = {
        setFace,
        setMarker,
      };

      setMarker(initialModelRef.current, initialPlacementRef.current);
      setFace("front", true);

      const resize = () => {
        const width = Math.max(220, host.clientWidth || 220);
        const height = Math.max(200, host.clientHeight || 200);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        updateFaceCameraTarget(currentFaceId, true);
      };

      resize();
      observer = new ResizeObserver(() => resize());
      observer.observe(host);

      const animate = () => {
        camera.position.lerp(desiredPosition, 0.14);
        camera.up.lerp(desiredUp, 0.16).normalize();
        camera.lookAt(lookAtTarget);
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        cancelAnimationFrame(frameId);
        observer?.disconnect();
        sceneApiRef.current.setFace = null;
        sceneApiRef.current.setMarker = null;
        disposeObject(scene);
        renderer.dispose();
        if (renderer.domElement.parentElement === host) {
          host.removeChild(renderer.domElement);
        }
      };
    } catch {
      host.innerHTML = "<div class='modal__three-fallback'>No se pudo inicializar la vista 3D.</div>";
      return () => {
        cancelAnimationFrame(frameId);
        observer?.disconnect();
        sceneApiRef.current.setFace = null;
        sceneApiRef.current.setMarker = null;
        if (renderer) {
          renderer.dispose();
          if (renderer.domElement.parentElement === host) {
            host.removeChild(renderer.domElement);
          }
        }
      };
    }
  // Keep the Three scene alive and update only controls/marker to avoid re-initialization flashes.
  }, []);

  useEffect(() => {
    sceneApiRef.current.setMarker?.(model, placement);
  }, [model, placement]);

  useEffect(() => {
    sceneApiRef.current.setFace?.(activeFace);
  }, [activeFace]);

  return (
    <div className="modal__three-wrap">
      <div className="modal__three-stage" ref={stageRef} />
      <div className="modal__three-faces" role="group" aria-label="Caras del cuadro">
        {FACE_OPTIONS.map((face) => (
          <button
            key={face.id}
            type="button"
            className={`modal__three-face${activeFace === face.id ? " is-active" : ""}`}
            onClick={() => setActiveFace(face.id)}
            aria-label={face.label}
            title={face.label}
          >
            <span className="modal__three-face-label">{face.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default MechanicalCabinetPreview3D;
