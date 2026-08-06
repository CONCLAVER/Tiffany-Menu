/* ========================================
   TIFFANY FOOD & DRINK — APP JS
   ======================================== */

(function () {
    'use strict';

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                var offset = 60; // nav height
                var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    // --- Sticky nav visibility ---
    var nav = document.getElementById('nav');
    var hero = document.getElementById('hero');
    var lastScroll = 0;

    function handleNavScroll() {
        var scrollY = window.pageYOffset;
        var heroBottom = hero.offsetTop + hero.offsetHeight;

        if (scrollY > heroBottom - 100) {
            nav.classList.add('visible');
        } else {
            nav.classList.remove('visible');
        }
        lastScroll = scrollY;
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });

    // --- Filter functionality ---
    document.querySelectorAll('.filters').forEach(function (filterBar) {
        var section = filterBar.dataset.section;
        var grid = section === 'food'
            ? document.getElementById('food-grid')
            : document.getElementById('bar-grid');
        var categories = grid.querySelectorAll('.menu-category');
        var buttons = filterBar.querySelectorAll('.filter-btn');

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                // Update active button
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
            });
        });
    });

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

    // --- Fade-in animation keyframes (injected) ---
    var style = document.createElement('style');
    style.textContent = '@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);

    // --- Floating logo card: 3D tilt follows the mouse ---
    var logoCard = document.querySelector('.hero__logo-card');
    var hero = document.getElementById('hero');

    if (logoCard && hero && window.matchMedia('(pointer: fine)').matches) {
        var targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;

        hero.addEventListener('mousemove', function (e) {
            var r = hero.getBoundingClientRect();
            var px = (e.clientX - r.left) / r.width - 0.5;
            var py = (e.clientY - r.top) / r.height - 0.5;
            targetRY = px * 10;
            targetRX = -py * 8;
        });

        hero.addEventListener('mouseleave', function () {
            targetRX = 0;
            targetRY = 0;
        });

        (function floatLoop() {
            curRX += (targetRX - curRX) * 0.06;
            curRY += (targetRY - curRY) * 0.06;
            logoCard.style.transform =
                'perspective(900px) rotateX(' + curRX.toFixed(2) + 'deg) rotateY(' + curRY.toFixed(2) + 'deg)';
            requestAnimationFrame(floatLoop);
        })();
    }

})();
