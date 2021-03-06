//Bad TV Shader Demo
//Using Three.js r.75
//by Felix Turner / www.airtight.cc / @felixturner

var camera, scene, renderer;
var video, videoTexture, videoMaterial;
var composer;
var shaderTime = 0;
var badTVParams, badTVPass;
var staticParams, staticPass;
var rgbParams, rgbPass;
var filmParams, filmPass;
var renderPass, copyPass;
var gui;
var pnoise, globalParams;


ready(function() {
    init();
    animate();
});

function ready(callbackFunc) {
    if (document.readyState !== 'loading') {
        // Document is already ready, call the callback directly
        callbackFunc();
    } else if (document.addEventListener) {
        // All modern browsers to register DOMContentLoaded
        document.addEventListener('DOMContentLoaded', callbackFunc);
    } else {
        // Old IE browsers
        document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'complete') {
            callbackFunc();
        }
        });
    }
}
function init() {

    //Load Video
    video = document.createElement('video');
    video.loop = true;
    video.muted = true;
    video.src =  'http://' + window.location.host + '/static/video/introhome.mp4';
    console.log(video.src);
    video.play();

    //init video texture
    videoTexture = new THREE.Texture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoMaterial = new THREE.MeshBasicMaterial({
        map: videoTexture
    });

    //init camera
    camera = new THREE.PerspectiveCamera(55, 1280 / 720, 20, 3000);
    camera.position.z = 1000;
    scene = new THREE.Scene();

    //Add video plane
    var planeGeometry = new THREE.PlaneGeometry(1080, 620, 1, 1);
    var plane = new THREE.Mesh(planeGeometry, videoMaterial);
    scene.add(plane);
    plane.z = 0;
    plane.scale.x = plane.scale.y = 1.88;

    //add stats
    /*
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.getElementById("webxr-world").appendChild(stats.domElement);
    */

    //init renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(1280, 720);
    document.getElementById("webxr-world").appendChild(renderer.domElement);

    //POST PROCESSING
    //Create Shader Passes
    renderPass = new THREE.RenderPass(scene, camera);
    badTVPass = new THREE.ShaderPass(THREE.BadTVShader);
    rgbPass = new THREE.ShaderPass(THREE.RGBShiftShader);
    filmPass = new THREE.ShaderPass(THREE.FilmShader);
    staticPass = new THREE.ShaderPass(THREE.StaticShader);
    copyPass = new THREE.ShaderPass(THREE.CopyShader);

    //set shader uniforms
    filmPass.uniforms.grayscale.value = 0;

    //Init DAT GUI control panel
    badTVParams = {
        mute: true,
        show: true,
        distortion: 0.5,
        distortion2: 1.0,
        speed: 0.3,
        rollSpeed: 0.0
    };

    staticParams = {
        show: true,
        amount: 0.1,
        size: 1.0
    };

    rgbParams = {
        show: true,
        amount: 0.005,
        angle: 0.0,
    };

    filmParams = {
        show: true,
        count: 2000,
        sIntensity: 0.9,
        nIntensity: 0.4
    };

    gui = new dat.GUI();

    gui.add(badTVParams, 'mute').onChange(onToggleMute);

    var f1 = gui.addFolder('Bad TV');
    f1.add(badTVParams, 'show').onChange(onToggleShaders);
    f1.add(badTVParams, 'distortion', 0.1, 20).step(0.1).listen().name('Thick Distort').onChange(onParamsChange);
    f1.add(badTVParams, 'distortion2', 0.1, 20).step(0.1).listen().name('Fine Distort').onChange(onParamsChange);
    f1.add(badTVParams, 'speed', 0.0, 1.0).step(0.01).listen().name('Distort Speed').onChange(onParamsChange);
    f1.add(badTVParams, 'rollSpeed', 0.0, 1.0).step(0.01).listen().name('Roll Speed').onChange(onParamsChange);
    f1.open();

    var f2 = gui.addFolder('RGB Shift');
    f2.add(rgbParams, 'show').onChange(onToggleShaders);
    f2.add(rgbParams, 'amount', 0.0, 0.1).listen().onChange(onParamsChange);
    f2.add(rgbParams, 'angle', 0.0, 2.0).listen().onChange(onParamsChange);
    f2.open();

    var f4 = gui.addFolder('Static');
    f4.add(staticParams, 'show').onChange(onToggleShaders);
    f4.add(staticParams, 'amount', 0.0, 1.0).step(0.01).listen().onChange(onParamsChange);
    f4.add(staticParams, 'size', 1.0, 100.0).step(1.0).onChange(onParamsChange);
    f4.open();

    var f3 = gui.addFolder('Scanlines');
    f3.add(filmParams, 'show').onChange(onToggleShaders);
    f3.add(filmParams, 'count', 50, 1000).onChange(onParamsChange);
    f3.add(filmParams, 'sIntensity', 0.0, 2.0).step(0.1).onChange(onParamsChange);
    f3.add(filmParams, 'nIntensity', 0.0, 2.0).step(0.1).onChange(onParamsChange);
    f3.open();

    gui.close();

    onToggleShaders();
    onToggleMute();
    onParamsChange();

    window.addEventListener('resize', onResize, false);
    // renderer.domElement.addEventListener('click', customParams, false);
    onResize();
    // customParams();
}

