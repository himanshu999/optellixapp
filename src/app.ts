import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, SceneLoader, Material, PointerEventTypes, StandardMaterial, Color3, GizmoManager, Quaternion, Plane, Ray, RayHelper, LinesMesh, TransformNode, Space, FramingBehavior, DistanceBlock } from "@babylonjs/core";


class App {

    constructor() {
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        var scene = new Scene(engine);

        const hotspotAnchors = [];
        const lines = [];
        const planes = [];
        
        const scalingFactor = 1.0;

        const planeWidth = 360;
        const planeHeight = 300; 
        
        var varusValue = 0, flexionValue = 0, distalValue = 10, bonesOpacity = 0.8; //distal value in mm

        var distalMedialLength = 0.0, distalLateralLength = 0.0;

        var resectionPlaneNormal, distalPlaneNormal;

        var femur, tibia;

        var isHotspotsSet = false, listenToPointerEvent = false;

        var currentHotspotAnchorIndex = -1;

        //some materials

        const blueMat = new StandardMaterial('blueMat', scene);
        blueMat.diffuseColor = Color3.FromHexString('#242582');

        const pinkMat = new StandardMaterial('pinkMat', scene);
        pinkMat.diffuseColor = Color3.FromHexString('#f64c72');

        const greenMat = new StandardMaterial('greenMat', scene);
        greenMat.diffuseColor = Color3.FromHexString('#5cdb95');

        const yellowMat = new StandardMaterial('yellowMat', scene);
        yellowMat.diffuseColor = Color3.FromHexString('#d79922');


        //camera and controls set up
        
        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI/2.0, Math.PI/2.0, 0, Vector3.Zero(), scene);
        camera.useFramingBehavior = true;
        camera.framingBehavior.mode = FramingBehavior.IgnoreBoundsSizeMode;
        camera.upperBetaLimit = Math.PI * 2.0;
        camera.upperAlphaLimit = Math.PI * 2.0;


        camera.attachControl(canvas, true);
        
        scene.createDefaultLight();
        scene.createDefaultEnvironment();


        //the main thing

