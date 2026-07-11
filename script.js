document.addEventListener('DOMContentLoaded', () => {
    // Lightbox Setup
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';

    const lightboxImg = document.createElement('img');

    const lightboxClose = document.createElement('div');
    lightboxClose.className = 'lightbox-close';
    lightboxClose.innerHTML = '&times;';

    lightbox.appendChild(lightboxImg);
    lightbox.appendChild(lightboxClose);
    document.body.appendChild(lightbox);

    // Close Lightbox
    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) {
            lightbox.classList.remove('active');
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
                lightbox.classList.add('active');
            });
        });
    }

    // Dynamic Image Loading
    const galleryGrid = document.querySelector('.gallery-grid');
    const isGalleryPage = document.querySelector('.gallery-page') !== null;

    if (galleryGrid) {
        fetch('/api/images')
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
                        imageEl.src = `images/${img.filename}`;
                        imageEl.alt = img.title || 'Plytelių klijavimo pavyzdys';
                        imageEl.loading = 'lazy';
                        
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
    } else {
        enableLightboxForImages();
    }

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

            fetch('/api/requests', {
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

    console.log('Plytelių Meistras puslapis sėkmingai paruoštas su dinaminiu palaikymu.');
});
