document.addEventListener('DOMContentLoaded', () => {
    // API Configuration
    const API_BASE = '';
    const detectedLanguage = document.documentElement.lang?.toLowerCase().split('-')[0];
    const language = ['pl', 'ru'].includes(detectedLanguage) ? detectedLanguage : 'lt';
    const ui = {
        lt: {
            closePhoto: 'Uždaryti nuotrauką',
            enlargedPhoto: 'Padidinta darbų galerijos nuotrauka',
            enlargePhoto: 'Padidinti nuotrauką:',
            imageFallback: 'Plytelių klijavimo pavyzdys',
            sending: 'Siunčiama...',
            successTitle: 'Užklausa gauta!',
            success: (name, phone) => `Ačiū, ${name}. Jūsų pranešimą gavome. Susisieksime su jumis telefonu <strong>${phone}</strong> kaip įmanoma greičiau.`,
            errorPrefix: 'Klaida:',
            errorFallback: 'Nepavyko išsiųsti užklausos.',
            submit: 'Siųsti Užklausą',
            networkError: 'Tinklo klaida. Nepavyko pasiekti serverio.',
            cookieText: 'Naudojame Google Analytics, kad suprastume, kaip lankytojai naudojasi svetaine. Analitikos slapukai įjungiami tik gavus jūsų sutikimą.',
            cookieAccept: 'Leisti analitiką',
            cookieDecline: 'Atmesti',
            privacyLabel: 'Privatumo politika',
            privacyUrl: '/privatumo-politika.html'
        },
        pl: {
            closePhoto: 'Zamknij zdjęcie',
            enlargedPhoto: 'Powiększone zdjęcie realizacji',
            enlargePhoto: 'Powiększ zdjęcie:',
            imageFallback: 'Przykład układania płytek',
            sending: 'Wysyłanie...',
            successTitle: 'Zapytanie wysłane!',
            success: (name, phone) => `Dziękujemy, ${name}. Otrzymaliśmy wiadomość. Skontaktujemy się z Tobą pod numerem <strong>${phone}</strong> tak szybko, jak to możliwe.`,
            errorPrefix: 'Błąd:',
            errorFallback: 'Nie udało się wysłać zapytania.',
            submit: 'Wyślij zapytanie',
            networkError: 'Błąd sieci. Nie można połączyć się z serwerem.',
            cookieText: 'Używamy Google Analytics, aby zrozumieć, jak odwiedzający korzystają ze strony. Analityczne pliki cookie są włączane wyłącznie za zgodą.',
            cookieAccept: 'Zezwól na analitykę',
            cookieDecline: 'Odrzuć',
            privacyLabel: 'Polityka prywatności',
            privacyUrl: '/pl/polityka-prywatnosci.html'
        },
        ru: {
            closePhoto: 'Закрыть фотографию',
            enlargedPhoto: 'Увеличенная фотография выполненной работы',
            enlargePhoto: 'Увеличить фотографию:',
            imageFallback: 'Пример укладки плитки',
            sending: 'Отправка...',
            successTitle: 'Заявка отправлена!',
            success: (name, phone) => `Спасибо, ${name}. Мы получили ваше сообщение и свяжемся с вами по телефону <strong>${phone}</strong> как можно скорее.`,
            errorPrefix: 'Ошибка:',
            errorFallback: 'Не удалось отправить заявку.',
            submit: 'Отправить заявку',
            networkError: 'Ошибка сети. Не удалось связаться с сервером.',
            cookieText: 'Мы используем Google Analytics, чтобы понимать, как посетители пользуются сайтом. Аналитические файлы cookie включаются только с вашего согласия.',
            cookieAccept: 'Разрешить аналитику',
            cookieDecline: 'Отклонить',
            privacyLabel: 'Политика конфиденциальности',
            privacyUrl: '/ru/politika-konfidencialnosti.html'
        }
    }[language];

    const consentKey = 'situacija_analytics_consent';
    const updateAnalyticsConsent = (value) => {
        localStorage.setItem(consentKey, value);
        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', { analytics_storage: value });
        }
    };

    if (!localStorage.getItem(consentKey)) {
        const consentBanner = document.createElement('aside');
        consentBanner.className = 'cookie-consent';
        consentBanner.setAttribute('role', 'dialog');
        consentBanner.setAttribute('aria-label', 'Google Analytics');
        consentBanner.innerHTML = `
            <p>${ui.cookieText} <a href="${ui.privacyUrl}">${ui.privacyLabel}</a>.</p>
            <div class="cookie-consent-actions">
                <button type="button" class="btn btn-primary" data-consent="granted">${ui.cookieAccept}</button>
                <button type="button" class="btn cookie-decline" data-consent="denied">${ui.cookieDecline}</button>
            </div>
        `;
        consentBanner.addEventListener('click', (event) => {
            const button = event.target.closest('[data-consent]');
            if (!button) return;
            updateAnalyticsConsent(button.dataset.consent);
            consentBanner.remove();
        });
        document.body.appendChild(consentBanner);
    }

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link || typeof window.gtag !== 'function') return;
        if (link.href.startsWith('tel:')) {
            window.gtag('event', 'phone_click', { link_url: link.href });
        } else if (link.classList.contains('service-card-link')) {
            window.gtag('event', 'service_link_click', {
                link_url: link.href,
                link_text: link.textContent.trim()
            });
        }
    });

    const serviceImages = [
        { match: /voni|łazien|ванн/i, src: '/images/services/vonios-kambariai.webp', alt: 'Modernus plytelėmis įrengtas vonios kambarys su dušo zona', href: 'vonios-kambario-plyteliu-klijavimas.html' },
        { match: /virtuv|kuchni|кухн/i, src: '/images/services/virtuves.webp', alt: 'Tiksliai išklijuota šiuolaikinės virtuvės sienelė ir grindys', href: 'virtuves-plyteliu-klijavimas.html' },
        { match: /grind|teras|format|podłog|taras|формат|пол/i, src: '/images/services/grindys-ir-terasos.webp', alt: 'Didelio formato plytelių grindys svetainėje ir lauko terasoje', href: 'didelio-formato-plyteliu-klojimas.html' },
        { match: /fasad|klink|elewac|фасад|клинкер/i, src: '/images/services/fasadu-apdaila-klinkeriu.webp', alt: 'Tvarkingai klinkerio plytelėmis apdailintas gyvenamojo namo fasadas', href: 'klinkerio-klijavimas-fasadai.html' },
        { match: /kriaukl|umywalk|раковин/i, src: '/images/services/kriaukles-is-plyteliu.webp', alt: 'Individuali kriauklė iš didelio formato šviesių plytelių', href: 'kriaukles-is-plyteliu.html' }
    ];

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
    lightboxClose.setAttribute('aria-label', ui.closePhoto);
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', ui.enlargedPhoto);

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
            newImg.setAttribute('aria-label', `${ui.enlargePhoto} ${newImg.alt}`);
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
        fetch(`${API_BASE}/api/images?lang=${language}`)
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
                        imageEl.alt = img.title || ui.imageFallback;
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
    // New pages are rendered from the Directus block builder on the server.
    // Keep the legacy key/value loader only as a fallback for older pages.
    if (language === 'lt' && !document.querySelector('[data-cms-block]')) fetch(`${API_BASE}/api/content`)
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
                            if (!services.some(service => service.href === 'kriaukles-is-plyteliu.html' || /kriaukl/i.test(service.title || ''))) {
                                services.push({
                                    icon: '🚰',
                                    title: 'Kriauklės iš Plytelių',
                                    desc: 'Individualios plytelėmis formuojamos kriauklės: konstrukcija, hidroizoliacija, nuolydžiai, išleidimo mazgas ir tikslios 45° briaunos.',
                                    href: 'kriaukles-is-plyteliu.html'
                                });
                            }
                            servicesList.innerHTML = ''; // Clear fallback services
                            services.forEach(service => {
                                const card = document.createElement('div');
                                card.className = 'service-card';

                                const imageConfig = serviceImages.find(item => item.match.test(service.title || ''));
                                if (imageConfig) {
                                    card.classList.add('service-card-with-image');
                                    const image = document.createElement('img');
                                    image.className = 'service-card-image';
                                    image.src = service.image || imageConfig.src;
                                    image.alt = service.imageAlt || imageConfig.alt;
                                    image.width = 960;
                                    image.height = 720;
                                    image.loading = 'lazy';
                                    card.appendChild(image);
                                }
                                
                                const h3 = document.createElement('h3');
                                h3.textContent = service.title || '';
                                
                                const p = document.createElement('p');
                                p.textContent = service.desc || '';
                                
                                card.appendChild(h3);
                                card.appendChild(p);

                                const serviceHref = service.href || imageConfig?.href;
                                if (serviceHref) {
                                    const link = document.createElement('a');
                                    link.className = 'service-card-link';
                                    link.href = serviceHref;
                                    link.textContent = 'Plačiau apie paslaugą →';
                                    card.appendChild(link);
                                }
                                
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
                submitBtn.textContent = ui.sending;
            }

            fetch(`${API_BASE}/api/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, phone, message, lang: language })
            })

            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (typeof window.gtag === 'function') {
                        window.gtag('event', 'generate_lead', { method: 'contact_form' });
                    }
                    // Display premium success message
                    const formWrapper = document.querySelector('.contact-form-wrapper');
                    if (formWrapper) {
                        formWrapper.innerHTML = `
                            <div class="success-message-card">
                                <div class="success-icon">✓</div>
                                <h3>${ui.successTitle}</h3>
                                <p>${ui.success(name, phone)}</p>
                            </div>
                        `;
                    }
                } else {
                    alert(`${ui.errorPrefix} ${data.error || ui.errorFallback}`);
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = ui.submit;
                    }
                }
            })
            .catch(err => {
                console.error(err);
                alert(ui.networkError);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = ui.submit;
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
