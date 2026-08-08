(function () {
    'use strict';

    // Configuration
    var CONFIG = {
        login: 'tiffany-menu',
        password: 'tiffanyadmin',
        repo: 'CONCLAVER/Tiffany-Menu',
        branch: 'main',
        filePath: 'data/menu.json',
        sessionDuration: 24 * 60 * 60 * 1000 // 24 hours
    };

    // State
    var menuData = null;
    var currentSection = 'food';
    var currentEditItem = null;
    var currentDeleteItem = null;
    var hasChanges = false;
    var githubToken = localStorage.getItem('github_token') || '';
    var fileSha = '';

    // GitHub API
    var GITHUB_API = 'https://api.github.com/repos/' + CONFIG.repo + '/contents/' + CONFIG.filePath;

    // Initialize
    document.addEventListener('DOMContentLoaded', function () {
        checkAuth();
        setupLoginForm();
    });

    // Authentication
    function checkAuth() {
        var sessionTime = localStorage.getItem('admin_session_time');
        var isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';

        if (isLoggedIn && sessionTime) {
            var elapsed = Date.now() - parseInt(sessionTime);
            if (elapsed < CONFIG.sessionDuration) {
                showAdminPanel();
                loadMenu();
                return;
            }
        }

        showLogin();
    }

    function setupLoginForm() {
        var form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var login = document.getElementById('loginInput').value;
            var password = document.getElementById('passwordInput').value;

            if (login === CONFIG.login && password === CONFIG.password) {
                localStorage.setItem('admin_logged_in', 'true');
                localStorage.setItem('admin_session_time', Date.now().toString());
                showAdminPanel();
                loadMenu();
            } else {
                document.getElementById('loginError').style.display = 'block';
            }
        });
    }

    function showLogin() {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    }

    function showAdminPanel() {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        updateTokenButton();
    }

    window.logout = function () {
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_session_time');
        showLogin();
    };

    // Token Management
    window.showTokenSetup = function () {
        document.getElementById('tokenOverlay').style.display = 'flex';
        document.getElementById('tokenInput').value = githubToken;
    };

    window.cancelTokenSetup = function () {
        document.getElementById('tokenOverlay').style.display = 'none';
    };

    window.saveToken = function () {
        var token = document.getElementById('tokenInput').value.trim();
        if (!token) {
            showTokenError('Введите токен');
            return;
        }

        githubToken = token;
        localStorage.setItem('github_token', token);
        document.getElementById('tokenOverlay').style.display = 'none';
        updateTokenButton();
        showToast('Token сохранён', 'success');
    };

    function showTokenError(msg) {
        document.getElementById('tokenError').textContent = msg;
    }

    function updateTokenButton() {
        var btn = document.getElementById('tokenBtn');
        var text = document.getElementById('tokenBtnText');
        if (githubToken) {
            btn.classList.add('token-active');
            if (text) text.textContent = 'Token ✓';
            btn.title = 'Token настроен';
        } else {
            btn.classList.remove('token-active');
            if (text) text.textContent = 'Token';
            btn.title = 'Настроить GitHub Token';
        }
    }

    // Load Menu from GitHub
    function loadMenu() {
        var loading = document.getElementById('loading');
        var container = document.getElementById('categoriesContainer');

        loading.style.display = 'block';
        container.style.display = 'none';

        if (!githubToken) {
            loading.style.display = 'none';
            container.style.display = 'block';
            container.innerHTML = '<div class="empty-state"><p>Настройте GitHub Token для загрузки меню</p><button class="btn btn-primary" onclick="showTokenSetup()">Настроить Token</button></div>';
            return;
        }

        fetch(GITHUB_API, {
            headers: {
                'Authorization': 'token ' + githubToken,
                'Accept': 'application/vnd.github.v3+json'
            }
        })
        .then(function (r) {
            if (!r.ok) throw new Error('Ошибка загрузки: ' + r.status);
            return r.json();
        })
        .then(function (data) {
            fileSha = data.sha;
            var bytes = Uint8Array.from(atob(data.content), function (c) { return c.charCodeAt(0); });
            var content = new TextDecoder('utf-8').decode(bytes);
            menuData = JSON.parse(content);
            renderCategories();
            loading.style.display = 'none';
            container.style.display = 'block';
        })
        .catch(function (err) {
            loading.style.display = 'none';
            container.style.display = 'block';
            container.innerHTML = '<div class="empty-state"><p>Ошибка загрузки: ' + err.message + '</p><button class="btn btn-primary" onclick="loadMenu()">Повторить</button></div>';
        });
    }

    window.loadMenu = loadMenu;

    // Render Categories
    function renderCategories() {
        var container = document.getElementById('categoriesContainer');
        var section = menuData[currentSection];

        if (!section || !section.categories) {
            container.innerHTML = '<div class="empty-state"><p>Нет данных для этой секции</p></div>';
            return;
        }

        // Update counts
        var foodCount = menuData.food ? menuData.food.categories.reduce(function (sum, cat) {
            return sum + (cat.items ? cat.items.length : 0);
        }, 0) : 0;

        var barCount = menuData.bar ? menuData.bar.categories.reduce(function (sum, cat) {
            if (cat.subheadings) {
                return sum + cat.subheadings.reduce(function (s, sub) {
                    return s + (sub.items ? sub.items.length : 0);
                }, 0);
            }
            return sum + (cat.items ? cat.items.length : 0);
        }, 0) : 0;

        document.getElementById('foodCount').textContent = foodCount;
        document.getElementById('barCount').textContent = barCount;

        var html = '';
        section.categories.forEach(function (cat, catIndex) {
            html += renderCategoryCard(cat, catIndex);
        });

        container.innerHTML = html;
    }

    function renderCategoryCard(cat, catIndex) {
        var noteHtml = '';
        if (cat.note) noteHtml = '<div class="category-note">' + cat.note + '</div>';
        if (cat.noteBar) noteHtml = '<div class="category-note">' + cat.noteBar + '</div>';

        var itemsHtml = '';
        if (cat.subheadings) {
            cat.subheadings.forEach(function (sub, subIndex) {
                itemsHtml += '<div class="beer-subheading">' + escapeHtml(sub.label) + '</div>';
                sub.items.forEach(function (item, itemIndex) {
                    itemsHtml += renderItemRow(catIndex, itemIndex, item, subIndex);
                });
            });
        } else if (cat.items) {
            cat.items.forEach(function (item, itemIndex) {
                itemsHtml += renderItemRow(catIndex, itemIndex, item);
            });
        }

        return '<div class="category-card">' +
            '<div class="category-header">' +
                '<div>' +
                    '<h2 class="category-title">' + cat.title + '</h2>' +
                    noteHtml +
                '</div>' +
                '<div class="category-actions">' +
                    '<button class="btn-icon add" onclick="addItem(' + catIndex + ')" title="Добавить позицию"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>' +
                '</div>' +
            '</div>' +
            '<div class="item-list">' + itemsHtml + '</div>' +
        '</div>';
    }

    function renderItemRow(catIndex, itemIndex, item, subIndex) {
        var badgeHtml = '';
        if (item.badge === 'new') badgeHtml = '<span class="badge badge-new">NEW</span>';
        if (item.badge === 'top') badgeHtml = '<span class="badge badge-top">TOP</span>';

        var infoIcon = item.info ? '<span class="info-icon" data-info="' + escapeHtml(item.info) + '"><svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M50 8A42 42 0 0 0 8 50a42 42 0 0 0 42 42h42V50A42 42 0 0 0 50 8Z"/><circle cx="50" cy="35" r="6" fill="currentColor" stroke="none"/><path d="M42 50h8v24"/></svg></span>' : '';

        var subAttr = subIndex !== undefined ? ' data-sub="' + subIndex + '"' : '';

        return '<div class="item-row">' +
            '<div class="item-name">' + badgeHtml + escapeHtml(item.name) + infoIcon + '</div>' +
            '<div class="item-price">' + escapeHtml(item.price || '') + '</div>' +
            '<div class="item-weight">' + escapeHtml(item.weight || '') + '</div>' +
            '<div class="item-actions">' +
                '<button class="btn-small btn-edit" onclick="editItem(' + catIndex + ',' + itemIndex + subAttr + ')" title="Редактировать"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>' +
                '<button class="btn-small btn-delete" onclick="deleteItem(' + catIndex + ',' + itemIndex + subAttr + ')" title="Удалить"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
            '</div>' +
        '</div>';
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Section Switching
    window.switchSection = function (section) {
        currentSection = section;

        document.querySelectorAll('.tab').forEach(function (tab) {
            tab.classList.toggle('active', tab.dataset.section === section);
        });

        renderCategories();
    };

    // CRUD Operations
    window.addItem = function (catIndex) {
        currentEditItem = { catIndex: catIndex, isNew: true };
        openEditModal();
    };

    window.editItem = function (catIndex, itemIndex, subIndex) {
        currentEditItem = { catIndex: catIndex, itemIndex: itemIndex };
        if (subIndex !== undefined) currentEditItem.subIndex = subIndex;

        var cat = menuData[currentSection].categories[catIndex];
        var item;

        if (cat.subheadings && subIndex !== undefined) {
            item = cat.subheadings[subIndex].items[itemIndex];
        } else {
            item = cat.items[itemIndex];
        }

        openEditModal(item);
    };

    function openEditModal(item) {
        var modal = document.getElementById('editModal');
        var title = document.getElementById('modalTitle');

        if (item) {
            title.textContent = 'Редактирование';
            document.getElementById('itemName').value = item.name || '';
            document.getElementById('itemPrice').value = item.price || '';
            document.getElementById('itemWeight').value = item.weight || '';
            document.getElementById('itemDesc').value = item.desc || '';
            document.getElementById('itemInfo').value = item.info || '';
            document.getElementById('badgeNew').checked = item.badge === 'new';
            document.getElementById('badgeTop').checked = item.badge === 'top';
        } else {
            title.textContent = 'Новая позиция';
            document.getElementById('editForm').reset();
        }

        modal.style.display = 'flex';
    }

    window.closeModal = function () {
        document.getElementById('editModal').style.display = 'none';
        currentEditItem = null;
    };

    window.saveItem = function (e) {
        e.preventDefault();

        if (!currentEditItem) return;

        var item = {
            name: document.getElementById('itemName').value.trim(),
            price: document.getElementById('itemPrice').value.trim(),
            weight: document.getElementById('itemWeight').value.trim(),
            desc: document.getElementById('itemDesc').value.trim(),
            info: document.getElementById('itemInfo').value.trim()
        };

        var badge = null;
        if (document.getElementById('badgeNew').checked) badge = 'new';
        if (document.getElementById('badgeTop').checked) badge = 'top';
        if (badge) item.badge = badge;

        // Remove empty fields
        Object.keys(item).forEach(function (key) {
            if (!item[key]) delete item[key];
        });

        var cat = menuData[currentSection].categories[currentEditItem.catIndex];

        if (currentEditItem.isNew) {
            if (cat.subheadings && currentEditItem.subIndex !== undefined) {
                if (!cat.subheadings[currentEditItem.subIndex].items) {
                    cat.subheadings[currentEditItem.subIndex].items = [];
                }
                cat.subheadings[currentEditItem.subIndex].items.push(item);
            } else {
                if (!cat.items) cat.items = [];
                cat.items.push(item);
            }
        } else {
            if (cat.subheadings && currentEditItem.subIndex !== undefined) {
                cat.subheadings[currentEditItem.subIndex].items[currentEditItem.itemIndex] = item;
            } else {
                cat.items[currentEditItem.itemIndex] = item;
            }
        }

        hasChanges = true;
        closeModal();
        renderCategories();
        showToast('Позиция сохранена', 'success');
    };

    window.deleteItem = function (catIndex, itemIndex, subIndex) {
        currentDeleteItem = { catIndex: catIndex, itemIndex: itemIndex };
        if (subIndex !== undefined) currentDeleteItem.subIndex = subIndex;

        var cat = menuData[currentSection].categories[catIndex];
        var item;

        if (cat.subheadings && subIndex !== undefined) {
            item = cat.subheadings[subIndex].items[itemIndex];
        } else {
            item = cat.items[itemIndex];
        }

        document.getElementById('deleteItemName').textContent = item.name;
        document.getElementById('deleteModal').style.display = 'flex';
    };

    window.closeDeleteModal = function () {
        document.getElementById('deleteModal').style.display = 'none';
        currentDeleteItem = null;
    };

    window.confirmDelete = function () {
        if (!currentDeleteItem) return;

        var cat = menuData[currentSection].categories[currentDeleteItem.catIndex];

        if (cat.subheadings && currentDeleteItem.subIndex !== undefined) {
            cat.subheadings[currentDeleteItem.subIndex].items.splice(currentDeleteItem.itemIndex, 1);
        } else {
            cat.items.splice(currentDeleteItem.itemIndex, 1);
        }

        hasChanges = true;
        closeDeleteModal();
        renderCategories();
        showToast('Позиция удалена', 'success');
    };

    // Save to GitHub
    window.saveAllChanges = function () {
        if (!menuData) return;

        if (!githubToken) {
            showTokenSetup();
            return;
        }

        var btn = document.getElementById('saveBtn');
        var btnText = document.getElementById('saveBtnText');
        btn.disabled = true;
        btnText.textContent = 'Сохранение...';

        var content = JSON.stringify(menuData, null, 2);
        var encoded = btoa(unescape(encodeURIComponent(content)));

        var body = {
            message: 'Update menu via admin panel',
            content: encoded,
            sha: fileSha
        };

        fetch(GITHUB_API, {
            method: 'PUT',
            headers: {
                'Authorization': 'token ' + githubToken,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        .then(function (r) {
            if (!r.ok) throw new Error('Ошибка сохранения: ' + r.status);
            return r.json();
        })
        .then(function (data) {
            fileSha = data.content.sha;
            hasChanges = false;
            btn.disabled = false;
            btnText.textContent = '💾 Сохранить';
            showToast('Изменения сохранены на GitHub', 'success');
        })
        .catch(function (err) {
            btn.disabled = false;
            btnText.textContent = '💾 Сохранить';
            showToast('Ошибка: ' + err.message, 'error');
        });
    };

    // Toast Notifications
    function showToast(message, type) {
        var toast = document.getElementById('toast');
        var icon = document.getElementById('toastIcon');
        var msg = document.getElementById('toastMessage');

        toast.className = 'toast ' + type;
        icon.textContent = type === 'success' ? '✓' : '✕';
        msg.textContent = message;
        toast.style.display = 'block';

        setTimeout(function () {
            toast.style.display = 'none';
        }, 3000);
    }

})();
