/* ===== Scroll Progress ===== */
window.addEventListener('scroll', () => {
    const p = (document.documentElement.scrollTop / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    document.getElementById('scrollProgress').style.width = p + '%';
});

/* ===== Navbar transparent -> solid ===== */
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', scrollY > 80);
});

/* ===== Off-canvas Menu ===== */
const hamBtn = document.getElementById('hamBtn');
const ocMenu = document.getElementById('ocMenu');
const ocOverlay = document.getElementById('ocOverlay');
const ocClose = document.getElementById('ocClose');
function openM() { ocMenu.classList.add('active'); ocOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeM() { ocMenu.classList.remove('active'); ocOverlay.classList.remove('active'); document.body.style.overflow = ''; }
hamBtn.addEventListener('click', openM);
ocClose.addEventListener('click', closeM);
ocOverlay.addEventListener('click', closeM);
document.querySelectorAll('.oc-link').forEach(l => l.addEventListener('click', closeM));

/* ===== Hero Swiper ===== */
const heroSwiper = new Swiper('.heroSwiper', {
    loop: true,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    autoplay: { delay: 4000, disableOnInteraction: false },
    speed: 1000,
    pagination: { el: '.hero-pagination', clickable: true }
});

/* Animate hero content on each slide */
function animateHero() {
    const el = document.querySelector('.swiper-slide-active .hero-content');
    if (!el) return;
    gsap.fromTo(el.children, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' });
}
animateHero();
heroSwiper.on('slideChangeTransitionStart', animateHero);

/* ===== Sports Swiper ===== */
new Swiper('.sportsSwiper', {
    slidesPerView: 1.3,
    spaceBetween: 16,
    grabCursor: true,
    loop: true,
    navigation: {
        nextEl: '.sportsSwiper .swiper-button-next',
        prevEl: '.sportsSwiper .swiper-button-prev'
    },
    breakpoints: {
        480: { slidesPerView: 2, spaceBetween: 16 },
        768: { slidesPerView: 3, spaceBetween: 20 },
        1024: { slidesPerView: 4, spaceBetween: 20 }
    }
});

/* ===== TV Swiper (Continuous Marquee) ===== */
new Swiper('.tvSwiper', {
    slidesPerView: 1.3,
    spaceBetween: 16,
    grabCursor: false,
    allowTouchMove: false,
    loop: true,
    autoplay: {
        delay: 0,
        disableOnInteraction: false,
    },
    speed: 3000,
    breakpoints: {
        480: { slidesPerView: 2, spaceBetween: 16 },
        768: { slidesPerView: 3, spaceBetween: 20 },
        1024: { slidesPerView: 4, spaceBetween: 20 }
    }
});

/* ===== Animate On Scroll (IntersectionObserver) ===== */
const aosEls = document.querySelectorAll('.aos, .aos-left');
const aosObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            aosObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });
aosEls.forEach((el, i) => {
    el.style.transitionDelay = (i % 6) * 0.08 + 's';
    aosObserver.observe(el);
});

/* ===== Stats Counter ===== */
const counters = document.querySelectorAll('.stat-item .num');
const statsObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target);
            let current = 0;
            const inc = target / 50;
            const timer = setInterval(() => {
                current += inc;
                if (current >= target) { el.textContent = target + '+'; clearInterval(timer); }
                else { el.textContent = Math.floor(current) + '+'; }
            }, 30);
            statsObs.unobserve(el);
        }
    });
}, { threshold: 0.5 });
counters.forEach(c => statsObs.observe(c));

/* ===== FAQ Accordion ===== */
document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
        const item = q.parentElement;
        const wasActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!wasActive) item.classList.add('active');
    });
});

/* ===== Smooth Scroll ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const t = document.querySelector(href);
        if (t) {
            const offset = 80;
            const y = t.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    });
});
