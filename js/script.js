// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const offerToday = document.getElementById('offer-today');
    if (offerToday) {
        const updateOfferDate = () => {
            offerToday.textContent = new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric'}).format(new Date());
        };
        updateOfferDate();
        setInterval(updateOfferDate, 60000);
        window.addEventListener('focus', updateOfferDate);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) updateOfferDate();
        });
    }
    
    /* ==========================================================================
       FAQ ACCORDION INTERACTIVITY
       ========================================================================== */
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const currentItem = question.parentElement;
            
            // Check if current item is already active
            const isActive = currentItem.classList.contains('active');
            
            // Close all other FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle active state for clicked item
            if (!isActive) {
                currentItem.classList.add('active');
            }
        });
    });

    /* ==========================================================================
       CTA SCROLL TO PLANOS (no anchor href, smooth scroll only)
       ========================================================================== */
    document.querySelectorAll('.scroll-to-planos').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById('planos');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    /* ==========================================================================
       CHECKOUT LINKS: forward UTMs so native <a> clicks fire gtm.linkClick
       ========================================================================== */
    function appendUtmsToHref(anchor) {
        if (!anchor || !anchor.href) return;
        const queryString = window.location.search;
        if (!queryString) return;
        const cleanParams = queryString.startsWith('?') ? queryString.substring(1) : queryString;
        try {
            const url = new URL(anchor.href);
            const incoming = new URLSearchParams(cleanParams);
            incoming.forEach((value, key) => {
                if (!url.searchParams.has(key)) url.searchParams.set(key, value);
            });
            anchor.href = url.toString();
        } catch (_) { /* noop */ }
    }
    const checkoutProducts = {
        'https://pay.wiapy.com/ovRNc2Mmr4Jr': {
            name: 'Doenças Equinas — Plano Completo',
            value: 27.90
        },
        'https://pay.wiapy.com/YmcfTfkO0cNM': {
            name: 'Doenças Equinas — Plano Completo com Desconto',
            value: 17.90
        },
        'https://pay.wiapy.com/5ZC1squumomY': {
            name: 'Doenças Equinas — Plano Básico',
            value: 10.00
        }
    };

    document.querySelectorAll('a.checkout-link').forEach((checkoutLink) => {
        appendUtmsToHref(checkoutLink);

        const destination = new URL(checkoutLink.href);
        const baseUrl = `${destination.origin}${destination.pathname}`;
        const product = checkoutProducts[baseUrl];
        if (!product) return;

        checkoutLink.addEventListener('click', () => {
            if (typeof window.fbq === 'function') {
                window.fbq('track', 'InitiateCheckout', {
                    content_name: product.name,
                    value: product.value,
                    currency: 'BRL'
                });
            }
        });
    });

    /* ==========================================================================
       UPSELL POPUP LOGIC
       ========================================================================== */
    const btnComprarBasico = document.getElementById('btn-comprar-basico');
    const upsellModal = document.getElementById('upsell-modal');
    const btnCloseUpsell = document.getElementById('btn-close-upsell');
    const btnUpsellAccept = document.getElementById('btn-upsell-accept');

    // Basic plan button opens the upsell modal (no redirect URL)
    if (btnComprarBasico) {
        btnComprarBasico.addEventListener('click', (e) => {
            e.preventDefault();
            upsellModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    }

    const closeUpsell = () => {
        upsellModal.classList.remove('open');
        document.body.style.overflow = '';
    };

    if (btnCloseUpsell) btnCloseUpsell.addEventListener('click', closeUpsell);

    // The accept/decline links navigate natively (gtm.linkClick); just close the modal state on accept
    if (btnUpsellAccept) {
        btnUpsellAccept.addEventListener('click', () => {
            upsellModal.classList.remove('open');
        });
    }

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === upsellModal) {
            closeUpsell();
        }
    });


    /* ==========================================================================
       LIGHTBOX / CASE DETAILS MODAL
       ========================================================================== */
    const lightboxModal = document.getElementById('lightbox-modal');
    const btnCloseLightbox = document.getElementById('btn-close-lightbox');

    // Global function to be called from inline onclick events
    window.openLightbox = (imgUrl) => {
        const fullImg = document.getElementById('lightbox-full-img');
        if (fullImg) {
            fullImg.src = imgUrl;
        }
        lightboxModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        lightboxModal.classList.remove('open');
        document.body.style.overflow = '';
    };

    if (btnCloseLightbox) btnCloseLightbox.addEventListener('click', closeLightbox);

    window.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
            closeLightbox();
        }
    });


    /* ==========================================================================
       DYNAMIC COUNTDOWN TIMER (EVERGREEN & PERSISTENT)
       ========================================================================== */
    const hoursVal = document.getElementById('hours');
    const minutesVal = document.getElementById('minutes');
    const secondsVal = document.getElementById('seconds');

    const sHoursVal = document.getElementById('scarcity-hours');
    const sMinutesVal = document.getElementById('scarcity-minutes');
    const sSecondsVal = document.getElementById('scarcity-seconds');

    if ((hoursVal && minutesVal && secondsVal) || (sHoursVal && sMinutesVal && sSecondsVal)) {
        const timerDurationSeconds = (76 * 60) + 2; // 1h 16m 02s = 4562s
        
        let deadline = localStorage.getItem('pricing_countdown_deadline');
        
        // If deadline is not set or is corrupted, set a new one
        if (!deadline || isNaN(parseInt(deadline))) {
            const newDeadline = new Date().getTime() + (timerDurationSeconds * 1000);
            localStorage.setItem('pricing_countdown_deadline', newDeadline.toString());
            deadline = newDeadline;
        } else {
            deadline = parseInt(deadline);
        }

        function updateTimer() {
            const now = new Date().getTime();
            let remaining = deadline - now;

            // Reset deadline if it has expired
            if (remaining <= 0) {
                const newDeadline = now + (timerDurationSeconds * 1000);
                localStorage.setItem('pricing_countdown_deadline', newDeadline.toString());
                deadline = newDeadline;
                remaining = timerDurationSeconds * 1000;
            }

            const totalSeconds = Math.floor(remaining / 1000);
            const hrs = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;

            const padHrs = hrs.toString().padStart(2, '0');
            const padMins = mins.toString().padStart(2, '0');
            const padSecs = secs.toString().padStart(2, '0');

            // Update main timer
            if (hoursVal) hoursVal.innerText = padHrs;
            if (minutesVal) minutesVal.innerText = padMins;
            if (secondsVal) secondsVal.innerText = padSecs;

            // Update sticky scarcity timer
            if (sHoursVal) sHoursVal.innerText = padHrs;
            if (sMinutesVal) sMinutesVal.innerText = padMins;
            if (sSecondsVal) sSecondsVal.innerText = padSecs;
        }

        // Run immediately once
        updateTimer();
        
        // Update timer every second
        setInterval(updateTimer, 1000);
    }
});



