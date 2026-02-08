/**
 * Drip Step - Visuals & Animations
 * Handles Three.js background and GSAP scroll animations
 */

// Global state
const state = {
    mouseX: 0,
    mouseY: 0,
    width: window.innerWidth,
    height: window.innerHeight
};

/**
 * Three.js Background System
 */
function initThreeJS() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.0005);

    const camera = new THREE.PerspectiveCamera(75, state.width / state.height, 0.1, 1000);
    camera.position.z = 500;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(state.width, state.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particle System
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;

    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        // Spread particles in a wide area
        posArray[i] = (Math.random() - 0.5) * 3000;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Cyber-punk particle material
    const particlesMaterial = new THREE.PointsMaterial({
        size: 2,
        color: 0x00f3ff, // Cyan
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Mouse interaction
    document.addEventListener('mousemove', (event) => {
        state.mouseX = event.clientX;
        state.mouseY = event.clientY;
    });

    // Handle resize
    window.addEventListener('resize', () => {
        state.width = window.innerWidth;
        state.height = window.innerHeight;

        camera.aspect = state.width / state.height;
        camera.updateProjectionMatrix();

        renderer.setSize(state.width, state.height);
    });

    // Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
        const elapsedTime = clock.getElapsedTime();

        // Rotate entire system slowly
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;

        // Mouse parallax effect
        // Smoothly interpolate camera position based on mouse
        const targetX = (state.mouseX / state.width) * 100 - 50;
        const targetY = (state.mouseY / state.height) * 100 - 50;

        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (-targetY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };

    animate();
}

/**
 * GSAP Scroll Animations
 */
function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    // Hero Text Animation (Glitch Entry)
    const tl = gsap.timeline();

    tl.from('.main-text', {
        duration: 1.5,
        y: 100,
        opacity: 0,
        ease: 'power4.out',
        skewY: 7,
        stagger: {
            amount: 0.3
        }
    });

    // Scroll Animations for Product Cards
    const products = document.querySelectorAll('.card, .sneaker-cont1, .rec-product-card');

    products.forEach((product, index) => {
        gsap.from(product, {
            scrollTrigger: {
                trigger: product,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            duration: 0.8,
            y: 50,
            opacity: 0,
            ease: 'power2.out',
            delay: index % 3 * 0.1 // Stagger effect
        });
    });

    // Section Titles Animation
    const titles = document.querySelectorAll('h1, h2, .recommendation-title');

    titles.forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 80%',
            },
            duration: 1,
            x: -30,
            opacity: 0,
            ease: 'expo.out'
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initGSAP();

    console.log('Drip Step Future UI Initialized 🚀');
});
