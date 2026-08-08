(function () {
    'use strict';

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderItem(item) {
        var classes = 'menu-item';
        if (item.badge) classes += ' menu-item--new';
        if (item.special) classes += ' menu-item--special';

        var badgeHtml = '';
        if (item.badge === 'new') badgeHtml = '<span class="badge badge--new">NEW</span> ';
        if (item.badge === 'top') badgeHtml = '<span class="badge badge--top">TOP</span> ';

        var descHtml = item.desc ? '<p class="menu-item__desc">' + escapeHtml(item.desc) + '</p>' : '';

        var priceHtml = item.price ? '<span class="menu-item__price">' + escapeHtml(item.price) + '</span>' : '';
        var weightHtml = item.weight ? '<span class="menu-item__weight">' + escapeHtml(item.weight) + '</span>' : '';
        var metaHtml = (weightHtml) ? '<div class="menu-item__meta">' + weightHtml + '</div>' : '';

        return '<div class="' + classes + '">' +
            '<div class="menu-item__header">' +
                '<span class="menu-item__name">' + badgeHtml + escapeHtml(item.name) + '</span>' +
                priceHtml +
            '</div>' +
            descHtml +
            metaHtml +
        '</div>';
    }

    function renderCategory(cat) {
        var noteHtml = '';
        if (cat.note) {
            noteHtml = '<p class="category-note">' + cat.note + '</p>';
        }
        if (cat.noteBar) {
            noteHtml = '<div class="category-note-bar">' + cat.noteBar + '</div>';
        }

        var itemsHtml = '';

        if (cat.subheadings) {
            cat.subheadings.forEach(function (sub) {
                itemsHtml += '<div class="beer-subheading">' + escapeHtml(sub.label) + '</div>';
                itemsHtml += '<div class="category-items">';
                sub.items.forEach(function (item) {
                    itemsHtml += renderItem(item);
                });
                itemsHtml += '</div>';
            });
        } else {
            itemsHtml += '<div class="category-items">';
            cat.items.forEach(function (item) {
                itemsHtml += renderItem(item);
            });
            itemsHtml += '</div>';
        }

        return '<div class="menu-category" data-category="' + cat.id + '">' +
            '<h3 class="category-title">' + cat.title + '</h3>' +
            noteHtml +
            itemsHtml +
        '</div>';
    }

    function renderSection(sectionKey, gridId) {
        var data = window.__menuData[sectionKey];
        if (!data) return;

        var grid = document.getElementById(gridId);
        if (!grid) return;

        var html = '';
        data.categories.forEach(function (cat) {
            html += renderCategory(cat);
        });
        grid.innerHTML = html;
    }

    function init() {
        fetch('data/menu.json')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                window.__menuData = data;
                renderSection('food', 'food-grid');
                renderSection('bar', 'bar-grid');

                if (window.__menuReady) window.__menuReady();
            })
            .catch(function (err) {
                console.error('Menu load error:', err);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