        const updateFunction = () => {

          console.log('ddd'); 

        if(hotspotAnchors.length >= 10){


                //remove any existing lines, planes
            lines.forEach((ln) => {
                scene.removeMesh(ln);
            });

            planes.forEach((pl) => {
                scene.removeMesh(pl);
            });

            
            //create line between 0(Femur Center) and 1(Hip Center)
            let options = {
                points: [hotspotAnchors[0].position, hotspotAnchors[1].position], //vec3 array,
                updatable: true,
              };
              
            const mechanicalAxis = MeshBuilder.CreateLines("mechanicalAxis", options, scene);
            console.log('p1', options.points);
            lines.push(mechanicalAxis);

            
            //creating Anatomical Axis
            options = {
                points: [hotspotAnchors[2].position, hotspotAnchors[3].position], //vec3 array,
                updatable: true,
              };

            const anatomicalAxis = MeshBuilder.CreateLines("anatomicalAxis", options, scene);
            console.log('p2', options.points);
            lines.push(anatomicalAxis);

            
            
            //creating (TEA-Trans epicondyle Axis)
            options = {
                points: [hotspotAnchors[4].position, hotspotAnchors[5].position], //vec3 array,
                updatable: true,
              };

            const TEA = MeshBuilder.CreateLines("TEA", options, scene);
            console.log('p3', options.points);
            lines.push(TEA);

            //creating PCA
            options = {
                points: [hotspotAnchors[8].position, hotspotAnchors[9].position], //vec3 array,
                updatable: true,
              };

            const PCA = MeshBuilder.CreateLines("PCA", options, scene);
            console.log('p4', options.points);
            lines.push(PCA);

            
            //creating plane perpendicular to mechanical axis

            const mechanicalAxisUnitVector : Vector3 = hotspotAnchors[1].position.subtract(hotspotAnchors[0].position).normalize();
            console.log(mechanicalAxisUnitVector);  

            const pp = Plane.FromPositionAndNormal(hotspotAnchors[0].position, mechanicalAxisUnitVector);
            
            const perMAPlane = MeshBuilder.CreatePlane("perMA", {height:planeHeight, width: planeWidth, sideOrientation: Mesh.DOUBLESIDE, sourcePlane: pp});
            perMAPlane.position = hotspotAnchors[0].position;
            perMAPlane.visibility = 0.5;

            planes.push(perMAPlane);

            perMAPlane.material = yellowMat;

            
            
            //calculate projection axis of TEA axis
            let pointOfProjection1, pointOfProjection2;  

            //first we check where the ray originating from one of the anchor points along the direction of the normal of the plane intersects the plane

            let ray1 = new Ray(hotspotAnchors[4].position, mechanicalAxisUnitVector.negate());
        
            let hit = scene.multiPickWithRay(ray1, predicate);

            if (hit.length > 0){
                console.log('hit check', hit);
                pointOfProjection1 = hit[0].pickedPoint;
            }else{
                
                ray1.direction = mechanicalAxisUnitVector;

                hit = scene.multiPickWithRay(ray1, predicate);

                if (hit.length > 0){
                    console.log('hit check', hit);
                    pointOfProjection1 = hit[0].pickedPoint;
                }

            }


            //check the same with the other anchor point

            ray1 = new Ray(hotspotAnchors[5].position, mechanicalAxisUnitVector.negate());
        
            hit = scene.multiPickWithRay(ray1, predicate);

            if (hit.length > 0){
                console.log('hit check', hit);
                pointOfProjection2 = hit[0].pickedPoint;
            }else{
                
                ray1.direction = mechanicalAxisUnitVector;

                hit = scene.multiPickWithRay(ray1, predicate);

                if (hit.length > 0){
                    console.log('hit check', hit);
                    pointOfProjection2 = hit[0].pickedPoint;
                }

            }

            //draw line between both projected points

            options = {
                points: [pointOfProjection1, pointOfProjection2], //vec3 array,
                updatable: true,
              };

            const projectedTEA = MeshBuilder.CreateLines("projectTEA", options, scene);
            console.log('p5', options.points);
            lines.push(projectedTEA);

            const projectedTEAUnitVector : Vector3= pointOfProjection2.subtract(pointOfProjection1).normalize();

            
            //create a vector perpendicular to both projectedTEA and Mechanical Axis (i.e. in the perpendicular plane)

            const anteriorAxis : Vector3 = projectedTEAUnitVector.cross(mechanicalAxisUnitVector);

            //create a point 10mm along the anterior, from femur center
            
            const pt1 = hotspotAnchors[0].position.add(anteriorAxis.normalize().multiplyByFloats(scalingFactor * 10, scalingFactor * 10, scalingFactor * 10));
            
            console.log('pt1', pt1);

            options = {
                points: [hotspotAnchors[0].position, pt1], //vec3 array,
                updatable: true,

              };

            const anteriorAxisLine : LinesMesh = MeshBuilder.CreateLines("anteriorAxisLine", options, scene);
            anteriorAxisLine.color = Color3.Green();
            //anteriorAxisLine.material = greenMat;
            //anteriorAxisLine.scaling.scaleInPlace(10.0);
            console.log('p6', options.points);
            lines.push(anteriorAxisLine);  

            
            //duplicate the perpendicular plane perMA and rotate to create varus plane

            const varusPlane = perMAPlane.clone();
            varusPlane.position = hotspotAnchors[0].position;
            planes.push(varusPlane);
            varusPlane.material = greenMat;
            //const mat2 = varusPlane.material as StandardMaterial;
            //mat2.diffuseColor = Color3.Blue();

            //rotate this plane around anterior axis
            const transformNode1 : TransformNode = varusPlane.rotateAround(hotspotAnchors[0].position, anteriorAxis.normalize(), varusValue);
            

            //creating a line perpendicular to anterior axis and on the varus plane  
            //i.e cross produfct of varus normal and anterior axis

            //to get the normal of varus plane, rotate the normal of perMA plane 

            const perMANormal : Vector3 = mechanicalAxisUnitVector;
            
            const rotationQuaternion = Quaternion.RotationAxis(anteriorAxis.normalize(), varusValue); // Customize the rotation angle as needed

            perMANormal.applyRotationQuaternionInPlace(rotationQuaternion);

            const varusNormal = perMANormal;
            
            
            //now cross the varus normal with anterior axis to get lateral axis
            const lateralAxis = varusNormal.cross(anteriorAxis);

            
            //creating a 10mm long line on the lateral axis from femur center
            const pt2 = hotspotAnchors[0].position.add(lateralAxis.normalize().multiplyByFloats(scalingFactor * 10, scalingFactor * 10, scalingFactor * 10));
            
            console.log('pt2', pt2);

            options = {
                points: [hotspotAnchors[0].position, pt2], //vec3 array,
                updatable: true,

              };

            const lateralAxisLine : LinesMesh = MeshBuilder.CreateLines("anteriorAxisLine", options, scene);  
            lateralAxisLine.color = Color3.Red();  
            console.log('p7', options.points);
            lines.push(lateralAxisLine);

            //duplicate varus plane to start creating flexion plane around the lateral axis
            const flexionPlane = varusPlane.clone();  
            flexionPlane.material = blueMat;
            planes.push(flexionPlane);
            
            
            //make lateral axis the axis of flexion plane
            const transformNode2 : TransformNode = flexionPlane.rotateAround(hotspotAnchors[0].position, lateralAxis.normalize(), flexionValue);  

            
            //clone flexion plane to create distal medial plane
            const distalMedialPlane = flexionPlane.clone();
            planes.push(distalMedialPlane);
            
            //move the position of distal medial plane to pass through Distal Medial Point
            distalMedialPlane.position = hotspotAnchors[6].position;
            
            
            //create a plane parallel to distal median plane, 10mm apart
            const distalResectionPlane = distalMedialPlane.clone();
            planes.push(distalResectionPlane);
            
            //rotate the varus normal to get the distal normal vector
            
            const rotationQuaternion2 = Quaternion.RotationAxis(lateralAxis.normalize(), flexionValue); // Customize the rotation angle as needed

            distalPlaneNormal = Vector3.Zero();

            varusNormal.applyRotationQuaternionToRef(rotationQuaternion2, distalPlaneNormal);

            
            //find a point 10mm apart from distal medial point along the distal plane normal
            
            resectionPlaneNormal = hotspotAnchors[6].position.add(distalPlaneNormal.normalize().multiplyByFloats(scalingFactor * distalValue, scalingFactor * distalValue, scalingFactor * distalValue));

            distalResectionPlane.position = resectionPlaneNormal;

            distalResectionPlane.id = 'drp';
            

            
            


            //project distal medial pt and distal lateral pt on distal resection plane to get the measurements

            //finding distal resection plane normal which should be equal to flexion plane normal

            //flexion plane normal can be calculated by rotating the varus normal vector by the flexion amount around the lateral axis

            const normal1 : Vector3 = varusNormal.clone();
            
            const rotationQuaternion1 = Quaternion.RotationAxis(lateralAxis.normalize(), flexionValue); // Customize the rotation angle as needed

            normal1.applyRotationQuaternionInPlace(rotationQuaternion1);

            const flexionPlaneNormal = normal1;

            
            //project distal medial pt and distal lateral pt on distal resection plane to get the measurements
            
            ray1 = new Ray(hotspotAnchors[6].position, flexionPlaneNormal);
        
            hit = scene.multiPickWithRay(ray1, predicate1);

            let distalMedialResectionPoint, distalLateralResectionPoint;

            if (hit.length > 0){
                distalMedialResectionPoint = hit[0].pickedPoint;
                distalMedialLength = distalMedialResectionPoint.subtract(hotspotAnchors[6].position).length();
                distal_medial_length.innerHTML = distalMedialLength.toFixed(2) + ' mm';

                console.log('point6', distalMedialLength);
            }

            ray1 = new Ray(hotspotAnchors[7].position, flexionPlaneNormal);
        
            hit = scene.multiPickWithRay(ray1, predicate1);

            if (hit.length > 0){
                
                distalLateralResectionPoint = hit[0].pickedPoint;
                
            }else{

                ray1 = new Ray(hotspotAnchors[7].position, flexionPlaneNormal.clone().negate());
        
                hit = scene.multiPickWithRay(ray1, predicate1);

                if(hit.length){

                    distalLateralResectionPoint = hit[0].pickedPoint;

                }


            }

            distalLateralLength = distalLateralResectionPoint.subtract(hotspotAnchors[7].position).length();
            distal_lateral_length.innerHTML = distalLateralLength.toFixed(2) + ' mm';
            console.log('point7', distalLateralLength);

            //now that we have both the distal medial resection point and distal lateral
            //resection points, we draw lines

            options = {
                points: [hotspotAnchors[6].position, distalMedialResectionPoint], //vec3 array,
                updatable: true,
              };

            const distalMedialLine = MeshBuilder.CreateLines("distalMedialLine", options, scene);
            console.log('p8', options.points);
            lines.push(distalMedialLine);

            
            options = {
                points: [hotspotAnchors[7].position, distalLateralResectionPoint], //vec3 array,
                updatable: true,
              };
            
            console.log('p9', options.points);  

            const distalLateralLine = MeshBuilder.CreateLines("distalLateralLine", options, scene);
            
            lines.push(distalLateralLine);
            }
            

            togglePlanes(false);

            
            


        }
        

