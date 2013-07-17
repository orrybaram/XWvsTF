
var MARGIN = 0;
var SCREEN_HEIGHT = window.innerHeight - MARGIN * 2;
var SCREEN_WIDTH  = window.innerWidth;

var container, stats;
var camera, controls, scene, sceneCube, renderer;
var geometry, meshPlanet, meshClouds, meshMoon;
var dirLight, pointLight, ambientLight;

var d, dPlanet, dMoon, dMoonVec = new THREE.Vector3();

var clock = new THREE.Clock();

var cockpit = new Cockpit('img/XW_cockpit.png');
var cockpitState = 'normal';

cockpit.addText('hud-speed', 'SPD:');
cockpit.addText('hud-thrust', 'PWR:');
cockpit.addText('hud-force', 'F:');

document.body.addEventListener('mousemove', function( evt ){
    var vert = ( SCREEN_HEIGHT / 2 - evt.clientY ) / ( SCREEN_HEIGHT / 2 ) * -0.8;
    var hor = ( SCREEN_WIDTH / 2 - evt.clientX ) / ( SCREEN_WIDTH / 2 ) * 0.8;
    cockpit.move(hor, vert);
});

init();
animate();

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	scene = new THREE.Scene();
	// scene.fog = new THREE.FogExp2( 0x000000, 0.00000025 );

	// Camera
	// =============================================
	
	camera = new THREE.PerspectiveCamera( 25, SCREEN_WIDTH / SCREEN_HEIGHT, 50, 1000 );

	scene.add( camera );

	// Spaceship Controls
	// =============================================
	controls = new THREE.SpaceshipControls( camera );
	
	controls.movementSpeed = 0;
	controls.domElement = container;

	controls.rollSpeed = Math.PI / 24;
    controls.maxSpeed = 700;
    controls.inertia = 150;

 	// // Lights
	// // =============================================

	// dirLight = new THREE.DirectionalLight( 0xffffff );
	// dirLight.position.set( -1, 0, 1 ).normalize();
	// scene.add( dirLight );

	// ambientLight = new THREE.AmbientLight( 0x000000 );
	// scene.add( ambientLight );

	

	// Death Star
	// =============================================

	// var deathStar;
	// colladaLoader.load('models/death-star.dae', function (result) {
	// 	deathStar = result.scene;
	// 	scene.add(deathStar);
	// 	setMaterial(deathStar, new THREE.MeshLambertMaterial({ color: 0xCCCCCC }));

	// 	// Once the death star is loaded in, start animations
		
			
	// });

	// Stars
	// =============================================

	// var i, r = radius, starsGeometry = [ new THREE.Geometry(), new THREE.Geometry() ];

	// for ( i = 0; i < 250; i ++ ) {

	// 	vector1 = new THREE.Vector3( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
	// 	vector1.multiplyScalar( r );

	// 	starsGeometry[ 0 ].vertices.push( new THREE.Vector3( vector1 ) );

	// }

	// for ( i = 0; i < 1500; i ++ ) {

	// 	vector1 = new THREE.Vector3( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
	// 	vector1.multiplyScalar( r );

	// 	starsGeometry[ 1 ].vertices.push( new THREE.Vector3( vector1 ) );

	// }

	// var stars;
	// var starsMaterials = [
	// 	new THREE.ParticleBasicMaterial( { color: 0x555555, size: 2, sizeAttenuation: false } ),
	// 	new THREE.ParticleBasicMaterial( { color: 0x555555, size: 1, sizeAttenuation: false } ),
	// 	new THREE.ParticleBasicMaterial( { color: 0x333333, size: 2, sizeAttenuation: false } ),
	// 	new THREE.ParticleBasicMaterial( { color: 0x3a3a3a, size: 1, sizeAttenuation: false } ),
	// 	new THREE.ParticleBasicMaterial( { color: 0x1a1a1a, size: 2, sizeAttenuation: false } ),
	// 	new THREE.ParticleBasicMaterial( { color: 0x1a1a1a, size: 1, sizeAttenuation: false } )
	// ];

	// for ( i = 10; i < 30; i ++ ) {

	// 	stars = new THREE.ParticleSystem( starsGeometry[ i % 2 ], starsMaterials[ i % 6 ] );

	// 	stars.rotation.x = Math.random() * 6;
	// 	stars.rotation.y = Math.random() * 6;
	// 	stars.rotation.z = Math.random() * 6;

	// 	s = i * 10;
	// 	stars.scale.set( s, s, s );

	// 	stars.matrixAutoUpdate = false;
	// 	stars.updateMatrix();

	// 	scene.add( stars );

	// }

	// Renderer
	// =============================================

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor("0x000000");
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.sortObjects = false;

	renderer.autoClear = false;

	container.appendChild( renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );

	// Postprocessing
	// =============================================

	var renderModel = new THREE.RenderPass( scene, camera );
	var effectFilm = new THREE.FilmPass( 0.35, 0.75, 2048, false );
	effectFilm.renderToScreen = true;

	composer = new THREE.EffectComposer( renderer );

	composer.addPass( renderModel );
	composer.addPass( effectFilm );

};

function onWindowResize( event ) {

	SCREEN_HEIGHT = window.innerHeight;
	SCREEN_WIDTH  = window.innerWidth;

	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

	camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
	camera.updateProjectionMatrix();

	composer.reset();

    controls.onContainerDimensionsChanged();

};

function animate() {
	requestAnimFrame( animate );
	render();
};

function render() {

    var vel, force, forceLimitReached, atmosphereEntered, state;


	var delta = clock.getDelta();

    vel = Math.max(0, controls.velocity - controls.breakingForce);
    force = ( vel - controls.movementSpeed ) * 10;
    forceLimitReached = Math.abs(force) > 3.75;

    document.documentElement.classList[forceLimitReached ? 'add' : 'remove']('force-warning');

    if( forceLimitReached || atmosphereEntered ){
        state = 'vibrate';
    }
    if( forceLimitReached && atmosphereEntered ){
        state = 'shake';
    }
    if( !forceLimitReached && !atmosphereEntered ){
        state = 'normal';
    }
    if(state !== cockpitState){
        cockpit.setState(state);
        cockpitState = state;
    }

	controls.update( delta );

	renderer.clear();
	composer.render( delta );

    cockpit.updateText('hud-speed', 'SPD: ' + Math.floor(controls.movementSpeed * controls.maxSpeed));
    cockpit.updateText('hud-thrust', 'PWR: ' + Math.floor(controls.velocity * 100) + '%');
    cockpit.updateText('hud-force', 'G: ' + force.toFixed(2) );

    renderer.render();

};