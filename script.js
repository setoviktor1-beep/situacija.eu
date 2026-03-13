document.addEventListener('DOMContentLoaded', () => {
    // Gallery Lightbox Functionality
    const galleryItems = document.querySelectorAll('.gallery-item img');

    // Create Lightbox Elements
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';

    const lightboxImg = document.createElement('img');

    const lightboxClose = document.createElement('div');
    lightboxClose.className = 'lightbox-close';
    lightboxClose.innerHTML = '&times;';

    lightbox.appendChild(lightboxImg);
    lightbox.appendChild(lightboxClose);
    document.body.appendChild(lightbox);

    // Open Lightbox
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            lightboxImg.src = item.src;
            lightbox.classList.add('active');
        });
    });

    // Close Lightbox
    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) {
            lightbox.classList.remove('active');
        }
    });

    // Contact Form Logic
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;
            
            const emailTo = 'v.finazonok@gmail.com';
            const subject = 'Užklausa iš Situacija.eu';
            const body = `Vardas: ${name}%0D%0ATelefonas: ${phone}%0D%0AŽinutė: ${message}`;
            
            window.location.href = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${body}`;
        });
    }

    console.log('Plytelių Meistras puslapis užkrautas.');
});