function onParamsChange() {

    //copy gui params into shader uniforms
    badTVPass.uniforms['distortion'].value = badTVParams.distortion;
    badTVPass.uniforms['distortion2'].value = badTVParams.distortion2;
    badTVPass.uniforms['speed'].value = badTVParams.speed;
    badTVPass.uniforms['rollSpeed'].value = badTVParams.rollSpeed;

    staticPass.uniforms['amount'].value = staticParams.amount;
    staticPass.uniforms['size'].value = staticParams.size;

    rgbPass.uniforms['angle'].value = rgbParams.angle * Math.PI;
    rgbPass.uniforms['amount'].value = rgbParams.amount;

    filmPass.uniforms['sCount'].value = filmParams.count;
    filmPass.uniforms['sIntensity'].value = filmParams.sIntensity;
    filmPass.uniforms['nIntensity'].value = filmParams.nIntensity;
}



function randomizeParams() {

    badTVParams.distortion = Math.random() * 6;
    badTVParams.distortion2 = Math.random() * 6;
    badTVParams.speed = Math.random() * 0.4;
    badTVParams.rollSpeed = Math.random() * 0.2;
    rgbParams.angle = Math.random() * 2;
    rgbParams.amount = Math.random() * 0.02;
    staticParams.amount = Math.random() * 0.2;

    onParamsChange();
}

function onToggleMute() {
    video.muted = badTVParams.mute;
}

function onToggleShaders() {

    //Add Shader Passes to Composer
    //order is important 
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderPass);

    if (filmParams.show) {
        composer.addPass(filmPass);
    }

    if (badTVParams.show) {
        composer.addPass(badTVPass);
    }

    if (rgbParams.show) {
        composer.addPass(rgbPass);
    }

    if (staticParams.show) {
        composer.addPass(staticPass);
    }

    composer.addPass(copyPass);
    copyPass.renderToScreen = true;
}

function animate() {

    shaderTime += 0.1;
    badTVPass.uniforms['time'].value = shaderTime;
    filmPass.uniforms['time'].value = shaderTime;
    staticPass.uniforms['time'].value = shaderTime;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (videoTexture) videoTexture.needsUpdate = true;
    }

    requestAnimationFrame(animate);
    composer.render(0.1);
    // stats.update();
}

function onResize() {
    renderer.setSize(window.innerWidth - 17 , window.innerHeight);
    camera.aspect = (window.innerWidth - 17) / window.innerHeight;
    camera.updateProjectionMatrix();
}