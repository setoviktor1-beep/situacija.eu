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

    console.log('Plytelių Meistras puslapis užkrautas.');
});
