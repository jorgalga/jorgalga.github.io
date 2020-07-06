import * as THREE from 'three'
import {TweenLite} from 'gsap'
export class ThreeChroma {
  constructor (container, renderer, camera, scene, controls) {
    this.container = container
    this.renderer = renderer
    this.camera = camera
    this.scene = scene
    this.controls = controls
  }
  init () {
    this.images = [
      {file: '/static/chroma/slider-0.png'},
      {file: '/static/chroma/slider-1.png'},
      {file: '/static/chroma/slider-2.png'},
      {file: '/static/chroma/slider-3.png'},
      {file: '/static/chroma/slider-4.png'}
    ]
    this.pointsArray = []
    this.material = undefined
    this.points = null
    this.hslA = new THREE.Color('hsl(0, 100%, 50%)')
    this.hslB = new THREE.Color('hsl(0, 100%, 50%)')
    this.currentId = 0
    this.current = 0
    this.blendValue = 0
    this.sliderTime = 5
    this.initScene()
    this.animate()
    this.addMousemoveTransform()
    this.initGradient()
  }
  loadImage (filename, c) {
    var img = new Image()
    img.addEventListener('load', function (e) {
      c(this)
    })
    img.src = filename
  }
  initScene () {
    var _ = this
    this.images.forEach(function (i, id) {
      _.loadImage(i.file, function (img) {
        i.image = img
        i.texture = new THREE.Texture(img)
        i.texture.flipY = false
        i.texture.needsUpdate = true
        var copy = new Image()
        copy.src = i.file
        copy.addEventListener('click', function (e) {
          _.selectImage(id)
        })
        document.getElementById('selector').appendChild(copy)
        _.sortPixels(img, function (res) {
          i.buffer = res
          i.loaded = true
          _.generateMesh()
        })
      })
    })
  }
  sortPixels (img, callback) {
    var _ = this
    var canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    var ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    var buffer = data.data
    var rgb = []
    var c = new THREE.Color()
    for (var j = 0; j < buffer.length; j += 4) {
      c.setRGB(buffer[ j ], buffer[ j + 1 ], buffer[ j + 2 ])
      rgb.push({ c: c.clone(), id: j / 4 })
    }
    rgb.sort(function (a, b) {
      a.c.getHSL(_.hslA)
      b.c.getHSL(_.hslB)
      return _.hslA.s - _.hslB.s
    })
    var ptr = 0
    var res = new Float32Array(img.width * img.height * 2)
    rgb.forEach(function (e) {
      res[ ptr ] = e.id % img.width
      res[ ptr + 1 ] = Math.floor(e.id / img.width)
      ptr += 2
    })
    callback(res)
  }
  generateMesh () {
    var _ = this
    if (_.images.some(function (i) { return i.loaded !== true })) { return }
    var w = _.images[0].image.width
    var h = _.images[0].image.height
    var ptr = 0
    var positions = new Float32Array(w * h * 3)

    for (var y = 0; y < w; y++) {
      for (var x = 0; x < h; x++) {
        positions[ ptr * 3 + 0 ] = x
        positions[ ptr * 3 + 1 ] = y
        positions[ ptr * 3 + 2 ] = 0
        ptr++
      }
    }
    var geometry = new THREE.BufferGeometry()
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.addAttribute('source', new THREE.BufferAttribute(_.images[0].buffer, 2))
    geometry.addAttribute('target', new THREE.BufferAttribute(_.images[1].buffer, 2))
    // var loader = new THREE.TextureLoader()
    _.material = new THREE.RawShaderMaterial({
      uniforms: {
        sourceTex: { type: 't', value: _.images[0].texture },
        targetTex: { type: 't', value: _.images[1].texture },
        blend: { type: 'f', value: 0 },
        size: { type: 'f', value: 2.1 }, // window.devicePixelRatio },
        dimensions: { type: 'v2', value: new THREE.Vector2(w, h) }
      },
      vertexShader: document.getElementById('particle-vs').textContent,
      fragmentShader: document.getElementById('particle-fs').textContent
    })
    _.points = new THREE.Points(geometry, _.material)
    _.points.position.set(0, _.controls.userHeight, -1.25)
    _.pointsArray.push(_.points)
    _.scene.add(_.points)
    _.renderer.render(_.scene, _.camera)
  }
  selectImage (id) {
    if (this.currentId === id) return
    this.currentId = id
    if (this.current === 1) {
      this.changeSource(id)
    } else {
      this.changeTarget(id)
    }
    this.current = 1 - this.current
  }
  changeSource (id) {
    this.material.uniforms.sourceTex.value = this.images[ id ].texture
    this.points.geometry.attributes.source.array = this.images[ id ].buffer
    this.points.geometry.attributes.source.needsUpdate = true
  }
  changeTarget (id) {
    this.material.uniforms.targetTex.value = this.images[ id ].texture
    this.points.geometry.attributes.target.array = this.images[ id ].buffer
    this.points.geometry.attributes.target.needsUpdate = true
  }
  ease (t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }
  animate () {
    var _ = this
    requestAnimationFrame(function () {
      _.animate()
    })
    if (this.material) {
      var dir = this.current - this.blendValue
      this.blendValue += dir / 100
      this.material.uniforms.blend.value = this.ease(this.blendValue)
    }
  }
  addMousemoveTransform () {
    var _ = this
    _.container.addEventListener('mousemove', mousemoveHandler)
    function mousemoveHandler (e) {
      var cx = (e.clientX / _.container.clientWidth) * 2 - 1
      var cy = (e.clientY / _.container.clientHeight) * 2 - 1
      for (var i = 0; i < _.pointsArray.length; i++) {
        var val1 = (Math.PI / 2) * 0.2 * cx
        var val2 = (Math.PI / 2) * 0.1 * cy
        TweenLite.to(_.pointsArray[i].rotation, 1, {
          y: val1
        })
        TweenLite.to(_.pointsArray[i].rotation, 1, {
          x: val2
        })
      }
    }
  }
  initGradient () {
    var _ = this
    TweenLite.to(document.getElementById('progress-bar'), _.sliderTime, {
      scaleX: 1,
      delay: 1,
      onComplete: function () {
        _.selectImage((_.currentId + 1) % _.images.length)
        TweenLite.to(document.getElementById('progress-bar'), 1, {
          scaleX: 0,
          onComplete: function () {
            _.initGradient()
          }
        })
      }
    })
  }
}
