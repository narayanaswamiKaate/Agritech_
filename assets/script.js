document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentLanguage = localStorage.getItem('agrizen_lang') || 'en';

    // Set initial select values
    const desktopLangSelect = document.getElementById('desktop-lang');
    const mobileLangSelect = document.getElementById('mobile-lang');
    const chatbotLangSelect = document.getElementById('chatbot-lang');
    
    if(desktopLangSelect) desktopLangSelect.value = currentLanguage;
    if(mobileLangSelect) mobileLangSelect.value = currentLanguage;
    if(chatbotLangSelect) chatbotLangSelect.value = currentLanguage;

    function translatePage(lang) {
        currentLanguage = lang;
        localStorage.setItem('agrizen_lang', lang);

        // Update selects to match
        if(desktopLangSelect) desktopLangSelect.value = lang;
        if(mobileLangSelect) mobileLangSelect.value = lang;
        if(chatbotLangSelect) chatbotLangSelect.value = lang;

        const translations = window.AgrizenTranslations.static[lang] || window.AgrizenTranslations.static['en'];

        // Update static DOM elements
        document.querySelectorAll('[data-tr]').forEach(el => {
            const key = el.getAttribute('data-tr');
            if (translations[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    // For placeholders
                    if (key.endsWith('_ph') || key.endsWith('_placeholder') || key.includes('placeholder')) {
                        el.placeholder = translations[key];
                    } else {
                        el.value = translations[key];
                    }
                } else if (el.tagName === 'OPTION') {
                    el.textContent = translations[key];
                } else {
                    el.innerHTML = translations[key]; // Some translations contain span tags
                }
            }
        });

        // Re-render dynamic components
        renderProducts(lang);
        renderNews(lang);
        renderFAQs(lang);

        // Sync chatbot UI text and suggestions
        const titleEl = document.getElementById('faq-suggestions-title');
        if (titleEl && window.AgrizenTranslations.chatbot[lang]) {
            titleEl.textContent = window.AgrizenTranslations.chatbot[lang].suggestionsTitle;
        }
        if (chatbotMessages && chatbotMessages.children.length > 0) {
            chatbotMessages.innerHTML = '';
            addMessage(window.AgrizenTranslations.chatbot[lang].welcome, 'bot');
            addQuickActions();
        }
        renderSmartFAQs();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    if(desktopLangSelect) desktopLangSelect.addEventListener('change', (e) => translatePage(e.target.value));
    if(mobileLangSelect) mobileLangSelect.addEventListener('change', (e) => translatePage(e.target.value));

    // --- Navbar (hidden on load → slides in on scroll) ---
    const nav          = document.getElementById('main-nav');
    const navBarInner  = document.querySelector('.nav-bar-inner');
    const navLinkTexts = document.querySelectorAll('.nav-link-text');
    const mobileMenu   = document.getElementById('mobile-menu');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    let mobileMenuOpen = false;
    let navRevealed    = false;

    function showNav() {
        if (!navRevealed) {
            nav.classList.remove('nav-hidden');
            nav.classList.add('nav-visible');
            navRevealed = true;
        }
    }

    function updateNavStyle(scrolled) {
        if (scrolled) {
            // Solid white frosted glass
            navBarInner.style.background    = 'rgba(255,255,255,0.97)';
            navBarInner.style.boxShadow     = '0 2px 28px 0 rgba(0,0,0,0.10)';
            navBarInner.style.borderBottom  = '1px solid rgba(0,0,0,0.06)';
            navBarInner.style.backdropFilter = 'blur(24px)';
            navLinkTexts.forEach(el => {
                el.classList.remove('text-white/90', 'group-hover:text-agri-green-400');
                el.classList.add('text-slate-700', 'group-hover:text-agri-green-600');
            });
            const mobileToggle = document.getElementById('mobile-menu-toggle');
            if (mobileToggle) {
                mobileToggle.classList.remove('text-white', 'bg-white/10', 'border-white/20');
                mobileToggle.classList.add('text-slate-700', 'bg-slate-100', 'border-slate-200');
            }
            if (desktopLangSelect) {
                desktopLangSelect.classList.remove('text-white', 'bg-white/10', 'border-white/20');
                desktopLangSelect.classList.add('text-slate-700', 'bg-slate-100', 'border-slate-200');
            }
        } else {
            // Transparent — over video
            navBarInner.style.background    = 'transparent';
            navBarInner.style.boxShadow     = 'none';
            navBarInner.style.borderBottom  = 'none';
            navBarInner.style.backdropFilter = 'none';
            navLinkTexts.forEach(el => {
                el.classList.remove('text-slate-700', 'group-hover:text-agri-green-600');
                el.classList.add('text-white/90', 'group-hover:text-agri-green-400');
            });
            const mobileToggle = document.getElementById('mobile-menu-toggle');
            if (mobileToggle) {
                mobileToggle.classList.add('text-white', 'bg-white/10', 'border-white/20');
                mobileToggle.classList.remove('text-slate-700', 'bg-slate-100', 'border-slate-200');
            }
            if (desktopLangSelect) {
                desktopLangSelect.classList.add('text-white', 'bg-white/10', 'border-white/20');
                desktopLangSelect.classList.remove('text-slate-700', 'bg-slate-100', 'border-slate-200');
            }
        }
    }

    window.addEventListener('scroll', () => {
        const sy = window.scrollY;
        // Reveal navbar as soon as user starts scrolling
        if (sy > 10) showNav();
        // Switch style
        updateNavStyle(sy > 80);
    });

    // Also reveal navbar when mouse moves near top of screen (cursor hover)
    document.addEventListener('mousemove', (e) => {
        if (e.clientY < 80 && !navRevealed) showNav();
    });

    // --- Hero Video: Mute / Unmute ---
    const heroVideo   = document.getElementById('hero-video');
    const mutBtn      = document.getElementById('hero-mute-btn');
    const muteIcon    = document.getElementById('mute-icon');
    let videoMuted    = true; // starts muted (autoplay requirement)

    if (mutBtn && heroVideo) {
        mutBtn.addEventListener('click', () => {
            videoMuted = !videoMuted;
            heroVideo.muted = videoMuted;
            // Swap icon
            muteIcon.setAttribute('data-lucide', videoMuted ? 'volume-x' : 'volume-2');
            lucide.createIcons();
            // Visual pulse feedback
            mutBtn.style.transform = 'scale(1.15)';
            setTimeout(() => { mutBtn.style.transform = ''; }, 200);
        });
    }

    function closeMobileMenu() {
        mobileMenuOpen = false;
        mobileMenu.classList.remove('active');
        const icon = mobileMenuToggle.querySelector('i');
        icon.setAttribute('data-lucide', 'menu');
        lucide.createIcons();
    }

    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuOpen = !mobileMenuOpen;
        const icon = mobileMenuToggle.querySelector('i');
        if (mobileMenuOpen) {
            mobileMenu.classList.add('active');
            icon.setAttribute('data-lucide', 'x');
        } else {
            mobileMenu.classList.remove('active');
            icon.setAttribute('data-lucide', 'menu');
        }
        lucide.createIcons();
    });

    // Close mobile menu on link click
    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // --- Modal ---
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalButtons = document.querySelectorAll('.close-modal');

    function openModal(title, content) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeModalButtons.forEach(btn => btn.addEventListener('click', closeModal));
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // --- Render Products ---
    const productGrid = document.getElementById('product-grid');
    function renderProducts(lang) {
        productGrid.innerHTML = '';
        const rawProducts = window.AgrizenTranslations.products || [];
        const products = rawProducts.map(p => {
            const getField = (field) => {
                if (!field) return '';
                return field[lang] || field['en'] || '';
            };
            const getArrayField = (field) => {
                if (!field) return [];
                return field[lang] || field['en'] || [];
            };
            return {
                title: getField(p.title),
                subtitle: getField(p.subtitle),
                type: getField(p.type),
                category: getField(p.category),
                description: getField(p.description),
                benefits: getArrayField(p.benefits),
                crops: getField(p.recommendedCrops || p.crops),
                dosage: getField(p.dosage),
                sizes: getField(p.packSizes || p.sizes),
                colorClass: p.colorClass || 'bg-agri-green-500',
                img: p.img || ''
            };
        });
        
        const localLangs = {
            en: {
                productInfo: "Product Information",
                recCrops: "Recommended Crops:",
                dosageApp: "Dosage & Application:",
                packSizes: "Available Pack Sizes:",
                keyBenefits: "Key Benefits",
                productDetails: "Product Details"
            },
            hi: {
                productInfo: "उत्पाद जानकारी",
                recCrops: "अनुशंसित फसलें:",
                dosageApp: "मात्रा और छिड़काव:",
                packSizes: "उपलब्ध पैक आकार:",
                keyBenefits: "मुख्य लाभ",
                productDetails: "उत्पाद विवरण"
            },
            te: {
                productInfo: "ఉత్పత్తి సమాచారం",
                recCrops: "సిఫార్సు చేయబడిన పంటలు:",
                dosageApp: "మోతాదు & అప్లికేషన్:",
                packSizes: "అందుబాటులో ఉన్న ప్యాక్ పరిమాణాలు:",
                keyBenefits: "ముఖ్య ప్రయోజనాలు",
                productDetails: "ఉత్పత్తి వివరాలు"
            },
            ta: {
                productInfo: "தயாரிப்பு தகவல்",
                recCrops: "பரிந்துரைக்கப்படும் பயிர்கள்:",
                dosageApp: "அளவு மற்றும் பயன்பாடு:",
                packSizes: "கிடைக்கும் பேக் அளவுகள்:",
                keyBenefits: "முக்கிய நன்மைகள்",
                productDetails: "தயாரிப்பு விவரங்கள்"
            }
        };
        const dict = localLangs[lang] || localLangs['en'];

        products.forEach((product, i) => {
            const item = document.createElement('div');
            item.className = `reveal flex flex-col ${i % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 lg:gap-32 items-center`;

            const benefitsHtml = product.benefits.map(b => `
                <div class="px-6 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-600 border border-slate-200">
                    ${b}
                </div>
            `).join('');

            item.innerHTML = `
                <div class="lg:w-1/2 relative group w-full">
                    <div class="absolute -inset-4 ${product.colorClass} opacity-10 rounded-[3rem] -z-10 transform scale-95 group-hover:scale-100 transition-transform duration-700"></div>
                    <div class="rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-50 border border-slate-100 p-6 sm:p-8 lg:p-12 flex justify-center items-center aspect-square lg:aspect-[4/3]">
                        <img src="${product.img}" alt="${product.title}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000 drop-shadow-2xl">
                    </div>
                    <div class="absolute top-4 left-4 sm:top-10 sm:left-10 bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-xl">
                        <span class="text-agri-dark font-black uppercase tracking-widest text-[10px]">${product.type}</span>
                    </div>
                </div>

                <div class="lg:w-1/2 w-full text-left">
                    <div class="mb-10">
                        <h3 class="text-4xl lg:text-6xl font-black text-agri-dark mb-4 leading-none">${product.title}</h3>
                        <div class="w-20 h-1.5 ${product.colorClass}"></div>
                        <p class="text-agri-green-600 font-bold uppercase tracking-[0.4em] text-[10px] mt-6">${product.subtitle}</p>
                    </div>
                    
                    <p class="text-slate-500 text-lg leading-relaxed mb-12 max-w-xl">
                        ${product.description}
                    </p>

                    <div class="flex flex-wrap gap-4 mb-12 justify-start">
                        ${benefitsHtml}
                    </div>

                    <button class="product-info-btn bg-agri-dark text-white px-6 py-4 sm:px-10 sm:py-5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-agri-green-600 transition-all flex items-center gap-3 group/btn inline-flex" data-index="${i}">
                        ${dict.productInfo} <i data-lucide="arrow-right" class="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"></i>
                    </button>
                </div>
            `;
            const btn = item.querySelector('.product-info-btn');
            btn.addEventListener('click', () => {
                const content = `
                    <div class="space-y-6">
                        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 border-b border-slate-100 pb-6 text-center sm:text-left">
                            <div class="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 p-2 shrink-0 flex items-center justify-center">
                                <img src="${product.img}" alt="${product.title}" class="w-full h-full object-contain drop-shadow-md">
                            </div>
                            <div class="flex flex-col items-center sm:items-start">
                                <h4 class="text-2xl font-black text-agri-dark uppercase tracking-tight">${product.title}</h4>
                                <p class="text-agri-green-600 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">${product.subtitle}</p>
                                <span class="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 mt-2 border border-slate-200">${product.category}</span>
                            </div>
                        </div>
                        <p class="text-slate-600 leading-relaxed text-sm">
                            ${product.description}
                        </p>
                        
                        ${product.recommendedCrops || product.dosage || product.packSizes ? `
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                            ${product.recommendedCrops ? `<div><span class="font-bold text-agri-dark text-sm">${dict.recCrops}</span> <span class="text-slate-600 text-sm">${product.recommendedCrops}</span></div>` : ''}
                            ${product.dosage ? `<div><span class="font-bold text-agri-dark text-sm">${dict.dosageApp}</span> <span class="text-slate-600 text-sm">${product.dosage}</span></div>` : ''}
                            ${product.packSizes ? `<div><span class="font-bold text-agri-dark text-sm">${dict.packSizes}</span> <span class="text-slate-600 text-sm">${product.packSizes}</span></div>` : ''}
                        </div>` : ''}

                        <div>
                            <h5 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">${dict.keyBenefits}</h5>
                            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                ${product.benefits.map(b => `<li class="flex items-center gap-2 text-sm text-slate-600"><i data-lucide="check-circle-2" class="w-4 h-4 text-agri-green-500 shrink-0"></i> ${b}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;
                openModal(dict.productDetails, content);
                if (window.lucide) window.lucide.createIcons();
            });

            productGrid.appendChild(item);
        });
    }

    // --- Render News ---
    const newsGrid = document.getElementById('news-grid');
    function renderNews(lang) {
        newsGrid.innerHTML = '';
        const rawNews = window.AgrizenTranslations.news || [];
        const news = rawNews.map(n => {
            const getField = (field) => {
                if (!field) return '';
                return field[lang] || field['en'] || '';
            };
            return {
                title: getField(n.title),
                desc: getField(n.desc),
                date: getField(n.date),
                img: n.img || ''
            };
        });
        
        const localLangsNews = {
            en: {
                readArticle: "Read Article",
                body: "Hyderabad, India — Agrizen Crop Care Group continues its mission to provide sustainable agricultural solutions. Our latest initiative involves a nation-wide series of training modules and technological upgrades for distribution partners.",
                newsUpdate: "Agrizen News Update"
            },
            hi: {
                readArticle: "लेख पढ़ें",
                body: "हैदराबाद, भारत — एग्रीज़ेन क्रॉप केयर ग्रुप टिकाऊ कृषि समाधान प्रदान करने के अपने मिशन को जारी रखे हुए है। हमारी नवीनतम पहल में वितरण भागीदारों के लिए देशव्यापी प्रशिक्षण मॉड्यूल और तकनीकी उन्नयन की श्रृंखला शामिल है।",
                newsUpdate: "एग्रीजेन समाचार अपडेट"
            },
            te: {
                readArticle: "వ్యాసం చదవండి",
                body: "హైదరాబాద్, ఇండియా — అగ్రిజెన్ క్రాప్ కేర్ గ్రూప్ సుస్థిర వ్యవసాయ పరిష్కారాలను అందించే తన లక్ష్యాన్ని కొనసాగిస్తోంది. మా తాజా చొరవలో పంపిణీ భాగస్వాముల కోసం దేశవ్యాప్త శిక్షణ మాడ్యూల్స్ మరియు సాంకేతిక నవీకరణల శ్రేణి ఉంటుంది.",
                newsUpdate: "అగ్రిజెన్ వార్తల అప్‌డేట్"
            },
            ta: {
                readArticle: "கட்டுரை வாசிக்க",
                body: "ஹைதராபாத், இந்தியா — அக்ரிஜென் கிராப் கேர் குரூப் நிலையான விவசாய தீர்வுகளை வழங்குவதற்கான தனது பணியைத் தொடர்கிறது. எங்கள் சமீபத்திய முயற்சியில் விநியோக கூட்டாளர்களுக்கு நாடு தழுவிய அளவிலான பயிற்சி தொகுதிகள் மற்றும் தொழில்நுட்ப மேம்பாடுகள் ஆகியவை அடங்கும்.",
                newsUpdate: "அக்ரிஜென் செய்திகள் புதுப்பிப்பு"
            }
        };
        const dict = localLangsNews[lang] || localLangsNews['en'];

        news.forEach((item, i) => {
            const newsItem = document.createElement('div');
            newsItem.className = 'reveal group relative flex flex-col lg:flex-row items-center gap-6 md:gap-12 bg-white p-6 md:p-12 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0';
            newsItem.innerHTML = `
                <div class="lg:w-1/4 shrink-0 overflow-hidden rounded-2xl relative aspect-square w-full">
                    <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 bg-slate-100">
                    <div class="absolute inset-0 bg-agri-green-500/10 group-hover:bg-transparent transition-colors"></div>
                </div>

                <div class="lg:w-2/4 w-full">
                    <div class="text-agri-green-600 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-3">
                        <div class="w-8 h-px bg-current"></div>
                        ${item.date}
                    </div>
                    <h3 class="text-2xl md:text-3xl font-black text-agri-dark group-hover:text-agri-green-600 transition-colors mb-4 leading-tight uppercase tracking-tight">${item.title}</h3>
                    <p class="text-slate-400 text-sm max-w-lg leading-relaxed">${item.desc}</p>
                </div>

                <div class="lg:w-1/4 w-full flex justify-start lg:justify-end items-center">
                    <div class="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] lg:transform lg:translate-x-4 lg:opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                        ${dict.readArticle} <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </div>
                </div>
            `;
            newsItem.addEventListener('click', () => {
                const content = `
                    <div class="space-y-6">
                        <div class="text-agri-green-600 font-black uppercase tracking-widest text-xs">${item.date}</div>
                        <h2 class="text-3xl font-black text-agri-dark uppercase leading-tight">${item.title}</h2>
                        <p class="text-slate-600 leading-relaxed text-lg italic border-l-4 border-agri-green-500 pl-6 py-2">
                            ${item.desc}
                        </p>
                        <p class="text-slate-500 leading-relaxed">
                            ${dict.body}
                        </p>
                        <div class="aspect-video rounded-2xl overflow-hidden bg-slate-100">
                            <img src="${item.img}" class="w-full h-full object-cover" alt="News">
                        </div>
                    </div>
                `;
                openModal(dict.newsUpdate, content);
            });
            newsGrid.appendChild(newsItem);
        });
    }

    // --- Render FAQ ---
    const faqContainer = document.getElementById('faq-container');
    function renderFAQs(lang) {
        faqContainer.innerHTML = '';
        const rawFaqs = window.AgrizenTranslations.faqs || [];
        const faqs = rawFaqs.map(f => {
            const getField = (field) => {
                if (!field) return '';
                return field[lang] || field['en'] || '';
            };
            return {
                q: getField(f.q),
                a: getField(f.a)
            };
        });
        faqs.forEach((faq, i) => {
            const item = document.createElement('div');
            item.className = 'border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white transition-all duration-300 faq-item';
            item.innerHTML = `
                <button class="faq-toggle w-full p-6 text-left flex justify-between items-center bg-transparent hover:bg-slate-50 transition-colors group">
                    <span class="font-bold text-agri-dark pr-8 text-lg group-hover:text-agri-green-600 transition-colors">${faq.q}</span>
                    <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-agri-green-50 transition-colors">
                        <i data-lucide="chevron-down" class="w-4 h-4 text-agri-green-600 transition-transform duration-300 faq-icon"></i>
                    </div>
                </button>
                <div class="faq-content grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 bg-slate-50/50">
                    <div class="overflow-hidden">
                        <div class="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100/50 mt-2">
                            <div class="pt-4 text-[15px]">${faq.a}</div>
                        </div>
                    </div>
                </div>
            `;
            const btn = item.querySelector('.faq-toggle');
            const content = item.querySelector('.faq-content');
            const icon = item.querySelector('.faq-icon');

            btn.addEventListener('click', () => {
                const isOpen = content.classList.contains('grid-rows-[1fr]');

                // Close others
                document.querySelectorAll('.faq-content').forEach(c => {
                    c.classList.remove('grid-rows-[1fr]');
                    c.classList.add('grid-rows-[0fr]');
                });
                document.querySelectorAll('.faq-icon').forEach(i => {
                    i.style.transform = 'rotate(0deg)';
                });
                document.querySelectorAll('.faq-item').forEach(el => {
                    el.classList.remove('shadow-md', 'border-agri-green-500/30');
                });

                if (!isOpen) {
                    content.classList.remove('grid-rows-[0fr]');
                    content.classList.add('grid-rows-[1fr]');
                    icon.style.transform = 'rotate(180deg)';
                    item.classList.add('shadow-md', 'border-agri-green-500/30');
                }
            });
            faqContainer.appendChild(item);
        });

        // Initialize the first FAQ
        const firstFaq = faqContainer.querySelector('.faq-toggle');
        if (firstFaq) setTimeout(() => firstFaq.click(), 100);
    }

    // --- Scroll Reveal ---
    function reveal() {
        const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
        for (let i = 0; i < reveals.length; i++) {
            const windowHeight = window.innerHeight;
            const elementTop = reveals[i].getBoundingClientRect().top;
            const elementVisible = 150;
            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add('active');
            }
        }
    }
    window.addEventListener('scroll', reveal);
    reveal(); // Initial check



    document.querySelectorAll('.video-play-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = currentLanguage;
            const playText = lang === 'hi' ? "चलाने के लिए क्लिक करें" : lang === 'te' ? "ప్లే చేయడానికి క్లిక్ చేయండి" : lang === 'ta' ? "இயக்க கிளிக் செய்யவும்" : "Click to Play Media";
            const showcaseTitle = lang === 'hi' ? "कॉर्पोरेट शोकेस" : lang === 'te' ? "కార్పొరేట్ ప్రదర్శన" : lang === 'ta' ? "கார்ப்பரேட் காட்சி" : "Corporate Showcase";
            const title = btn.getAttribute('data-title') || showcaseTitle;
            const content = `
                <div class="aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center relative group">
                    <img src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800" class="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" alt="Video Preview">
                    <div class="relative z-10 flex flex-col items-center">
                        <button onclick="alert('Initiating secure media stream...')" class="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 cursor-pointer hover:scale-110 hover:bg-white/30 transition-all">
                            <i data-lucide="arrow-right" class="text-white w-10 h-10 ml-2"></i>
                        </button>
                        <p class="text-white font-bold mt-4 uppercase tracking-widest text-xs">${playText}</p>
                    </div>
                </div>
            `;
            openModal(title, content);
            if (window.lucide) window.lucide.createIcons();
        });
    });

    // --- Form Submissions ---
    const contactForm = document.getElementById('contact-form');
    const contactSuccess = document.getElementById('contact-success');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            contactForm.classList.add('hidden');
            contactSuccess.classList.remove('hidden');
            contactForm.reset();
        });
    }

    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterSuccess = document.getElementById('newsletter-success');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            newsletterForm.classList.add('hidden');
            newsletterSuccess.classList.remove('hidden');
            setTimeout(() => {
                newsletterForm.classList.remove('hidden');
                newsletterSuccess.classList.add('hidden');
                newsletterForm.reset();
            }, 5000);
        });
    }

    // --- Chatbot Logic ---
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotContainer = document.getElementById('chatbot-container');
    const closeChatbotBtn = document.getElementById('close-chatbot');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSuggestionsContainer = document.getElementById('chatbot-suggestions');
    const chatbotForm = document.getElementById('chatbot-form');

    let chatIsOpen = false;

    function toggleChatbot() {
        chatIsOpen = !chatIsOpen;
        if (chatIsOpen) {
            chatbotContainer.classList.add('active');
            const unreadBadge = chatbotToggle.querySelector('span');
            if (unreadBadge) unreadBadge.style.display = 'none'; // Hide badge when opened
            if (chatbotMessages.children.length === 0) {
                addMessage(window.AgrizenTranslations.chatbot[currentLanguage].welcome, 'bot');
                addQuickActions();
            }
            // focus input
            setTimeout(() => chatbotInput.focus(), 300);
        } else {
            chatbotContainer.classList.remove('active');
        }
    }

    if (chatbotToggle && closeChatbotBtn) {
        chatbotToggle.addEventListener('click', toggleChatbot);
        closeChatbotBtn.addEventListener('click', toggleChatbot);
    }

    if (chatbotLangSelect) {
        chatbotLangSelect.addEventListener('change', (e) => {
            translatePage(e.target.value);
        });
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} chat-message w-full`;
        
        const bubble = document.createElement('div');
        bubble.className = `max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
            sender === 'user' 
                ? 'bg-agri-green-600 text-white rounded-tr-sm' 
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
        }`;
        bubble.innerHTML = text;
        
        msgDiv.appendChild(bubble);
        chatbotMessages.appendChild(msgDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function addQuickActions() {
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex justify-start chat-message mt-1 w-full`;
        msgDiv.innerHTML = `
            <div class="flex gap-2 flex-wrap max-w-[95%]">
                <a href="https://wa.me/919719717666" target="_blank" class="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] rounded-xl text-[11px] font-bold hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20">
                    <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> WhatsApp
                </a>
                <a href="tel:+919719717666" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-xl text-[11px] font-bold hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                    <i data-lucide="phone" class="w-3.5 h-3.5"></i> Call Now
                </a>
                <a href="mailto:Agrizencropcare@gmail.com" class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500/10 text-slate-600 rounded-xl text-[11px] font-bold hover:bg-slate-500/20 transition-colors border border-slate-500/20">
                    <i data-lucide="mail" class="w-3.5 h-3.5"></i> Email
                </a>
            </div>
        `;
        chatbotMessages.appendChild(msgDiv);
        lucide.createIcons();
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const msgDiv = document.createElement('div');
        msgDiv.id = 'typing-indicator';
        msgDiv.className = `flex justify-start chat-message w-full`;
        msgDiv.innerHTML = `
            <div class="max-w-[85%] rounded-2xl p-3 bg-white border border-slate-100 rounded-tl-sm flex items-center gap-1">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        chatbotMessages.appendChild(msgDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    function getBotResponse(input) {
        const lowerInput = input.toLowerCase();
        let bestMatch = null;
        let highestMatches = 0;

        const kb = window.AgrizenTranslations.chatbotKnowledgeBase || [];
        for (const entry of kb) {
            let matches = 0;
            for (const keyword of entry.keywords) {
                if (lowerInput.includes(keyword)) {
                    matches++;
                }
            }
            if (matches > highestMatches) {
                highestMatches = matches;
                bestMatch = entry.response;
            }
        }

        if (bestMatch) {
            return bestMatch[currentLanguage] || bestMatch['en'];
        }
        return window.AgrizenTranslations.chatbot[currentLanguage].fallback;
    }

    function renderSmartFAQs() {
        if (!chatbotSuggestionsContainer) return;
        chatbotSuggestionsContainer.innerHTML = '';
        const faqs = window.AgrizenTranslations.chatbotSmartFAQs[currentLanguage] || window.AgrizenTranslations.chatbotSmartFAQs['en'];
        faqs.forEach(faq => {
            const btn = document.createElement('button');
            btn.className = 'px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium hover:bg-agri-green-50 hover:text-agri-green-600 hover:border-agri-green-200 transition-colors shrink-0 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-agri-green-500/30';
            btn.textContent = faq.question;
            btn.addEventListener('click', () => {
                handleUserInput(faq.query || faq.question);
            });
            chatbotSuggestionsContainer.appendChild(btn);
        });
    }

    function handleUserInput(text) {
        if (!text.trim()) return;
        addMessage(text, 'user');
        if (chatbotInput) chatbotInput.value = '';
        
        showTypingIndicator();
        
        // Simulate network delay
        setTimeout(() => {
            hideTypingIndicator();
            const response = getBotResponse(text);
            addMessage(response, 'bot');
            
            // Re-add quick actions occasionally or specifically for fallback/contact
            if (response === window.AgrizenTranslations.chatbot[currentLanguage].fallback || text.toLowerCase().includes('contact') || text.toLowerCase().includes('support')) {
                addQuickActions();
            }
        }, 1000);
    }

    // --- Success Stories Modal ---
    const successStoriesBtn = document.getElementById('open-success-stories');
    if (successStoriesBtn) {
        successStoriesBtn.addEventListener('click', () => {
            const title = "Farmer Success Stories";
            const content = `
                <div class="space-y-8">
                    <!-- Story 1 -->
                    <div class="flex flex-col md:flex-row gap-6 items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div class="w-full md:w-1/3 aspect-[4/3] rounded-2xl overflow-hidden shadow-md">
                            <img src="./assets/farmer_portrait_1.png" class="w-full h-full object-cover" alt="Success Story">
                        </div>
                        <div class="w-full md:w-2/3">
                            <div class="flex gap-1 text-agri-gold mb-2">
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                            </div>
                            <h4 class="text-xl font-black text-agri-dark uppercase tracking-tight mb-2">Ramesh Patil</h4>
                            <p class="text-agri-green-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Nashik, Maharashtra</p>
                            <p class="text-slate-600 leading-relaxed text-sm italic">
                                "Agrizen's fungicide range saved my vineyards during the unseasonal October rains. The field advisory team responded within hours. Their solutions completely transformed my yield."
                            </p>
                        </div>
                    </div>
                    <!-- Story 2 -->
                    <div class="flex flex-col md:flex-row gap-6 items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div class="w-full md:w-1/3 aspect-[4/3] rounded-2xl overflow-hidden shadow-md md:order-last">
                            <img src="./assets/farmer_portrait_2.png" class="w-full h-full object-cover object-top" alt="Success Story">
                        </div>
                        <div class="w-full md:w-2/3 text-left md:text-right">
                            <div class="flex gap-1 text-agri-gold mb-2 md:justify-end">
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                            </div>
                            <h4 class="text-xl font-black text-agri-dark uppercase tracking-tight mb-2">Gurpreet Singh</h4>
                            <p class="text-agri-green-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Bhatinda, Punjab</p>
                            <p class="text-slate-600 leading-relaxed text-sm italic">
                                "Their micro-nutrients have visibly improved the crop quality. The leaf size and boll opening in cotton are much healthier this year compared to using local brands."
                            </p>
                        </div>
                    </div>
                </div>
            `;
            openModal(title, content);
            if (window.lucide) window.lucide.createIcons();
        });
    }

    if (chatbotForm) {
        chatbotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (chatbotInput) handleUserInput(chatbotInput.value);
        });
    }

    // Automatically translate page to the stored language on load
    translatePage(currentLanguage);
});
