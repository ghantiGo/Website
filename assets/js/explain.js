(function () {
    var root = document.querySelector('[data-explain]');
    if (!root || !window.gsap) return;

    var gsap = window.gsap;
    var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var narrow = window.matchMedia('(max-width: 700px)');
    var params = new URLSearchParams(window.location.search);
    var ui = JSON.parse(root.querySelector('[data-explain-ui]').textContent);

    var decks = root.querySelectorAll('[data-deck]');
    var tabs = root.querySelectorAll('[data-deck-tab]');
    var dotList = root.querySelector('[data-explain-dots]');
    var prev = root.querySelector('[data-explain-prev]');
    var next = root.querySelector('[data-explain-next]');
    var play = root.querySelector('[data-explain-play]');
    var bar = root.querySelector('[data-explain-progress]');
    var picker = root.querySelector('[data-explain-lang]');
    var modes = root.querySelectorAll('[data-mode]');

    var stored = function (key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } };
    var store = function (key, value) { try { window.localStorage.setItem(key, value); } catch (e) { return; } };

    var lang = params.get('lang') || stored('gg-explain-lang') || 'en';
    if (!ui[lang]) lang = 'en';
    var mode = params.get('mode') === 'manual' || calm ? 'manual' : 'auto';
    var deck = 0;
    each(decks, function (el, i) { if (el.getAttribute('data-deck') === params.get('deck')) deck = i; });
    var slides = [];
    var dots = [];
    var index = 0;
    var paused = false;
    var timeline = null;
    var timelines = {};

    var word = function (key) { return ui[lang][key] || ui.en[key]; };
    var deckName = function (i) { return tabs[i].querySelector('[data-lang="' + lang + '"]').textContent; };

    var MIN = 6;
    var CENTER = '50% 50%';
    var origin = function (el) { return el.getAttribute('data-pivot'); };
    var blink = function (tl, eyes, at) {
        tl.to(eyes, {scaleY: 0.1, duration: 0.08, svgOrigin: origin(eyes)}, at)
          .to(eyes, {scaleY: 1, duration: 0.12, svgOrigin: origin(eyes)}, at + 0.08);
    };
    var swing = function (tl, arm, from, to, at) {
        tl.fromTo(arm, {rotation: from, svgOrigin: origin(arm)}, {rotation: to, duration: 0.7, ease: 'back.out(1.6)', svgOrigin: origin(arm)}, at);
    };
    var wag = function (tl, part, from, to, at, times) {
        tl.fromTo(part, {rotation: from, svgOrigin: origin(part)}, {rotation: to, duration: 0.32, yoyo: true, repeat: times, ease: 'sine.inOut', svgOrigin: origin(part)}, at);
    };
    var roll = function (tl, wheels, turns, duration, at, ease) {
        tl.fromTo(wheels, {rotation: 0, transformOrigin: CENTER}, {rotation: 360 * turns, duration: duration, ease: ease, transformOrigin: CENTER}, at);
    };
    var turnSun = function (tl, get) {
        var rays = get('sun').firstElementChild.firstElementChild;
        tl.fromTo(rays, {rotation: 0, svgOrigin: '0 0'}, {rotation: 90, duration: MIN, ease: 'none', svgOrigin: '0 0'}, 0);
    };
    var appear = function (tl, parts, at, gap) {
        tl.fromTo(parts, {opacity: 0, y: 24}, {opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: gap}, at);
    };
    var greet = function (tl, get) {
        ['resident', 'seller', 'organiser'].forEach(function (who, i) {
            tl.fromTo(get(who + '-pos'), {y: 60, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'power2.out'}, i * 0.35);
            wag(tl, get(who + '-arm-r'), 14, -12, 0.9 + i * 0.35, 7);
            blink(tl, get(who + '-eyes'), 2.4 + i * 0.5);
        });
    };
    var meet = function (tl, get) {
        turnSun(tl, get);
        tl.fromTo(get('resident-pos'), {x: -900}, {x: 0, duration: 1.8, ease: 'power2.out'}, 0);
        tl.fromTo(get('resident-pos'), {y: 0}, {y: -14, duration: 0.22, yoyo: true, repeat: 7, ease: 'sine.inOut'}, 0);
        swing(tl, get('resident-arm-r'), 62, 0, 2.2);
        blink(tl, get('seller-eyes'), 3.4);
        blink(tl, get('resident-eyes'), 4.4);
    };
    var reveal = function (tl, get, all) { appear(tl, all('[id$="-new"] > *'), 0.5, 0.5); };

    var scenes = [
        function (tl, get, all) {
            var wheels = all('[id$="-thela"] .gg-wheel');
            tl.fromTo(get('vendor'), {x: -1500}, {x: 0, duration: 2.4, ease: 'power1.out'}, 0);
            roll(tl, wheels, 3, 2.4, 0, 'power1.out');
            tl.to(get('vendor'), {x: 1500, duration: 2.2, ease: 'power1.in'}, 3);
            tl.to(wheels, {rotation: 360 * 6, duration: 2.2, ease: 'power1.in', transformOrigin: CENTER}, 3);
            tl.fromTo([get('resident-eyes'), get('resident-mouth')], {x: 0}, {x: 28, duration: 0.4, ease: 'power2.out'}, 5);
            blink(tl, get('resident-eyes'), 5.5);
        },
        function (tl, get, all) {
            tl.fromTo(get('thela'), {x: -700}, {x: 0, duration: 1.4, ease: 'power2.out'}, 0);
            roll(tl, all('[id$="-thela"] .gg-wheel'), 2, 1.4, 0, 'power2.out');
            turnSun(tl, get);
            swing(tl, get('seller-arm-r'), 58, 0, 1.5);
            blink(tl, get('seller-eyes'), 2.6);
            tl.to(get('seller-arm-r'), {rotation: -7, duration: 0.18, yoyo: true, repeat: 3, svgOrigin: origin(get('seller-arm-r'))}, 3.2);
            blink(tl, get('seller-eyes'), 4.6);
        },
        function (tl, get) {
            tl.fromTo(get('tent'), {scale: 0, svgOrigin: '1220 920'}, {scale: 1, duration: 0.9, ease: 'back.out(1.4)', svgOrigin: '1220 920'}, 0.3);
            turnSun(tl, get);
            swing(tl, get('organiser-arm-l'), 0, 128, 1.4);
            tl.to(get('organiser-arm-l'), {rotation: 108, duration: 0.3, yoyo: true, repeat: 5, ease: 'sine.inOut', svgOrigin: origin(get('organiser-arm-l'))}, 2.2);
            blink(tl, get('organiser-eyes'), 2.8);
        },
        function (tl, get, all) {
            swing(tl, get('resident-arm-r'), 55, 0, 0.3);
            tl.fromTo(get('link'), {opacity: 0}, {opacity: 1, duration: 0.5}, 1);
            tl.fromTo(get('timetable'), {opacity: 0, y: 40}, {opacity: 1, y: 0, duration: 0.6, ease: 'power2.out'}, 1.2);
            appear(tl, all('[id$="-timetable"] .gg-card'), 2, 0.9);
            blink(tl, get('resident-eyes'), 3.6);
        },
        function (tl, get) {
            swing(tl, get('resident-arm-r'), 55, 0, 0.3);
            blink(tl, get('resident-eyes'), 1.3);
            tl.fromTo(get('bubble'), {scale: 0, svgOrigin: '1180 561'}, {scale: 1, duration: 0.6, ease: 'back.out(1.7)', svgOrigin: '1180 561'}, 1.6);
            tl.to(get('resident-arm-r'), {rotation: -7, duration: 0.18, yoyo: true, repeat: 1, svgOrigin: origin(get('resident-arm-r'))}, 2.6);
            blink(tl, get('resident-eyes'), 4.2);
        },
        function (tl, get) {
            meet(tl, get);
            swing(tl, get('seller-arm-r'), 0, -118, 2.6);
        },
        greet,
        function (tl, get, all) {
            tl.fromTo(get('vendor'), {x: -800}, {x: 0, duration: 2, ease: 'power2.out'}, 0);
            roll(tl, all('[id$="-thela"] .gg-wheel'), 2, 2, 0, 'power2.out');
            tl.to(get('vendor'), {x: -26, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut'}, 2.4);
            blink(tl, get('seller-eyes'), 3.6);
            tl.fromTo([get('resident-eyes'), get('resident-mouth')], {x: 0}, {x: -16, duration: 0.4, ease: 'power2.out'}, 4);
            blink(tl, get('resident-eyes'), 4.8);
        },
        function (tl, get) {
            turnSun(tl, get);
            wag(tl, get('elder-arm-r'), 12, -12, 0.3, 9);
            tl.fromTo(get('calling'), {opacity: 0.15}, {opacity: 1, duration: 0.32, yoyo: true, repeat: 10, ease: 'sine.inOut'}, 0.3);
            tl.fromTo(get('silent'), {opacity: 0}, {opacity: 1, duration: 0.5}, 2.6);
            tl.fromTo([get('young-eyes'), get('young-mouth')], {x: 0}, {x: 14, duration: 0.5, ease: 'power2.out'}, 3);
            blink(tl, get('elder-eyes'), 4.4);
        },
        function (tl, get, all) {
            tl.fromTo(all('[id$="-resident-arm-r"] .gg-box'), {scale: 0, transformOrigin: '50% 100%'}, {scale: 1, duration: 0.6, ease: 'back.out(1.6)', transformOrigin: '50% 100%'}, 0.4);
            blink(tl, get('resident-eyes'), 1.6);
            swing(tl, get('buyer-arm-l'), -58, 0, 2.4);
            tl.fromTo(all('[id$="-buyer-arm-l"] .gg-sabzi'), {scale: 0.6, transformOrigin: CENTER}, {scale: 1, duration: 0.3, yoyo: true, repeat: 4, transformOrigin: CENTER}, 3.2);
            blink(tl, get('buyer-eyes'), 4.4);
        },
        function (tl, get) {
            tl.fromTo(get('mixer'), {y: -620, rotation: -50, transformOrigin: CENTER}, {y: 0, rotation: 0, duration: 1.1, ease: 'bounce.out', transformOrigin: CENTER}, 0.5);
            tl.fromTo(get('newbox'), {x: 700}, {x: 0, duration: 0.9, ease: 'power2.out'}, 2.4);
            tl.fromTo([get('resident-eyes'), get('resident-mouth')], {x: -30}, {x: 0, duration: 0.5, ease: 'power2.out'}, 2.6);
            blink(tl, get('resident-eyes'), 4);
        },
        function (tl, get, all) {
            roll(tl, all('[id$="-sharpener"] .gg-wheel'), 3, 3, 0, 'power1.out');
            var tag = all('[id$="-shop"] .gg-tag')[0];
            wag(tl, tag, -10, 10, 0.4, 12);
            tl.to(tag, {rotation: 0, duration: 0.3, ease: 'sine.out', svgOrigin: origin(tag)}, 4.6);
            blink(tl, get('seller-eyes'), 3.4);
        },
        meet,
        function (tl, get, all) {
            roll(tl, all('[id$="-sharpener"] .gg-wheel'), 6, MIN, 0, 'none');
            tl.fromTo(all('[id$="-sharpener"] .gg-sparks'), {opacity: 0.1}, {opacity: 1, duration: 0.15, yoyo: true, repeat: 32}, 0.2);
            tl.fromTo(get('resident-pos'), {x: 600}, {x: 0, duration: 1.4, ease: 'power2.out'}, 0.6);
            swing(tl, get('resident-arm-l'), -58, 0, 2.2);
            blink(tl, get('seller-eyes'), 3.2);
            blink(tl, get('resident-eyes'), 4.2);
        },
        function (tl, get, all) {
            greet(tl, get);
            tl.fromTo(get('timetable'), {opacity: 0, y: 40}, {opacity: 1, y: 0, duration: 0.6, ease: 'power2.out'}, 1.6);
            appear(tl, all('[id$="-timetable"] .gg-card'), 2.4, 0.8);
        },
        reveal,
        reveal,
        reveal,
        function (tl, get, all) {
            var parts = all('[id$="-new"] > *');
            tl.fromTo(parts[0], {opacity: 0}, {opacity: 1, duration: 0.5}, 0.4);
            tl.fromTo(parts[1], {scale: 0, transformOrigin: '50% 100%'}, {scale: 1, duration: 0.7, ease: 'back.out(1.5)', transformOrigin: '50% 100%'}, 1);
            appear(tl, Array.prototype.slice.call(parts, 2), 1.7, 0.5);
        }
    ];

    var build = function (slide) {
        var n = parseInt(slide.getAttribute('data-n'), 10);
        var svg = slide.querySelector('svg');
        var get = function (id) { return svg.querySelector('#s' + n + '-' + id); };
        var all = function (selector) { return svg.querySelectorAll(selector); };
        var tl = gsap.timeline({paused: true, onComplete: done});
        if (!calm && scenes[n - 1]) scenes[n - 1](tl, get, all);
        if (tl.duration() < MIN) tl.to({}, {duration: MIN - tl.duration()});
        return tl;
    };

    var crop = function () {
        each(root.querySelectorAll('.explain-svg'), function (svg) {
            svg.setAttribute('viewBox', svg.getAttribute(narrow.matches ? 'data-narrow' : 'data-wide'));
        });
    };

    var last = function () { return index === slides.length - 1; };
    var ended = function () { return last() && timeline && timeline.progress() === 1; };

    function done() {
        if (mode === 'auto' && !paused && !last()) show(index + 1);
        else paint();
    }

    function paint() {
        each(modes, function (button) { button.setAttribute('aria-pressed', String(button.getAttribute('data-mode') === mode)); });
        each(tabs, function (tab, i) { tab.setAttribute('aria-pressed', String(i === deck)); });
        each(root.querySelectorAll('[data-ui]'), function (el) { el.textContent = word(el.getAttribute('data-ui')); });
        each(root.querySelectorAll('[data-ui-label]'), function (el) { el.setAttribute('aria-label', word(el.getAttribute('data-ui-label'))); });
        each(root.querySelectorAll('[data-lang]'), function (el) { el.hidden = el.getAttribute('data-lang') !== lang; });
        dots.forEach(function (dot, i) {
            if (i === index) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
            dot.setAttribute('aria-label', word('slide') + ' ' + (i + 1));
        });
        prev.disabled = index === 0 && deck === 0;
        next.disabled = last() && deck === decks.length - 1;
        play.hidden = mode !== 'auto';
        if (!ended()) play.textContent = paused ? word('play') : word('pause');
        else if (deck < decks.length - 1) play.textContent = word('next_deck') + ': ' + deckName(deck + 1);
        else play.textContent = word('replay');
        picker.value = lang;
    }

    function show(i) {
        if (timeline) timeline.pause();
        index = i;
        each(slides, function (slide, n) { slide.classList.toggle('is-active', n === index); });
        var key = slides[index].getAttribute('data-n');
        if (!timelines[key]) timelines[key] = build(slides[index]);
        timeline = timelines[key];
        if (calm && mode === 'manual') timeline.progress(1, true); else timeline.restart();
        if (paused && mode === 'auto') timeline.pause();
        paint();
    }

    function open(d, i) {
        deck = d;
        each(decks, function (el, n) { el.classList.toggle('is-active', n === deck); });
        slides = decks[deck].querySelectorAll('[data-slide]');
        dotList.textContent = '';
        dots = [];
        each(slides, function (slide, n) {
            var item = document.createElement('li');
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'explain-dot';
            dot.addEventListener('click', function () { show(n); });
            item.appendChild(dot);
            dotList.appendChild(item);
            dots.push(dot);
        });
        show(i < 0 ? slides.length - 1 : Math.min(i, slides.length - 1));
    }

    gsap.ticker.add(function () {
        var part = timeline ? timeline.progress() : 0;
        bar.style.width = ((index + part) / slides.length * 100) + '%';
    });

    prev.addEventListener('click', function () {
        if (index > 0) show(index - 1);
        else if (deck > 0) open(deck - 1, -1);
    });
    next.addEventListener('click', function () {
        if (!last()) show(index + 1);
        else if (deck < decks.length - 1) open(deck + 1, 0);
    });
    each(tabs, function (tab, i) { tab.addEventListener('click', function () { paused = false; open(i, 0); }); });
    each(modes, function (button) {
        button.addEventListener('click', function () {
            mode = button.getAttribute('data-mode');
            paused = false;
            if (mode === 'auto' && timeline.progress() === 1 && !last()) show(index + 1); else paint();
        });
    });
    play.addEventListener('click', function () {
        if (ended()) {
            paused = false;
            if (deck < decks.length - 1) open(deck + 1, 0); else show(0);
            return;
        }
        paused = !paused;
        if (paused) timeline.pause();
        else if (timeline.progress() === 1) done();
        else timeline.play();
        paint();
    });
    picker.addEventListener('change', function () {
        lang = ui[picker.value] ? picker.value : 'en';
        store('gg-explain-lang', lang);
        paint();
    });
    document.addEventListener('keydown', function (event) {
        if (event.target.closest('select, input, textarea')) return;
        if (event.key === 'ArrowRight') next.click();
        if (event.key === 'ArrowLeft') prev.click();
    });

    var startX = null;
    root.addEventListener('touchstart', function (event) { startX = event.touches[0].clientX; }, {passive: true});
    root.addEventListener('touchend', function (event) {
        if (startX === null) return;
        var moved = event.changedTouches[0].clientX - startX;
        startX = null;
        if (moved < -48) next.click();
        if (moved > 48) prev.click();
    }, {passive: true});

    narrow.addEventListener('change', crop);
    crop();
    root.classList.add('explain-ready');
    each(root.querySelectorAll('[data-explain-controls]'), function (el) { el.hidden = false; });
    open(deck, (parseInt(params.get('slide'), 10) || 1) - 1);
})();
