import * as THREE from 'three'
export class ThreeDTour {
  constructor (container, renderer, camera, scene, controls) {
    this.container = container
    this.renderer = renderer
    this.camera = camera
    this.scene = scene
    this.controls = controls
  }
  init () {
    this.boxSize = 9
    this.addSkybox()
    /*
    var _ = this
    var loader = new THREE.TextureLoader()
    // load a resource
    loader.load(
      // resource URL
      '/static/paris.jpg', function (texture) {
        console.log('loaded')
        var geometry = new THREE.SphereGeometry(5, 32, 32)
        var material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide,
          needsUpdate: true
        })
        var mesh = new THREE.Mesh(geometry, material)
        _.scene.add(mesh)
        console.log(_.scene)
      }
    )
    */
  }
  addSkybox () {
    var loader = new THREE.TextureLoader()
    loader.load('/static/box1.png', onTextureLoaded)
    var _ = this
    function onTextureLoaded (texture) {
      console.log('loaded I')

      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.needsUpdate = true
      console.log(_.boxSize)
      texture.repeat.set(_.boxSize, _.boxSize)
      var geometry = new THREE.BoxGeometry(_.boxSize, _.boxSize, _.boxSize)
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xcc88aa,
        side: THREE.BackSide
      })
      // Align the skybox to the floor (which is at y=0).
      _.skybox = new THREE.Mesh(geometry, material)
      _.skybox.position.y = _.boxSize / 2
      _.scene.add(_.skybox)
      console.log(_.scene)
      // For high end VR devices like Vive and Oculus, take into account the stage
      // parameters provided.
    }
  }
  animate () {
    var _ = this
    requestAnimationFrame(function () {
      _.animate()
    })
  }
}
