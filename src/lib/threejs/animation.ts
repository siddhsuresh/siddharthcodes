import gsap from "gsap";
//@ts-expect-error - no types
import * as THREE from "three";
//@ts-expect-error - no types
import Typewriter from "typewriter-effect/dist/core";

// Inspired and modified code from: https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/

const Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x609dc8,
};

let sky: Sky;
let sea: Sea;

let hemisphereLight: THREE.HemisphereLight;
let shadowLight: THREE.DirectionalLight;
let ambientLight: THREE.AmbientLight;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let HEIGHT: number;
let WIDTH: number;
let aspectRatio: number;
let fieldOfView: number;
let nearPlane: number;
let farPlane: number;
let container: HTMLElement | null;
let renderer: THREE.WebGLRenderer;

const logos = [
  {
    name: "github",
    url: "/github.png",
    display: "View My Github Profile",
    href: "https://github.com/siddhsuresh",
  },
  {
    name: "Codepen",
    url: "/codepen.png",
    display: "View My Codepen Profile",
    href: "https://codepen.io/siddhsuresh",
  },
  {
    name: "LinkedIn",
    url: "/linkedIn.png",
    display: "View My LinkedIn Profile",
    href: "https://www.linkedin.com/in/siddhsuresh/",
  },
  {
    name: "Twitter",
    url: "/twitter.png",
    display: "View My Twitter Profile",
    href: "https://twitter.com/siddsuresh",
  },
  {
    name: "Discord",
    url: "/discord.png",
    display: "View My Discord Profile",
    href: "https://discord.com/users/705404746006870282",
  },
];

let z = 0;
class Cloud {
  mesh: THREE.Object3D;
  constructor() {
    this.mesh = new THREE.Object3D();
    this.mesh.userData.name = "cloud";
    const texture = new THREE.TextureLoader().load("/logos" + logos[z]?.url);
    this.mesh.userData.logo = `${logos[z]?.name}`;
    this.mesh.userData.display = `${logos[z]?.display}`;
    this.mesh.userData.href = `${logos[z]?.href}`;
    if (z < logos.length - 1) {
      z++;
    } else {
      z = 0;
    }
    const cloud = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      })
    );
    cloud.position.y = Math.random() * 10;
    cloud.position.z = -5 + Math.random() * 5;
    cloud.rotation.z = -Math.PI;
    cloud.castShadow = true;
    cloud.receiveShadow = true;
    this.mesh.add(cloud);
  }
}

class Sky {
  mesh: THREE.Object3D;
  nClouds: number;
  constructor() {
    this.mesh = new THREE.Object3D();
    this.nClouds = 20;
    const stepAngle = (Math.PI * 2) / this.nClouds;
    setTimeout(() => {
      for (let i = 0; i < this.nClouds; i++) {
        const c = new Cloud();
        const a = stepAngle * i;
        const h = 750 + Math.random() * 200;
        const s = 1 + Math.random() * 2;
        c.mesh.position.y = Math.sin(a) * h;
        c.mesh.position.x = Math.cos(a) * h;
        c.mesh.position.z = -400 - Math.random() * 300;
        c.mesh.rotation.z = a + Math.PI / 2;
        c.mesh.scale.set(s, s, s);
        this.mesh.add(c.mesh);
      }
    }, 2000);
  }
}

