if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

			var radius = 6371;
			var tilt = 0.41;

			var cloudsScale = 1.005;
			var moonScale = 0.23;

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

            document.body.addEventListener('mousemove', function(evt){
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
				scene.fog = new THREE.FogExp2( 0x000000, 0.00000025 );

				camera = new THREE.PerspectiveCamera( 25, SCREEN_WIDTH / SCREEN_HEIGHT, 50, 1e7 );
				camera.position.z = radius * 5;

				scene.add( camera );

				controls = new THREE.SpacheshipControls( camera );


				controls.movementSpeed = 0;
				controls.domElement = container;

				controls.rollSpeed = Math.PI / 24;
                controls.maxSpeed = 700;
                controls.inertia = 150;


				dirLight = new THREE.DirectionalLight( 0xffffff );
				dirLight.position.set( -1, 0, 1 ).normalize();
				scene.add( dirLight );

				ambientLight = new THREE.AmbientLight( 0x000000 );
				scene.add( ambientLight );

				var planetTexture   = THREE.ImageUtils.loadTexture( "textures/planets/earth_atmos_2048.jpg" );
				var cloudsTexture   = THREE.ImageUtils.loadTexture( "textures/planets/earth_clouds_1024.png" );
				var normalTexture   = THREE.ImageUtils.loadTexture( "textures/planets/earth_normal_2048.jpg" );
				var specularTexture = THREE.ImageUtils.loadTexture( "textures/planets/earth_specular_2048.jpg" );

				var moonTexture = THREE.ImageUtils.loadTexture( "textures/planets/moon_1024.jpg" );

				var shader = THREE.ShaderUtils.lib[ "normal" ];
				var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

				uniforms[ "tNormal" ].texture = normalTexture;
				uniforms[ "uNormalScale" ].value = 0.85;

				uniforms[ "tDiffuse" ].texture = planetTexture;
				uniforms[ "tSpecular" ].texture = specularTexture;

				uniforms[ "enableAO" ].value = false;
				uniforms[ "enableDiffuse" ].value = true;
				uniforms[ "enableSpecular" ].value = true;

				uniforms[ "uDiffuseColor" ].value.setHex( 0xffffff );
				uniforms[ "uSpecularColor" ].value.setHex( 0x333333 );
				uniforms[ "uAmbientColor" ].value.setHex( 0x000000 );

				uniforms[ "uShininess" ].value = 15;

				var parameters = {

					fragmentShader: shader.fragmentShader,
					vertexShader: shader.vertexShader,
					uniforms: uniforms,
					lights: true,
					fog: true

				};

				var materialNormalMap = new THREE.ShaderMaterial( parameters );

				// planet

				geometry = new THREE.SphereGeometry( radius, 100, 50 );
				geometry.computeTangents();

				meshPlanet = new THREE.Mesh( geometry, materialNormalMap );
				meshPlanet.rotation.y = 0;
				meshPlanet.rotation.z = tilt;
				scene.add( meshPlanet );

				// clouds

				var materialClouds = new THREE.MeshLambertMaterial( { color: 0xffffff, map: cloudsTexture, transparent: true } );

				meshClouds = new THREE.Mesh( geometry, materialClouds );
				meshClouds.scale.set( cloudsScale, cloudsScale, cloudsScale );
				meshClouds.rotation.z = tilt;
				scene.add( meshClouds );

				// moon

				var materialMoon = new THREE.MeshPhongMaterial( { color: 0xffffff, map: moonTexture } );

				meshMoon = new THREE.Mesh( geometry, materialMoon );
				meshMoon.position.set( radius * 5, 0, 0 );
				meshMoon.scale.set( moonScale, moonScale, moonScale );
				scene.add( meshMoon );

				// stars

				var i, r = radius, starsGeometry = [ new THREE.Geometry(), new THREE.Geometry() ];

				for ( i = 0; i < 250; i ++ ) {

					vector1 = new THREE.Vector3( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
					vector1.multiplyScalar( r );

					starsGeometry[ 0 ].vertices.push( new THREE.Vertex( vector1 ) );

				}

				for ( i = 0; i < 1500; i ++ ) {

					vector1 = new THREE.Vector3( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
					vector1.multiplyScalar( r );

					starsGeometry[ 1 ].vertices.push( new THREE.Vertex( vector1 ) );

				}

				var stars;
				var starsMaterials = [
					new THREE.ParticleBasicMaterial( { color: 0x555555, size: 2, sizeAttenuation: false } ),
					new THREE.ParticleBasicMaterial( { color: 0x555555, size: 1, sizeAttenuation: false } ),
					new THREE.ParticleBasicMaterial( { color: 0x333333, size: 2, sizeAttenuation: false } ),
					new THREE.ParticleBasicMaterial( { color: 0x3a3a3a, size: 1, sizeAttenuation: false } ),
					new THREE.ParticleBasicMaterial( { color: 0x1a1a1a, size: 2, sizeAttenuation: false } ),
					new THREE.ParticleBasicMaterial( { color: 0x1a1a1a, size: 1, sizeAttenuation: false } )
				];

				for ( i = 10; i < 30; i ++ ) {

					stars = new THREE.ParticleSystem( starsGeometry[ i % 2 ], starsMaterials[ i % 6 ] );

					stars.rotation.x = Math.random() * 6;
					stars.rotation.y = Math.random() * 6;
					stars.rotation.z = Math.random() * 6;

					s = i * 10;
					stars.scale.set( s, s, s );

					stars.matrixAutoUpdate = false;
					stars.updateMatrix();

					scene.add( stars );

				}

				renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1 } );
				renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
				renderer.sortObjects = false;

				renderer.autoClear = false;

				container.appendChild( renderer.domElement );

				stats = new Stats();
				stats.domElement.style.position = 'absolute';
				stats.domElement.style.top = '0px';
				stats.domElement.style.zIndex = 100001;
				container.appendChild( stats.domElement );

				window.addEventListener( 'resize', onWindowResize, false );

				// postprocessing

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

				requestAnimationFrame( animate );

				render();
				stats.update();

			};

			function render() {

                var vel, force, forceLimitReached, atmosphereEntered, state;

				// rotate the planet and clouds

				var delta = clock.getDelta();

				meshPlanet.rotation.y += 0.001 * delta;
				meshClouds.rotation.y += 0.005 * delta;

				// slow down as we approach the surface

				dPlanet = camera.position.length();

				dMoonVec.sub( camera.position, meshMoon.position );
				dMoon = dMoonVec.length();

				if ( dMoon < dPlanet ) {

					d = ( dMoon - radius * moonScale * 1.01 );
				} else {

					d = ( dPlanet - radius * 1.01 );
                    if (d < 2000) {
                        controls.breakingForce = 0.5;
                        atmosphereEntered = true;
                    } else {
                        controls.breakingForce = 0;
                        atmosphereEntered = false;
                    }

				}

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

			};