 // oo__          _      _          __oo   
 //      """--,,,_(_)_--_(_)_,,,--"""
 //              _>_[____]_<_
 //      ___--""" (_)\__/(_) """--___       
 //  oo""                            ""oo   


var MARGIN = 0;
var SCREEN_HEIGHT = window.innerHeight - MARGIN * 2;
var SCREEN_WIDTH  = window.innerWidth;

var container, stats;
var camera, controls, scene, sceneCube, renderer;
var dirLight, pointLight, ambientLight;

var deathStar;

var clock = new THREE.Clock();

var cockpit, cockpitState;


document.body.addEventListener('mousemove', function( evt ){
    var vert = ( SCREEN_HEIGHT / 2 - evt.clientY ) / ( SCREEN_HEIGHT / 2 ) * -0.8;
    var hor = ( SCREEN_WIDTH / 2 - evt.clientX ) / ( SCREEN_WIDTH / 2 ) * 0.8;
    cockpit.move(hor, vert);
});

// LOAD UP THE DEATH STAR AND THEN INIT
colladaLoader.load('models/death-star.dae', function (result) {
	deathStar = result.scene;
	init();
	animate();
});

function init() {
	var $screen = $('#screen');

	scene = new THREE.Scene();
	// scene.fog = new THREE.FogExp2( 0x000000, 0.00000025 );

	// Camera
	// =============================================
	
	camera = new THREE.PerspectiveCamera( 25, SCREEN_WIDTH / SCREEN_HEIGHT, 50, 100000 );

	camera.position.set(50000, 5, -135);

	// TODO: learn this
	camera.quaternion.x = 0.07;
	camera.quaternion.y = 0.78;
	camera.quaternion.z = 0.0002;
	camera.quaternion.w = 0.6;

	scene.add( camera );

	// Spaceship Controls
	// =============================================
	controls = new THREE.SpaceshipControls( camera );
	
	controls.movementSpeed = 0;
	controls.domElement = $screen;

	controls.rollSpeed = Math.PI / 24;
 	controls.maxSpeed = 700;
 	controls.inertia = 150;

 	// // Lights
	// // =============================================

	// create a point light
	light = new THREE.DirectionalLight( 0xFFFFFF );
	light.position.set( 0, 500, -1700 );
	light.target.position.set(100,-10,-100)

	light.intensity = 1;
	//scene.add( new THREE.DirectionalLightHelper(light, 2.5) );
	light.castShadow = true;
	scene.add(light)

	light2 = light = new THREE.DirectionalLight( 0xFFFFFF );
	light2.position.set( 150, 30, 600 );
	light2.target.position.set(0,0,0)
	light2.intensity = 1;
	scene.add(light2)


	// Death Star
	// =============================================

	deathStar.scale.set(13,13,13);
	deathStar.position.x = -90000;
	scene.add(deathStar);
	setMaterial(deathStar, new THREE.MeshLambertMaterial({ color: 0xCCCCCC }));

		
	// Stars
	// =============================================
	
	// TODO

	
	// Cockpit
	// =============================================	
	cockpit = new Cockpit('img/XW_cockpit.png');
	cockpitState = 'normal';

	cockpit.addText('hud-speed', 'SPD:');
	cockpit.addText('hud-thrust', 'PWR:');
	cockpit.addText('hud-force', 'F:');

	// Renderer
	// =============================================

	renderer = new THREE.WebGLRenderer()
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

	$screen.append( renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );


};

function onWindowResize( event ) {

	SCREEN_HEIGHT = window.innerHeight;
	SCREEN_WIDTH  = window.innerWidth;

	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

	camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
	camera.updateProjectionMatrix();

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

	cockpit.updateText('hud-speed', 'SPD: ' + Math.floor(controls.movementSpeed * controls.maxSpeed));
    cockpit.updateText('hud-thrust', 'PWR: ' + Math.floor(controls.velocity * 100) + '%');
    cockpit.updateText('hud-force', 'G: ' + force.toFixed(2) );

    renderer.render(scene, camera);

};