// scripts.js

// === AÇAR YOXLAMASI ===
if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_KEY === 'undefined' || SUPABASE_URL.includes('SİZİN_') || SUPABASE_URL.includes('[')) {
    console.error('XƏTA: Supabase açarları `env.js` faylında düzgün təyin edilməyib.');
}

// === SUPABASE CLIENT ===
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===================================
// 1. TEMA İDARƏETMƏSİ 🎨
// ===================================
function initTheme() {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let theme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const buttons = document.querySelectorAll('.theme-toggle');
    buttons.forEach(btn => {
        btn.innerHTML = theme === 'dark' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>';
    });
}

// ===================================
// 2. NAVİQASİYA 📍
// ===================================
function highlightActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(link => {
        const href = link.getAttribute('href');
        
        if (href === currentPage && !link.classList.contains('font-bold')) {
            link.classList.remove('text-light-muted', 'dark:text-dark-muted');
            link.classList.add('text-brand-DEFAULT', 'dark:text-brand-light', 'font-medium');
        } else {
            link.classList.add('text-light-muted', 'dark:text-dark-muted');
            link.classList.remove('text-brand-DEFAULT', 'dark:text-brand-light');
        }
    });
}

// ===================================
// 3. TƏDBİRLƏRİN YÜKLƏNMƏSİ 🗓️
// ===================================
async function loadEvents() {
    const eventsContainer = document.getElementById('events-list-container');
    const eventSelect = document.getElementById('event-select');

    if (!eventsContainer || !eventSelect) return;

    try {
        const { data: events, error } = await supabaseClient
            .from('events')
            .select('*')
            .order('title', { ascending: true }); // DÜZƏLDİLDİ

        if (error) throw error;

        eventsContainer.innerHTML = '';

        if (!events || events.length === 0) {
            eventsContainer.innerHTML =
                '<p class="text-slate-600 dark:text-slate-400 col-span-2 text-center">Hazırda aktiv tədbir yoxdur.</p>';
            eventSelect.disabled = true;
            eventSelect.options[0].text = 'Hazırda tədbir yoxdur';
            return;
        }

        events.forEach(event => {
            const eventCardHTML = `
                <div class="bg-white dark:bg-dark-card p-8 rounded-2xl border border-slate-200 dark:border-white/5 hover:shadow-lg transition-all">
                    <div class="text-sm font-bold text-brand-DEFAULT mb-2">${event.date_time || 'Tarix açıqlanmayıb'}</div>
                    <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-3">${event.title}</h3>
                    <p class="text-slate-600 dark:text-slate-300 mb-6">${event.description || 'Açıqlama yoxdur.'}</p>
                    <a href="#register" class="text-brand-DEFAULT font-semibold hover:underline">Qeydiyyatdan Keç →</a>
                </div>
            `;
            eventsContainer.insertAdjacentHTML('beforeend', eventCardHTML);

            const option = new Option(event.title, event.title);
            eventSelect.add(option);
        });

    } catch (error) {
        console.error('Tədbir xətası:', error.message);
        eventsContainer.innerHTML =
            `<p class="text-red-500 col-span-2 text-center">Xəta: ${error.message}</p>`;
    }
}

// ===================================
// 4. QEYDİYYAT FORMASI 📝
// ===================================
async function initRegistrationForm() {
    const form = document.getElementById('registrationForm');
    const messageDiv = document.getElementById('formMessage');

    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const button = form.querySelector('button[type="submit"]');

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        button.disabled = true;
        button.textContent = 'Göndərilir...';

        const formData = new FormData(form);

        try {
            const { error } = await supabaseClient
                .from('registrations')
                .insert([
                    {
                        full_name: formData.get('Ad Soyad'),
                        group_number: formData.get('Qrup Nömrəsi'),
                        selected_event: formData.get('Tədbir')
                    }
                ]);

            if (error) throw error;

            messageDiv.textContent = 'Qeydiyyat uğurla tamamlandı!';
            messageDiv.className = 'mt-4 p-4 rounded-lg bg-green-500/10 text-green-600 block font-medium';
            form.reset();

        } catch (error) {
            console.error('Qeydiyyat xətası:', error.message);
            messageDiv.textContent = 'Xəta baş verdi. Yenidən cəhd edin.';
            messageDiv.className = 'mt-4 p-4 rounded-lg bg-red-500/10 text-red-600 block font-medium';
        } finally {
            button.disabled = false;
            button.textContent = 'Qeydiyyatdan Keç';
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
        }
    });
}

// ===================================
// BÜTÜN FUNKSİYALARI İŞƏ SALMA 🚀
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    initRegistrationForm();
    initTheme();
    highlightActiveLink();

    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });
});
