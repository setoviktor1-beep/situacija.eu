document.addEventListener('DOMContentLoaded', () => {
    // API Configuration
    const API_BASE = '';

    // Lightbox Setup
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.hidden = true;

    const lightboxImg = document.createElement('img');
    lightboxImg.alt = '';

    const lightboxClose = document.createElement('button');
    lightboxClose.className = 'lightbox-close';
    lightboxClose.innerHTML = '&times;';
    lightboxClose.type = 'button';
    lightboxClose.setAttribute('aria-label', 'Uždaryti nuotrauką');
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Padidinta darbų galerijos nuotrauka');

    lightbox.appendChild(lightboxImg);
    lightbox.appendChild(lightboxClose);
    document.body.appendChild(lightbox);

    // Close Lightbox
    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) {
            closeLightbox();
        }
    });

    // Helper to attach lightbox event to images
    function enableLightboxForImages() {
        const galleryImages = document.querySelectorAll('.gallery-item img');
        galleryImages.forEach(img => {
            // Remove old listeners by cloning (to avoid duplicates)
            const newImg = img.cloneNode(true);
            img.parentNode.replaceChild(newImg, img);
            
            newImg.addEventListener('click', () => {
                lightboxImg.src = newImg.src;
                lightboxImg.alt = newImg.alt;
                lightbox.hidden = false;
                lightbox.classList.add('active');
                lightboxClose.focus();
            });
            newImg.tabIndex = 0;
            newImg.setAttribute('role', 'button');
            newImg.setAttribute('aria-label', `Padidinti nuotrauką: ${newImg.alt}`);
            newImg.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    newImg.click();
                }
            });
        });
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.hidden = true;
        lightboxImg.src = '';
        lightboxImg.alt = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
    });

    // Dynamic Image Loading
    const galleryGrid = document.querySelector('.gallery-grid');
    const isGalleryPage = document.querySelector('.gallery-page') !== null;

    if (galleryGrid) {
        fetch(`${API_BASE}/api/images`)
            .then(res => res.json())
            .then(images => {
                if (images && images.length > 0) {
                    galleryGrid.innerHTML = ''; // Clear hardcoded images
                    
                    // On home page, show max 6 images. On gallery page, show all.
                    const limit = isGalleryPage ? images.length : 6;
                    const displayImages = images.slice(0, limit);

                    displayImages.forEach(img => {
                        const item = document.createElement('div');
                        item.className = 'gallery-item';
                        
                        const imageEl = document.createElement('img');
                        imageEl.src = img.url || `${API_BASE}/api/assets/${encodeURIComponent(img.file_id || img.filename)}`;
                        imageEl.alt = img.title || 'Plytelių klijavimo pavyzdys';
                        imageEl.loading = 'lazy';
                        imageEl.decoding = 'async';
                        if (img.width && img.height) {
                            imageEl.width = img.width;
                            imageEl.height = img.height;
                        }
                        
                        item.appendChild(imageEl);
                        galleryGrid.appendChild(item);
                    });
                    
                    enableLightboxForImages();
                } else {
                    // Fallback to static if no database entries yet
                    enableLightboxForImages();
                }
            })
            .catch(err => {
                console.error('Nepavyko užkrauti nuotraukų iš serverio, rodomos statinės nuotraukos:', err);
                enableLightboxForImages();
            });
        enableLightboxForImages();
    }

    // Dynamic Site Content Loading
    fetch(`${API_BASE}/api/content`)
        .then(res => res.json())
        .then(content => {
            if (content) {
                // Hero elements
                const heroTitle = document.getElementById('hero-title');
                const heroSubtitle = document.getElementById('hero-subtitle');
                if (heroTitle && content.hero_title) heroTitle.textContent = content.hero_title;
                if (heroSubtitle && content.hero_subtitle) heroSubtitle.textContent = content.hero_subtitle;

                // Contact info
                const contactPhone = document.getElementById('contact-phone');
                const contactEmail = document.getElementById('contact-email');
                const contactFb = document.getElementById('contact-fb');

                if (contactPhone) {
                    if (content.contact_phone_href) contactPhone.href = `tel:${content.contact_phone_href}`;
                    if (content.contact_phone_text) contactPhone.textContent = content.contact_phone_text;
                }
                if (contactEmail) {
                    if (content.contact_email) {
                        contactEmail.href = `mailto:${content.contact_email}`;
                        contactEmail.textContent = content.contact_email;
                    }
                }
                if (contactFb) {
                    if (content.contact_fb_url) contactFb.href = content.contact_fb_url;
                    if (content.contact_fb_text) contactFb.textContent = content.contact_fb_text;
                }

                // Services grid
                const servicesList = document.getElementById('services-list');
                if (servicesList && content.services) {
                    try {
                        const services = JSON.parse(content.services);
                        if (services && services.length > 0) {
                            servicesList.innerHTML = ''; // Clear fallback services
                            services.forEach(service => {
                                const card = document.createElement('div');
                                card.className = 'service-card';
                                
                                const iconDiv = document.createElement('div');
                                iconDiv.className = 'icon';
                                iconDiv.textContent = service.icon || '🛠️';
                                
                                const h3 = document.createElement('h3');
                                h3.textContent = service.title || '';
                                
                                const p = document.createElement('p');
                                p.textContent = service.desc || '';
                                
                                card.appendChild(iconDiv);
                                card.appendChild(h3);
                                card.appendChild(p);
                                
                                servicesList.appendChild(card);
                            });
                        }
                    } catch (e) {
                        console.error('Klaida parsintant paslaugų JSON:', e);
                    }
                }
            }
        })
        .catch(err => {
            console.error('Nepavyko užkrauti dinaminio svetainės turinio:', err);
        });

    // Contact Form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Siunčiama...';
            }

            fetch(`${API_BASE}/api/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, phone, message })
            })

            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Display premium success message
                    const formWrapper = document.querySelector('.contact-form-wrapper');
                    if (formWrapper) {
                        formWrapper.innerHTML = `
                            <div class="success-message-card">
                                <div class="success-icon">✓</div>
                                <h3>Užklausa gauta!</h3>
                                <p>Ačiū, ${name}. Jūsų pranešimą gavome. Susisieksime su jumis telefonu <strong>${phone}</strong> kaip įmanoma greičiau.</p>
                            </div>
                        `;
                    }
                } else {
                    alert('Klaida: ' + (data.error || 'Nepavyko išsiųsti užklausos.'));
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Siųsti Užklausą';
                    }
                }
            })
            .catch(err => {
                console.error(err);
                alert('Tinklo klaida. Nepavyko pasiekti serverio.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Siųsti Užklausą';
                }
            });
        });
    }

    
    // Canvas Animation & Burger Menu
    initHeroCanvas();
    initMobileMenu();
    initFaqAccordions();

    function initFaqAccordions() {
        document.querySelectorAll('.faq-question').forEach((question, index) => {
            const answer = question.nextElementSibling;
            const answerId = answer?.id || `faq-answer-${index + 1}`;
            if (answer) answer.id = answerId;
            question.setAttribute('role', 'button');
            question.setAttribute('tabindex', '0');
            question.setAttribute('aria-controls', answerId);
            question.setAttribute('aria-expanded', String(question.parentElement.classList.contains('active')));

            const toggle = () => {
                const isOpen = question.parentElement.classList.toggle('active');
                question.setAttribute('aria-expanded', String(isOpen));
            };
            question.addEventListener('click', toggle);
            question.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggle();
                }
            });
        });
    }

    function initHeroCanvas() {
        const canvas = document.getElementById('heroCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        let laserY = 50;
        let laserDir = 1;
        let laserX = 100;
        let laserXDir = 1.2;

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw precision tile grid
            const tileSize = 70;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;

            for (let x = 0; x < canvas.width; x += tileSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += tileSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Laser Level Horizontal Line (Teal Laser)
            laserY += laserDir * 0.8;
            if (laserY > canvas.height || laserY < 0) laserDir *= -1;

            ctx.strokeStyle = 'rgba(45, 212, 191, 0.45)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#2dd4bf';
            ctx.beginPath();
            ctx.moveTo(0, laserY);
            ctx.lineTo(canvas.width, laserY);
            ctx.stroke();

            // Laser Level Vertical Line (Red Laser)
            laserX += laserXDir * 0.7;
            if (laserX > canvas.width || laserX < 0) laserXDir *= -1;

            ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(laserX, 0);
            ctx.lineTo(laserX, canvas.height);
            ctx.stroke();

            ctx.shadowBlur = 0;

            requestAnimationFrame(animate);
        }
        animate();
    }

    function initMobileMenu() {
        const burgerBtn = document.getElementById('burgerBtn');
        const mobilePanel = document.getElementById('mobileNavPanel');
        if (!burgerBtn || !mobilePanel) return;

        burgerBtn.addEventListener('click', () => {
            burgerBtn.classList.toggle('active');
            mobilePanel.classList.toggle('open');
            burgerBtn.setAttribute('aria-expanded', String(mobilePanel.classList.contains('open')));
        });

        mobilePanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                burgerBtn.classList.remove('active');
                mobilePanel.classList.remove('open');
                burgerBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    console.log('Plytelių Meistras puslapis sėkmingai paruoštas.');
});