        SceneLoader.ImportMeshAsync(null, "/models/", "Right_Femur.stl", scene).then((result) =>{
            femur = result.meshes[0];
            
            const mat = femur.material as Material;
            
            femur.visibility = bonesOpacity;

            camera.setTarget(femur);

            document.getElementById('bonesopacity_slider_input').dispatchEvent(new Event('input'));
            
            setTimeout(() => {
                camera.useFramingBehavior = false;
            }, 5000);
            
        });

        /*SceneLoader.ImportMeshAsync(null, "/models/", "Right_Tibia.stl", scene).then((result) =>{
            const root = result.meshes[0];
            
            root.visibility = 0.8;
            
        });*/


         // create gizmo manager
         var gizmoManager = new GizmoManager(scene);
         gizmoManager.positionGizmoEnabled = true;
         gizmoManager.rotationGizmoEnabled = false;
         gizmoManager.scaleGizmoEnabled = false;
         gizmoManager.boundingBoxGizmoEnabled = false;
         gizmoManager.usePointerToAttachGizmos = false;
        
        // attach onClick listener
        const listener = (evt, pickInfo) => {
            if (listenToPointerEvent && evt.type === PointerEventTypes.POINTERTAP) {
                //console.log(evt, pickInfo)
                if(evt.pickInfo.pickedPoint) {
                    
                    if (evt.pickInfo.pickedMesh.id != 'hotspot') {
                        
                        const mesh = hotspotAnchors[currentHotspotAnchorIndex];
                        
                        if(!mesh) 
                            addAnchor(evt.pickInfo.pickedPoint);
                        else
                            gizmoManager.attachToMesh(mesh)
                        
                            listenToPointerEvent = false;
                    }else{
                        //attach gizmo
                        //gizmoManager.attachToMesh(evt.pickInfo.pickedMesh);
                    }

                    
                    
                    
                }else{
                        
                    gizmoManager.attachToMesh(null);
                }

            }
        };
        scene.onPointerObservable.add(listener);

        

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'i') {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });


        function degToRad(degrees)
        {
            return degrees * (Math.PI/180.00);
        }

        function toggleResection(isChecked){
            //distal resection function 
            if(isChecked)
                scene.clipPlane = Plane.FromPositionAndNormal(resectionPlaneNormal, distalPlaneNormal.clone().negate());
            else
                scene.clipPlane = null;                
        }

        function togglePlanes(isChecked){
            planes.forEach((pl) => {
                pl.visibility = isChecked ? 0.5 : 0;
            })
        }

        function setBonesOpacity(opacity){
            femur.visibility = opacity;
        }

       
       
        
        //GUI

        var updateButton = document.getElementById('updateBtn');
        updateButton.onclick = updateFunction;

        //update distal medial and distal lateral lengths
        var distal_medial_length = document.getElementById('distal_medial_length') as HTMLElement;
        var distal_lateral_length = document.getElementById('distal_lateral_length') as HTMLElement;


        //code for handling click on input boxes for hotspot anchors

        var hotspotAnchorInputs = Array.from(document.getElementsByClassName('hotspot_anchor_input'));
        hotspotAnchorInputs.forEach((el) => {
            el.addEventListener('input', handleHotpotAnchors.bind(this))
        });


        const varus_slider_input = document.getElementById('varus_slider_input') as HTMLInputElement;
        varus_slider_input.addEventListener('input', handleSliderValue.bind(this, 'varus'), false);

        const flexion_slider_input = document.getElementById('flexion_slider_input') as HTMLInputElement;
        flexion_slider_input.addEventListener('input', handleSliderValue.bind(this, 'flexion'), false);

        const distal_slider_input = document.getElementById('distal_slider_input') as HTMLInputElement;
        distal_slider_input.addEventListener('input', handleSliderValue.bind(this, 'distal'), false);

        const bonesopacity_slider_input = document.getElementById('bonesopacity_slider_input') as HTMLInputElement;
        bonesopacity_slider_input.addEventListener('input', handleSliderValue.bind(this, 'bonesopacity'), false);
        
        const dmr_toggle = document.getElementById('dmr_toggle') as HTMLInputElement;
        dmr_toggle.addEventListener('input', handleToggle.bind(this, 'dmr'), false);

        const display_planes_toggle = document.getElementById('display_planes_toggle') as HTMLInputElement;
        display_planes_toggle.addEventListener('input', handleToggle.bind(this, 'display_planes'), false);

        const inputEvent = new Event('input');
        varus_slider_input.dispatchEvent(inputEvent);
        flexion_slider_input.dispatchEvent(inputEvent);
        distal_slider_input.dispatchEvent(inputEvent);
        //bonesopacity_slider_input.dispatchEvent(inputEvent);
        dmr_toggle.dispatchEvent(inputEvent);
        display_planes_toggle.dispatchEvent(inputEvent);
        


        function handleHotpotAnchors(evt) {
               
            const target = evt.target;
            const tmp = target.checked;
            
            if(tmp){
                listenToPointerEvent = true;
                
                //reset all to disabled
                hotspotAnchorInputs.forEach((el : HTMLInputElement) => {
                    el.checked = false
                });

                target.checked = tmp;
                currentHotspotAnchorIndex = target.dataset.index;

                const mesh = hotspotAnchors[currentHotspotAnchorIndex];
                        
                if(!mesh){
                    listenToPointerEvent = true;
                    gizmoManager.attachToMesh(null);
                }else
                    gizmoManager.attachToMesh(mesh);

            }else{
                gizmoManager.attachToMesh(null);
            }
            
            

        }


        function handleSliderValue(idPrefix, evt) {
           
            
            const el = evt.target;
            const slider_thumb = document.getElementById(idPrefix + '_slider_thumb') as HTMLDivElement;
            const slider_line = document.getElementById(idPrefix + '_slider_line') as HTMLDivElement;

            
            let slider_value = parseFloat(el.value) - (parseFloat(el.max)/2.00);
            
            if(idPrefix == 'varus'){

                varusValue = degToRad(slider_value);
                updateFunction();

            }else if(idPrefix == 'flexion'){

                flexionValue = degToRad(slider_value);
                updateFunction();

            }else if(idPrefix == 'bonesopacity'){

                slider_value = parseFloat(el.value) / parseFloat(el.max);

                bonesOpacity = slider_value;

                setBonesOpacity(bonesOpacity);
            }else{
                
                slider_value = el.value;

                distalValue = slider_value;

                updateFunction();
                
            }
            
            slider_thumb.innerHTML = slider_value.toString();

            const bulletPosition = (parseFloat(el.value) / parseFloat(el.max));
            const space = el.offsetWidth - slider_thumb.offsetWidth;

            slider_thumb.style.left = (bulletPosition * space) + 'px';
            slider_line.style.width = '0' + '%';

            


        }

        function handleToggle(idPrefix, evt){

            const el = evt.target;

            if(idPrefix == 'dmr'){
                toggleResection(el.checked);
            }else{
                togglePlanes(el.checked);
            }
            
            


        }

        
        
        

    
    
        function addAnchor(pickedPoint){
            //const anchorPlane = MeshBuilder.CreatePlane("plane", {height:10, width: 10, sideOrientation: Mesh.DOUBLESIDE});
            const anchorMesh = MeshBuilder.CreateSphere('hotspot', {diameter : 2}, scene );
            
            anchorMesh.position = pickedPoint;
    

           // let matt: StandardMaterial = new StandardMaterial('anchorMat',scene);
           // matt.diffuseColor = Color3.FromHexString('#FF0000');

            anchorMesh.material = pinkMat;
            //anchorPlane.billboardMode = 7;
            
            hotspotAnchors[currentHotspotAnchorIndex] = anchorMesh;

            gizmoManager.attachToMesh(anchorMesh);
            
            
        }

        function predicate(mesh) {
            if (mesh.id == 'perMA') {
                return true;
            }
            return false;
        }

        function predicate1(mesh) {
            if (mesh.id == 'drp') {
                return true;
            }
            return false;
        }
    
    
    }


    
}
new App();