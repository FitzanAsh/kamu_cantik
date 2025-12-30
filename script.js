document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const enterBtn = document.getElementById('enter-btn');
    const page1 = document.getElementById('page-1');
    const page2 = document.getElementById('page-2');
    const bgMusic = document.getElementById('bg-music');
    const lyricsContainer = document.getElementById('lyrics-container');
    const threeContainer = document.getElementById('three-container');

    // State
    let isPlaying = false;
    let animationStartTime = 0;

    // Timeline for 52-second song:
    // 0-12s: First card (portrait) spins
    // 12s: First card swipes up
    // 15-27s: Second card (landscape, 2 frames from left+right)
    // 27s: Second card swipes out
    // 30-50s: Lyrics continue
    // 50s: Final photo card appears

    // Lyrics data - adjusted for 52s song
    const lyrics = [
        { text: "🎵 Bukan karena make up di...", time: 2 },
        { text: "...wajahmu atau lipstik merah itu 💄", time: 6 },
        { text: "Lembut hati tutur kata...", time: 12 },
        { text: "...terciptalah cinta yang ku puja 💕", time: 16 },
        { text: "Tak perduli...", time: 21 },
        { text: "...langit menertawakanku 🌙", time: 25 },
        { text: "Kau mencuri...", time: 29 },
        { text: "...hatiku, mimpiku, semua rinduku 💘", time: 34 },
        { text: "Karena kamu cantik 🤍", time: 39, highlight: true },
        { text: "Kan kuberi segalanya apa yang kupunya 💕", time: 43, highlight: true },
        { text: "Sempurnalah duniaku saat kau di sisiku 🤍", time: 48, highlight: true, final: true }
    ];

    // Event Listeners
    enterBtn.addEventListener('click', transitionToPage2);

    function transitionToPage2() {
        page1.classList.remove('visible');
        page1.classList.add('hidden');
        playMusic();

        setTimeout(() => {
            page1.style.display = 'none';
            page2.classList.remove('hidden');
            page2.classList.add('visible');

            animationStartTime = Date.now();

            // Start all systems
            initFirstCard();
            startLyricsSequence();
            scheduleSecondCards();
            scheduleIntermediateCard(); // New card for gap
            scheduleFinalCard();

        }, 1000);
    }

    function playMusic() {
        bgMusic.play().then(() => {
            isPlaying = true;
        }).catch(err => {
            console.log("Auto-play blocked.");
        });
    }

    // ============================================
    // LYRICS SEQUENCE
    // ============================================
    function startLyricsSequence() {
        lyricsContainer.innerHTML = '';

        let currentLyricIndex = 0;

        function checkAndDisplayLyrics() {
            const elapsed = (Date.now() - animationStartTime) / 1000;

            if (currentLyricIndex < lyrics.length) {
                const lyric = lyrics[currentLyricIndex];
                if (elapsed >= lyric.time) {
                    displayLyric(lyric.text, lyric.highlight, currentLyricIndex, elapsed);
                    currentLyricIndex++;
                }
            }

            requestAnimationFrame(checkAndDisplayLyrics);
        }

        checkAndDisplayLyrics();
    }

    function displayLyric(text, isHighlight, lyricIndex, currentTime) {
        lyricsContainer.innerHTML = '';
        if (!text) return;

        // Animation variants (always random)
        const animations = ['anim-up', 'anim-left', 'anim-right', 'anim-zoom', 'anim-float', 'anim-blur'];
        const randomAnim = animations[Math.floor(Math.random() * animations.length)];

        // Position logic:
        // Lyric 1 (index 0): bottom
        // Lyric 2 (index 1): top
        // Lyric 3-7 (index 2-6): center
        // After that: smart random (avoid frame areas)
        let position;

        if (lyricIndex === 0) {
            // First lyric: bottom
            position = 'pos-bottom';
        } else if (lyricIndex === 1) {
            // Second lyric: top
            position = 'pos-top';
        } else if (lyricIndex <= 6) {
            // Lyrics 3-7: center
            position = 'pos-center';
        } else if (lyricIndex >= 8) {
            // Last 3 lyrics (8, 9, 10): bottom
            position = 'pos-bottom';
        } else {
            // Remaining (Lyric 8? No, 8 is covered above. This handles potential gaps or smart random for intermediate if index 7)
            // Lyric index 7 falls here.
            // During landscape cards (15-27s) and final card (after 50s), use center
            if ((currentTime >= 15 && currentTime <= 27) || currentTime >= 50) {
                position = 'pos-center';
            } else {
                const positions = ['pos-top', 'pos-center', 'pos-bottom'];
                position = positions[Math.floor(Math.random() * positions.length)];
            }
        }

        const p = document.createElement('p');
        p.textContent = text;
        p.classList.add('lyric-line', randomAnim, position);

        if (isHighlight) {
            p.classList.add('highlight-lyric');
        }

        lyricsContainer.appendChild(p);
        requestAnimationFrame(() => p.classList.add('active'));
    }

    // ============================================
    // FIRST CARD (Portrait, 3D spinning) - 0 to 12 seconds
    // ============================================
    function initFirstCard() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 300 / 400, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(300, 400);
        renderer.setClearColor(0x000000, 0);
        threeContainer.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(0, 1, 2);
        scene.add(directionalLight);

        // Load textures for front and back
        const textureLoader = new THREE.TextureLoader();
        const frontTexture = textureLoader.load('assets/foto1.jpg');
        const backTexture = textureLoader.load('assets/foto2.jpg');

        // Portrait card
        const cardGeometry = new THREE.BoxGeometry(2.2, 3, 0.1);
        const frontMaterial = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.3 });
        const backMaterial = new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.3 });
        const sideMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const materials = [sideMaterial, sideMaterial, sideMaterial, sideMaterial, frontMaterial, backMaterial];

        const card = new THREE.Mesh(cardGeometry, materials);
        scene.add(card);
        card.position.y = -10;

        let phase = 'rising';
        let riseProgress = 0;
        let spinAngle = 0;
        let spinStartTime = 0;
        let exitProgress = 0;

        function animate() {
            if (phase === 'done') return;
            requestAnimationFrame(animate);

            if (phase === 'rising') {
                riseProgress += 0.02;
                const ease = 1 - Math.pow(1 - riseProgress, 3);
                card.position.y = -10 + (10 * ease);
                card.rotation.y = Math.sin(riseProgress * Math.PI) * 0.5;

                if (riseProgress >= 1) {
                    card.position.y = 0;
                    phase = 'spinning';
                    spinStartTime = Date.now();
                }
            } else if (phase === 'spinning') {
                spinAngle -= 0.015;
                card.rotation.y = spinAngle;
                card.position.y = Math.sin(spinAngle * 0.5) * 0.1;

                // Spin for 10 seconds (first 12s total including rise)
                if (Date.now() - spinStartTime >= 10000) {
                    phase = 'exiting';
                }
            } else if (phase === 'exiting') {
                exitProgress += 0.04;
                card.position.y = exitProgress * 15;
                card.rotation.x = -exitProgress * 0.5;

                if (exitProgress >= 1) {
                    threeContainer.style.opacity = '0';
                    threeContainer.style.transition = 'opacity 0.5s';
                    phase = 'done';
                }
            }

            renderer.render(scene, camera);
        }

        animate();
    }

    // ============================================
    // SECOND CARDS (Landscape, swipe from left+right) - 13 to 25 seconds
    // ============================================
    function scheduleSecondCards() {
        // Show at 13 seconds (immediately after first card exits)
        setTimeout(() => {
            showLandscapeCards();
        }, 13000);
    }

    function showLandscapeCards() {
        // Create container for landscape cards
        const cardContainer = document.createElement('div');
        cardContainer.id = 'landscape-cards';
        cardContainer.innerHTML = `
            <div class="landscape-card card-left">
                <div class="card-inner">
                    <img src="assets/foto4.png" alt="Foto">
                </div>
            </div>
            <div class="landscape-card card-right">
                <div class="card-inner">
                    <img src="assets/foto6.jpg" alt="Foto">
                </div>
            </div>
        `;

        document.getElementById('page-2').appendChild(cardContainer);

        // Small delay to ensure initial position is rendered before animation
        setTimeout(() => {
            cardContainer.classList.add('visible');
        }, 100);

        // Exit after 12 seconds (at 27s mark)
        setTimeout(() => {
            cardContainer.classList.add('exiting');

            // Remove after animation
            setTimeout(() => {
                cardContainer.remove();
            }, 1000);
        }, 12000);
    }

    // ============================================
    // INTERMEDIATE CARD (Portrait, floating at gap) - 30 to 45 seconds
    // ============================================
    function scheduleIntermediateCard() {
        setTimeout(() => {
            showIntermediateCard();
        }, 30000);
    }

    function showIntermediateCard() {
        const card = document.createElement('div');
        card.id = 'intermediate-card';
        card.innerHTML = `
            <div class="photo-inner">
                <img src="assets/foto3.jpg" alt="Putri" onerror="this.style.display='none'">
            </div>
        `;
        document.getElementById('page-2').appendChild(card);

        requestAnimationFrame(() => card.classList.add('visible'));

        setTimeout(() => {
            card.classList.remove('visible');
            setTimeout(() => card.remove(), 1000);
        }, 15000);
    }

    // ============================================
    // FINAL CARD (Photo at end) - 50 seconds
    // ============================================
    function scheduleFinalCard() {
        setTimeout(() => {
            showFinalCard();
        }, 50000);
    }

    function showFinalCard() {
        const photoCard = document.createElement('div');
        photoCard.id = 'photo-card';
        photoCard.innerHTML = `
            <div class="photo-inner">
                <img src="assets/foto5.png" alt="Putri" onerror="this.style.display='none'">
                <span class="heart-overlay">🤍</span>
            </div>
            <p class="photo-caption">Untuk Putri 💕</p>
        `;

        document.getElementById('page-2').appendChild(photoCard);
        requestAnimationFrame(() => photoCard.classList.add('visible'));
    }
});
