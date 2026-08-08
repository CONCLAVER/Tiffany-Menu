(function () {
    'use strict';

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function validateMenuData(data) {
        var errors = [];

        if (!data || typeof data !== 'object') {
            errors.push('Данные меню пустые или имеют неверный формат');
            return errors;
        }

        if (!data.food || !data.bar) {
            errors.push('Отсутствуют секции "food" или "bar"');
            return errors;
        }

        ['food', 'bar'].forEach(function (sectionKey) {
            var section = data[sectionKey];
            
            if (!section.categories || !Array.isArray(section.categories)) {
                errors.push('Секция "' + sectionKey + '" не содержит массив categories');
                return;
            }

            section.categories.forEach(function (cat, catIndex) {
                if (!cat.id) {
                    errors.push('Категория #' + (catIndex + 1) + ' в "' + sectionKey + '" не имеет id');
                }
                if (!cat.title) {
                    errors.push('Категория "' + cat.id + '" не имеет title');
                }
                
                var items = cat.items || (cat.subheadings ? [] : null);
                if (cat.subheadings && Array.isArray(cat.subheadings)) {
                    items = [];
                    cat.subheadings.forEach(function (sub) {
                        if (sub.items) items = items.concat(sub.items);
                    });
                }
                
                if (!items || !Array.isArray(items)) {
                    errors.push('Категория "' + cat.id + '" не имеет массив items');
                    return;
                }

                items.forEach(function (item, itemIndex) {
                    if (!item.name) {
                        errors.push('Позиция #' + (itemIndex + 1) + ' в "' + cat.id + '" не имеет name');
                    }
                    if (item.badge && item.badge !== 'new' && item.badge !== 'top') {
                        errors.push('Позиция "' + item.name + '" имеет невалидный badge: "' + item.badge + '" (должен быть "new" или "top")');
                    }
                });
            });
        });

        return errors;
    }

    function showError(message) {
        console.error('Menu error:', message);
        var foodGrid = document.getElementById('food-grid');
        var barGrid = document.getElementById('bar-grid');
        var errorHtml = '<div style="padding:40px;text-align:center;color:#999;"><p>Ошибка загрузки меню</p><p style="font-size:12px;margin-top:8px;">' + escapeHtml(message) + '</p></div>';
        if (foodGrid) foodGrid.innerHTML = errorHtml;
        if (barGrid) barGrid.innerHTML = '';
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
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + r.statusText);
                return r.json();
            })
            .then(function (data) {
                var errors = validateMenuData(data);
                if (errors.length > 0) {
                    showError('Невалидная структура меню: ' + errors[0]);
                    return;
                }

                window.__menuData = data;
                renderSection('food', 'food-grid');
                renderSection('bar', 'bar-grid');

                if (window.__menuReady) window.__menuReady();
            })
            .catch(function (err) {
                showError('Не удалось загрузить меню: ' + err.message);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