class Sea {
  mesh: THREE.Object3D;
  waves: any[];
  constructor() {
    const geom = new THREE.SphereGeometry(1000, 50, 150);
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    geom.mergeVertices();

    const l = geom.vertices.length;
    this.waves = [];

    for (let i = 0; i < l; i++) {
      const v = geom.vertices[i];
      this.waves.push({
        x: v.x,
        y: v.y,
        z: v.z,
        ang: Math.random() * Math.PI * Math.random() * 2,
        amp: 5 + Math.random() * 15,
        speed: 0.016 + Math.random() * 0.032,
      });
    }

    const mat = new THREE.MeshLambertMaterial({
      color: Colors.blue,
      shading: THREE.FlatShading,
      transparent: true,
      opacity: 0.5,
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
  }
  moveWaves() {
    const verts = this.mesh.geometry.vertices;
    const l = verts.length;

    for (let i = 0; i < l; i++) {
      const v = verts[i];
      const vprops = this.waves[i];

      v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
      v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;

      vprops.ang += vprops.speed;
    }

    this.mesh.geometry.verticesNeedUpdate = true;
    sea.mesh.rotation.z += 0.005;
  }
}

function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -600;
  sky.mesh.position.z = 400;
  scene.add(sky.mesh);
}

function createSea() {
  sea = new Sea();
  sea.mesh.position.y = -700;
  sea.mesh.position.z = -300;
  scene.add(sea.mesh);
}

function createLights() {
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);

  ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);

  shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);

  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;

  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;

  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  scene.add(hemisphereLight);
  scene.add(ambientLight);
  scene.add(shadowLight);
}

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function createScene() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc9c9b0, 100, 950);

  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 65;
  nearPlane = 0.1;
  farPlane = 10000;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.x = 0;
  camera.position.y = 100;
  camera.position.z = 170;

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;

  container = document.getElementById("world");
  container?.appendChild(renderer.domElement);

  window.addEventListener("resize", handleWindowResize, false);
}

function loop() {
  sea.moveWaves();
  sky.mesh.rotation.z += 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

const previousIntersect: string | any[] = [];

const tooltip = document.getElementById("tooltip") as HTMLElement;

window.addEventListener("mousemove", (e) => {
  document.body.style.cursor = "default";
  tooltip.style.display = "none";
  const mousePos = {
    x: (e.clientX / window.innerWidth) * 2 - 1,
    y: -(e.clientY / window.innerHeight) * 2 + 1,
  };
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mousePos, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  intersects.forEach((obj: any) => {
    if (obj.object.parent.userData.name === "cloud") {
      if (previousIntersect.length > 0) {
        previousIntersect[0].object.scale.set(1, 1, 1);
      }
      obj.object.scale.set(1.5, 1.5, 1.5);
      document.body.style.cursor = "pointer";
      previousIntersect[0] = obj;
      tooltip.style.display = "block";
      tooltip.style.left = e.pageX + 20 + "px";
      tooltip.style.top = e.pageY + 20 + "px";
      tooltip.innerHTML = obj.object.parent.userData.display;
    }
  });
});

window.addEventListener("click", (e) => {
  const mousePos = {
    x: (e.clientX / window.innerWidth) * 2 - 1,
    y: -(e.clientY / window.innerHeight) * 2 + 1,
  };
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mousePos, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  intersects.forEach((obj: any) => {
    if (obj.object.parent.userData.name === "cloud") {
      window.open(obj.object.parent.userData.href, "_blank");
    }
  });
});

function isInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

document.addEventListener(
  "scroll",
  () => {
    if (window.scrollY === 0) {
      gsap.to(sea.mesh.scale, {
        x: 0.7,
        y: 0.7,
        z: 0.7,
        duration: 5,
        ease: "elastic.out(1, 0.3)",
      });
    } else {
      if (
        isInViewport(document.getElementById("viewProjects") as HTMLElement) ||
        isInViewport(document.getElementById("aboutMe") as HTMLElement)
      ) {
        gsap.to(sea.mesh.scale, {
          x: 2,
          y: 2,
          z: 2,
          duration: 5,
          ease: "elastic.out(1, 0.3)",
        });
      } else if (
        isInViewport(document.getElementById("world") as HTMLElement)
      ) {
        gsap.to(sea.mesh.scale, {
          x: 0.85,
          y: 0.85,
          z: 0.85,
          duration: 5,
          // ease: "power1.inOut",
          ease: "elastic.out(1, 0.3)",
        });
      }
    }
  },
  {
    passive: true,
  }
);

window.addEventListener("load", () => {
  createScene();
  createLights();
  createSea();
  const typewriter = new Typewriter("#name", {
    delay: 50,
  });
  document.getElementById("name")!.style.display = "block"
  typewriter
    .typeString("Siddharth Suresh")
    .start();
  createSky()
  loop();
  setTimeout(() => {
    gsap.to(sea.mesh.scale, {
      x: 0.7,
      y: 0.7,
      z: 0.7,
      duration: 10,
      ease: "elastic.out(1, 0.3)",
    });
  }, 2000);
});