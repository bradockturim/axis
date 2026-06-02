// ─── LGPD Cookie Consent ────────────────────────────────────────────────────

const LGPD_CONSENT_KEY = 'axis_cookie_consent';

function loadTrackingScripts() {
    // Google Analytics (GA4)
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-K8PHLCCNM6';
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-K8PHLCCNM6');

    // Google Tag Manager
    (function(w,d,s,l,i){
        w[l]=w[l]||[];
        w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!=='dataLayer'?'&l='+l:'';
        j.async=true;
        j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
        f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-WWZ7RKC5');

    // Meta Pixel
    !function(f,b,e,v,n,t,s){
        if(f.fbq)return;
        n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
        t=b.createElement(e);t.async=!0;t.src=v;
        s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init','1345025864103250');
    window.fbq('track','PageView');
}

function initCookieConsent() {
    const consent = localStorage.getItem(LGPD_CONSENT_KEY);

    if (consent === 'accepted') {
        loadTrackingScripts();
        return;
    }

    if (consent === 'rejected') {
        return;
    }

    const banner = document.getElementById('cookieBanner');
    if (!banner) return;
    banner.style.display = 'block';

    document.getElementById('cookieAccept').addEventListener('click', () => {
        localStorage.setItem(LGPD_CONSENT_KEY, 'accepted');
        banner.style.display = 'none';
        loadTrackingScripts();
    });

    document.getElementById('cookieReject').addEventListener('click', () => {
        localStorage.setItem(LGPD_CONSENT_KEY, 'rejected');
        banner.style.display = 'none';
    });
}

initCookieConsent();

// ─── App ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    const getCookieValue = (name) => {
        const cookies = document.cookie ? document.cookie.split('; ') : [];
        const prefix = `${encodeURIComponent(name)}=`;
        for (const entry of cookies) {
            if (entry.startsWith(prefix)) {
                return decodeURIComponent(entry.slice(prefix.length));
            }
        }
        return null;
    };

    const setCookie = (name, value, maxAgeSeconds) => {
        const maxAge = Number.isFinite(maxAgeSeconds) ? `; max-age=${maxAgeSeconds}` : '';
        document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; samesite=lax${maxAge}`;
    };

    const ensureFbcCookieFromFbclid = () => {
        if (localStorage.getItem(LGPD_CONSENT_KEY) !== 'accepted') return;
        const params = new URLSearchParams(window.location.search);
        const fbclid = params.get('fbclid');
        if (!fbclid) return;
        if (getCookieValue('_fbc')) return;
        const fbc = `fb.1.${Date.now()}.${fbclid}`;
        setCookie('_fbc', fbc, 60 * 60 * 24 * 90);
    };

    ensureFbcCookieFromFbclid();

    const generateEventId = () => {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const sendMetaCapiEvent = async ({ eventName, eventId, customData }) => {
        try {
            await fetch('/capi.php', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    event_name: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: eventId,
                    event_source_url: window.location.href,
                    fbp: getCookieValue('_fbp'),
                    fbc: getCookieValue('_fbc'),
                    custom_data: customData
                })
            });
        } catch {
        }
    };

    const trackWhatsAppLead = (link) => {
        const href = link.getAttribute('href') || '';
        const text = (link.textContent || '').trim();
        const eventId = generateEventId();

        if (window.dataLayer && typeof window.dataLayer.push === 'function') {
            window.dataLayer.push({
                event: 'lead_whatsapp_click',
                link_href: href,
                link_text: text
            });
        }

        if (typeof window.gtag === 'function') {
            window.gtag('event', 'generate_lead', {
                method: 'whatsapp',
                link_text: text
            });
        }

        if (typeof window.fbq === 'function') {
            window.fbq('track', 'Lead', {
                method: 'whatsapp',
                link_text: text
            }, { eventID: eventId });
        }

        sendMetaCapiEvent({
            eventName: 'Lead',
            eventId,
            customData: {
                method: 'whatsapp',
                link_text: text
            }
        });
    };

    document.querySelectorAll('a[href*="wa.me/"]').forEach(link => {
        link.addEventListener('click', () => trackWhatsAppLead(link));
    });

    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'menu');
            }
            lucide.createIcons();
        });
    }

    // Close menu when clicking a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const icon = mobileToggle.querySelector('i');
            icon.setAttribute('data-lucide', 'menu');
            lucide.createIcons();
        });
    });

    // Change header background on scroll
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Services Slider Logic
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    const slideInterval = 4000; // 4 seconds

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    if (slides.length > 0) {
        setInterval(nextSlide, slideInterval);
    }

    // Gallery Modal Functionality
    const galleryModal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.getElementById('closeModal');
    const prevImage = document.getElementById('prevImage');
    const nextImage = document.getElementById('nextImage');
    const currentImageSpan = document.getElementById('currentImage');
    const totalImagesSpan = document.getElementById('totalImages');

    let currentImages = [];
    let currentIndex = 0;

    // Open modal when clicking on gallery items
    document.querySelectorAll('.gallery-item[data-gallery]').forEach(item => {
        item.addEventListener('click', () => {
            const imageData = item.getAttribute('data-gallery');
            currentImages = JSON.parse(imageData);
            currentIndex = 0;
            updateModalImage();
            galleryModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        galleryModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close modal on background click
    galleryModal.addEventListener('click', (e) => {
        if (e.target === galleryModal) {
            galleryModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && galleryModal.classList.contains('active')) {
            galleryModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Navigate to previous image
    prevImage.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
        updateModalImage();
    });

    // Navigate to next image
    nextImage.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % currentImages.length;
        updateModalImage();
    });

    // Navigate with arrow keys
    document.addEventListener('keydown', (e) => {
        if (!galleryModal.classList.contains('active')) return;
        
        if (e.key === 'ArrowLeft') {
            currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
            updateModalImage();
        } else if (e.key === 'ArrowRight') {
            currentIndex = (currentIndex + 1) % currentImages.length;
            updateModalImage();
        }
    });

    function updateModalImage() {
        modalImage.src = currentImages[currentIndex];
        currentImageSpan.textContent = currentIndex + 1;
        totalImagesSpan.textContent = currentImages.length;
    }
});
