import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import GUI from "lil-gui"
import * as CANNON from "cannon-es"

// ...

/**
 * Debug
 */
const gui = new GUI()

const settings = {
  restitution: 0.7,
  createSphere: () => {
    createSphere(0.5, {
      x: (Math.random() - 0.5) * 3,
      y: 3,
      z: (Math.random() - 0.5) * 3,
    })
  },
  createBox: () => {
    createBoxes(Math.random(), {
      x: (Math.random() - 0.5) * 3,
      y: 3,
      z: (Math.random() - 0.5) * 3,
    })
  },
  reset: () => {
    for (const sphere of spheresToUpdate) {
      scene.remove(sphere.mesh)
      sphere.body.removeEventListener("collide", playHitSound)
      // world.remove(sphere.body)
    }
    for (const box of boxesToUpdate) {
      scene.remove(box.mesh)
      box.body.removeEventListener("collide", playHitSound)
      //  world.remove(box.body)
    }
    spheresToUpdate = []
    boxesToUpdate = []
  },
}

gui.add(settings, "createSphere")
gui.add(settings, "createBox")
gui.add(settings, "reset")

gui
  .add(settings, "restitution")
  .min(0)
  .max(1)
  .step(0.01)
  .onFinishChange(() => {
    concretePlasticContactMaterial.restitution = settings.restitution
  })

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene
const scene = new THREE.Scene()

// SOUNDS

const hitSound = new Audio("/sounds/hit.mp3")

const playHitSound = (collision) => {
  // if impact is greater than 1, play the sound
  const impactStrength = collision.contact.getImpactVelocityAlongNormal()

  if (impactStrength > 1.5) {
    // randomize sound pitch for realism
    hitSound.volume = Math.random()
    // move the sound to the beginning
    hitSound.currentTime = 0

    hitSound.play()
  }
}

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
  "/textures/environmentMaps/0/px.png",
  "/textures/environmentMaps/0/nx.png",
  "/textures/environmentMaps/0/py.png",
  "/textures/environmentMaps/0/ny.png",
  "/textures/environmentMaps/0/pz.png",
  "/textures/environmentMaps/0/nz.png",
])

/**
 * Physics
 */

const world = new CANNON.World()
// add gravity with the gravity property
// gravity force is 9.82 m/s^2, negative value because it's going down
world.gravity.set(0, -9.82, 0)
// better for performances
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true

// FRICTION
// so sphere will bounce

const concreteMaterial = new CANNON.Material("concrete")
const plasticMaterial = new CANNON.Material("plastic")

const defaultMaterial = new CANNON.Material("default")

// CONTACT MATERIAL
// contact material is a combination of two materials
// and we can set the friction and restitution between them

const concretePlasticContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.7,
  }
)

// add contact material to the world
// world.addContactMaterial(concretePlasticContactMaterial)

// Simplist way is to set the default contact material to the  world
world.defaultContactMaterial = concretePlasticContactMaterial

// ADD OBJECTS

// // create a body with mass and a position
// const sphereShape = new CANNON.Sphere(0.5)

// const sphereBody = new CANNON.Body({
//   mass: 1,
//   position: new CANNON.Vec3(0, 3, 0),
//   shape: sphereShape,
//   // material: defaultMaterial,
// })

// PUSHING THE SPHERE
// we can apply a force to the sphere
// we can use the applyLocalForce method
// first parameter is the force, second is the position of the force
// sphereBody.applyLocalForce(new CANNON.Vec3(150, 0, 0), new CANNON.Vec3(0, 0, 0))

// world.addBody(sphereBody)

// physics floor

const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body({
  mass: 0,
  shape: floorShape,
  // material: defaultMaterial,
})

// by default plane is on the xz plane, so we need to rotate it
// we have to use quartanions to rotate the plane
// first position is the rotation axis and the second parameter is the angle
// rotater a quarter of a turn
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)

world.addBody(floorBody)

/**
 * Test sphere
 */
// const sphere = new THREE.Mesh(
//   new THREE.SphereGeometry(0.5, 32, 32),
//   new THREE.MeshStandardMaterial({
//     metalness: 0.3,
//     roughness: 0.4,
//     envMap: environmentMapTexture,
//     envMapIntensity: 0.5,
//   })
// )
// sphere.castShadow = true
// sphere.position.y = 0.5
// scene.add(sphere)

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    color: "#777777",
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
    envMapIntensity: 0.5,
  })
)
floor.receiveShadow = true
floor.rotation.x = -Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = -7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = -7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.position.set(-3, 3, 3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// CREATE SPHERES

let spheresToUpdate = []

const sphereGeometry = new THREE.SphereGeometry(1, 20, 20)

const sphereMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.4,
  envMap: environmentMapTexture,
  envMapIntensity: 0.5,
})

const createSphere = (radius, position) => {
  // THREE.js mesh
  const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
  mesh.scale.set(radius, radius, radius)

  mesh.castShadow = true
  mesh.position.copy(position)
  scene.add(mesh)

  // CANNON.js body
  const shape = new CANNON.Sphere(radius)
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 0),
    shape, // shape: shape
    material: defaultMaterial,
  })
  body.position.copy(position)
  body.addEventListener("collide", playHitSound)
  world.addBody(body)

  // Save in array
  spheresToUpdate.push({
    mesh,
    body,
  })
}

let boxesToUpdate = []

const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const boxMaterial = new THREE.MeshStandardMaterial({
  metalness: 1,
  roughness: 0.2,
  envMap: environmentMapTexture,
  envMapIntensity: 0.75,
})

const createBoxes = (size, position) => {
  const mesh = new THREE.Mesh(boxGeometry, boxMaterial)

  mesh.scale.set(size, size, size)
  mesh.castShadow = true
  mesh.position.copy(position)
  scene.add(mesh)

  const shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2))
  const body = new CANNON.Body({
    mass: 2,
    position: new CANNON.Vec3(0, 3, 0),
    shape,
    material: defaultMaterial,
  })
  body.position.copy(position)
  body.addEventListener("collide", playHitSound)
  world.addBody(body)

  boxesToUpdate.push({
    mesh,
    body,
  })
}

createSphere(0.5, { x: 0, y: 3, z: 0 })

/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () => {
  //To get the right delta time, we need to subtract the elapsedTime from the previous frame to the current elapsedTime:

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - oldElapsedTime
  oldElapsedTime = elapsedTime

  // Update physics world
  // 3 parameters: timeStep, maxSubSteps, fixedTimeStep
  // 60fps = 1/60

  world.step(1 / 60, deltaTime, 3)

  // Update spheres
  for (const sphere of spheresToUpdate) {
    sphere.mesh.position.copy(sphere.body.position)
  }
  // Update boxes
  for (const box of boxesToUpdate) {
    box.mesh.position.copy(box.body.position)
    // rotates the box based on the physics
    box.mesh.quaternion.copy(box.body.quaternion)
  }

  // Update sphere
  // sphere.position.copy(sphereBody.position)

  // UPDATE WIND PHYSICS to push sphere back
  // sphereBody.applyForce(new CANNON.Vec3(-0.5, 0, 0), sphereBody.position)

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
