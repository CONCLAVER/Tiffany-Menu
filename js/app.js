(function () {
    'use strict';

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                var offset = 60;
                var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    // --- Sticky nav visibility ---
    var nav = document.getElementById('nav');
    var hero = document.getElementById('hero');

    function handleNavScroll() {
        var scrollY = window.pageYOffset;
        var heroBottom = hero.offsetTop + hero.offsetHeight;

        if (scrollY > heroBottom - 100) {
            nav.classList.add('visible');
        } else {
            nav.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });

    // --- Filter bars: hide on scroll down, reveal on scroll up ---
    var filterBars = document.querySelectorAll('.filters');
    var lastFilterY = window.pageYOffset;
    var filterAcc = 0;
    var NAV_H = 76;

    function handleFiltersScroll() {
        var y = window.pageYOffset;
        var dy = y - lastFilterY;
        lastFilterY = y;
        if (Math.abs(dy) < 4) return;
        filterAcc += dy;

        if (filterAcc > 30) {
            filterBars.forEach(function (bar) {
                if (bar.getBoundingClientRect().top <= NAV_H + 1) {
                    bar.classList.add('filters--hidden');
                }
            });
            filterAcc = 0;
        } else if (filterAcc < -10) {
            filterBars.forEach(function (bar) {
                bar.classList.remove('filters--hidden');
            });
            filterAcc = 0;
        }

        filterBars.forEach(function (bar) {
            if (bar.getBoundingClientRect().top > NAV_H + 1) {
                bar.classList.remove('filters--hidden');
            }
        });
    }

    window.addEventListener('scroll', handleFiltersScroll, { passive: true });

    // --- Filter functionality (called after menu renders) ---
    function initFilters() {
        document.querySelectorAll('.filters').forEach(function (filterBar) {
            var section = filterBar.dataset.section;
            var grid = section === 'food'
                ? document.getElementById('food-grid')
                : document.getElementById('bar-grid');
            if (!grid) return;

            var categories = grid.querySelectorAll('.menu-category');
            var buttons = filterBar.querySelectorAll('.filter-btn');

            buttons.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    buttons.forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');

                    var filter = btn.dataset.filter;

                    categories.forEach(function (cat) {
                        if (filter === 'all' || cat.dataset.category === filter) {
                            cat.classList.remove('hidden');
                            cat.style.animation = 'fadeIn .4s ease forwards';
                        } else {
                            cat.classList.add('hidden');
                            cat.style.animation = '';
                        }
                    });

                    var sectionEl = filterBar.closest('.menu-section');
                    if (sectionEl) {
                        var navH = 76;
                        var sTop = sectionEl.getBoundingClientRect().top + window.pageYOffset;
                        window.scrollTo({ top: Math.max(0, sTop - navH), behavior: 'smooth' });
                    }
                });
            });
        });
    }

    // --- Back to top button ---
    var backToTop = document.getElementById('backToTop');

    function handleBackToTop() {
        if (window.pageYOffset > 600) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', handleBackToTop, { passive: true });

    backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Fade-in animation keyframes ---
    var style = document.createElement('style');
    style.textContent = '@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);

    // --- Floating logo card: 3D tilt follows the mouse ---
    var logoCard = document.querySelector('.hero__logo-card');
    var heroSection = document.getElementById('hero');

    if (logoCard && heroSection && window.matchMedia('(pointer: fine)').matches) {
        var targetRX = 0, targetRY = 0, targetTX = 0, targetTY = 0;
        var curRX = 0, curRY = 0, curTX = 0, curTY = 0;

        heroSection.addEventListener('mousemove', function (e) {
            var r = heroSection.getBoundingClientRect();
            var px = (e.clientX - r.left) / r.width - 0.5;
            var py = (e.clientY - r.top) / r.height - 0.5;
            targetRY = px * 12;
            targetRX = -py * 9;
            targetTX = px * 12;
            targetTY = py * 9;
        });

        heroSection.addEventListener('mouseleave', function () {
            targetRX = 0;
            targetRY = 0;
            targetTX = 0;
            targetTY = 0;
        });

        (function floatLoop() {
            curRX += (targetRX - curRX) * 0.08;
            curRY += (targetRY - curRY) * 0.08;
            curTX += (targetTX - curTX) * 0.08;
            curTY += (targetTY - curTY) * 0.08;
            logoCard.style.transform =
                'perspective(900px) rotateX(' + curRX.toFixed(2) + 'deg) rotateY(' + curRY.toFixed(2) + 'deg)' +
                ' translate3d(' + curTX.toFixed(1) + 'px,' + curTY.toFixed(1) + 'px,0) scale(1.0225)';
            logoCard.style.boxShadow =
                (-curRY * 1.35).toFixed(1) + 'px ' + (curRX * 1.35 + 22).toFixed(1) + 'px 48px rgba(45,82,96,.20)';
            requestAnimationFrame(floatLoop);
        })();
    }

    // --- Expose callback for menu-renderer ---
    window.__menuReady = initFilters;

})();
