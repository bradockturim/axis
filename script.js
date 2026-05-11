document.addEventListener('DOMContentLoaded', () => {
    // Lucide icons are initialized in HTML
    
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
});