/* ==========================================================================
   PROVA SOCIAL - MINI CARD (canto inferior direito)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const toast = document.getElementById('social-proof-toast');
    if (!toast) return;

    const elName = document.getElementById('sp-name');
    const elPlan = document.getElementById('sp-plan');
    const elCity = document.getElementById('sp-city');
    const elTime = document.getElementById('sp-time');
    const btnClose = document.getElementById('sp-close');

    const women = ['Ana Paula Ferreira','Maria Eduarda Lima','Juliana Pereira','Fernanda Souza','Camila Nogueira','Patrícia Albuquerque','Larissa Mendes','Bruna Carvalho','Tatiane Barros','Renata Cavalcanti','Aline Machado','Vanessa Oliveira','Débora Siqueira','Sabrina Rocha','Cristiane Duarte','Mariana Bezerra','Luciana Prado','Roberta Antunes','Simone Teixeira','Eliane Moraes','Gabriela Nunes','Priscila Farias','Michele Andrade','Daniela Queiroz'];
    const men = ['João Pedro Almeida','Carlos Eduardo Ramos','Marcos Vinícius Silva','Rafael Monteiro','Anderson Braga','Thiago Correia','Lucas Fontenele','Everton Dias','Gustavo Bittencourt','Rodrigo Sampaio','Fábio Menezes','Wesley Tavares','Diego Amorim','José Carlos Batista','Paulo Henrique Gomes','Leandro Pacheco'];

    const cities = [
        'São Paulo - SP','Campinas - SP','Ribeirão Preto - SP','Rio de Janeiro - RJ','Belo Horizonte - MG','Uberaba - MG','Uberlândia - MG','Curitiba - PR','Londrina - PR','Porto Alegre - RS','Bagé - RS','Florianópolis - SC','Campo Grande - MS','Cuiabá - MT','Goiânia - GO','Brasília - DF','Salvador - BA','Feira de Santana - BA','Recife - PE','Petrolina - PE','Fortaleza - CE','Juazeiro do Norte - CE','Natal - RN','João Pessoa - PB','Campina Grande - PB','Teresina - PI','São Luís - MA','Maceió - AL','Aracaju - SE','Belém - PA','Palmas - TO','Manaus - AM','Porto Velho - RO','Vitória - ES','Barretos - SP','Sorocaba - SP'
    ];

    const plans = ['Plano Completo','Plano Completo','Plano Completo','Plano Básico'];

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    // Variação contínua (float) entre 7s e 16s — sem clustering de inteiros
    const rand = (min, max) => Math.random() * (max - min) + min;

    function buildName() {
        return Math.random() < 0.6 ? pick(women) : pick(men);
    }

    function buildTime() {
        const m = Math.floor(rand(1, 28));
        return m === 1 ? 'há 1 minuto' : 'há ' + m + ' minutos';
    }

    let hideTimer = null;
    let closed = false;

    function hide() {
        toast.classList.remove('show');
    }

    function show() {
        if (closed) return;
        elName.textContent = buildName();
        elPlan.textContent = pick(plans);
        elCity.textContent = pick(cities);
        elTime.textContent = buildTime();
        toast.classList.add('show');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hide, 5200);
    }

    function schedule(delay) {
        setTimeout(() => {
            if (closed) return;
            show();
            // próximo: entre 7s e 16s após sumir, variação contínua
            schedule(5200 + rand(7000, 16000));
        }, delay);
    }

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            closed = true;
            hide();
        });
    }

    // Primeiro card nunca antes dos 12 segundos
    schedule(12000 + rand(0, 5000));
});
