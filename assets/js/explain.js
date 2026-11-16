(function () {
    var root = document.querySelector('[data-explain]');
    if (!root || !window.gsap) return;

    var gsap = window.gsap;
    var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var narrow = window.matchMedia('(max-width: 700px)');
    var params = new URLSearchParams(window.location.search);
    var ui = JSON.parse(root.querySelector('[data-explain-ui]').textContent);

    var slides = root.querySelectorAll('[data-slide]');
    var dots = root.querySelectorAll('[data-explain-dot]');
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
    var index = Math.min(Math.max(parseInt(params.get('slide'), 10) || 1, 1), slides.length) - 1;
    var paused = false;
    var timeline = null;

    var word = function (key) { return ui[lang][key] || ui.en[key]; };

    var MIN = 6;
    var origin = function (el) { return el.getAttribute('data-pivot'); };
    var blink = function (tl, eyes, at) {
        tl.to(eyes, {scaleY: 0.1, duration: 0.08, svgOrigin: origin(eyes)}, at)
          .to(eyes, {scaleY: 1, duration: 0.12, svgOrigin: origin(eyes)}, at + 0.08);
    };
    var swing = function (tl, arm, from, to, at, extra) {
        var vars = {rotation: to, duration: 0.7, ease: 'back.out(1.6)', svgOrigin: origin(arm)};
        for (var key in extra) vars[key] = extra[key];
        tl.fromTo(arm, {rotation: from, svgOrigin: origin(arm)}, vars, at);
    };
    var roll = function (tl, wheels, turns, duration, at, ease) {
        tl.fromTo(wheels, {rotation: 0, transformOrigin: '50% 50%'}, {rotation: 360 * turns, duration: duration, ease: ease, transformOrigin: '50% 50%'}, at);
    };

    var scenes = [
        function (tl, get, all) {
            var wheels = all('#s1-thela .gg-wheel');
            tl.fromTo(get('vendor'), {x: -1500}, {x: 0, duration: 2.4, ease: 'power1.out'}, 0);
            roll(tl, wheels, 3, 2.4, 0, 'power1.out');
            tl.to(get('vendor'), {x: 1500, duration: 2.2, ease: 'power1.in'}, 3);
            tl.to(wheels, {rotation: 360 * 6, duration: 2.2, ease: 'power1.in', transformOrigin: '50% 50%'}, 3);
            tl.fromTo([get('resident-eyes'), get('resident-mouth')], {x: 0}, {x: 28, duration: 0.4, ease: 'power2.out'}, 5);
            blink(tl, get('resident-eyes'), 5.5);
        },
        function (tl, get, all) {
            tl.fromTo(get('thela'), {x: -700}, {x: 0, duration: 1.4, ease: 'power2.out'}, 0);
            roll(tl, all('#s2-thela .gg-wheel'), 2, 1.4, 0, 'power2.out');
            tl.fromTo(get('sun').firstElementChild.firstElementChild, {rotation: 0, svgOrigin: '0 0'}, {rotation: 90, duration: MIN, ease: 'none', svgOrigin: '0 0'}, 0);
            swing(tl, get('seller-arm-r'), 58, 0, 1.5);
            blink(tl, get('seller-eyes'), 2.6);
            tl.to(get('seller-arm-r'), {rotation: -7, duration: 0.18, yoyo: true, repeat: 3, svgOrigin: origin(get('seller-arm-r'))}, 3.2);
            blink(tl, get('seller-eyes'), 4.6);
        },
        function (tl, get) {
            tl.fromTo(get('tent'), {scale: 0, svgOrigin: '1220 920'}, {scale: 1, duration: 0.9, ease: 'back.out(1.4)', svgOrigin: '1220 920'}, 0.3);
            tl.fromTo(get('sun').firstElementChild.firstElementChild, {rotation: 0, svgOrigin: '0 0'}, {rotation: 90, duration: MIN, ease: 'none', svgOrigin: '0 0'}, 0);
            swing(tl, get('organiser-arm-l'), 0, 128, 1.4);
            tl.to(get('organiser-arm-l'), {rotation: 108, duration: 0.3, yoyo: true, repeat: 5, ease: 'sine.inOut', svgOrigin: origin(get('organiser-arm-l'))}, 2.2);
            blink(tl, get('organiser-eyes'), 2.8);
        },
        function (tl, get, all) {
            swing(tl, get('resident-arm-r'), 55, 0, 0.3);
            tl.fromTo(get('link'), {opacity: 0}, {opacity: 1, duration: 0.5}, 1);
            tl.fromTo(get('timetable'), {opacity: 0, y: 40}, {opacity: 1, y: 0, duration: 0.6, ease: 'power2.out'}, 1.2);
            tl.fromTo(all('#s4-timetable .gg-card'), {opacity: 0, y: 24}, {opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.9}, 2);
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
            tl.fromTo(get('sun').firstElementChild.firstElementChild, {rotation: 0, svgOrigin: '0 0'}, {rotation: 90, duration: MIN, ease: 'none', svgOrigin: '0 0'}, 0);
            tl.fromTo(get('resident-pos'), {x: -900}, {x: 0, duration: 1.8, ease: 'power2.out'}, 0);
            tl.fromTo(get('resident-pos'), {y: 0}, {y: -14, duration: 0.22, yoyo: true, repeat: 7, ease: 'sine.inOut'}, 0);
            swing(tl, get('resident-arm-r'), 62, 0, 2.2);
            swing(tl, get('seller-arm-r'), 0, -118, 2.6);
            blink(tl, get('seller-eyes'), 3.4);
            blink(tl, get('resident-eyes'), 4.4);
        },
        function (tl, get) {
            ['resident', 'seller', 'organiser'].forEach(function (who, i) {
                var arm = get(who + '-arm-r');
                tl.fromTo(get(who + '-pos'), {y: 60, opacity: 0}, {y: 0, opacity: 1, duration: 0.5, ease: 'power2.out'}, i * 0.35);
                tl.fromTo(arm, {rotation: 14, svgOrigin: origin(arm)}, {rotation: -12, duration: 0.32, yoyo: true, repeat: 7, ease: 'sine.inOut', svgOrigin: origin(arm)}, 0.9 + i * 0.35);
                blink(tl, get(who + '-eyes'), 2.4 + i * 0.5);
            });
        }
    ];

    var build = function (i) {
        var svg = slides[i].querySelector('svg');
        var prefix = '#s' + (i + 1) + '-';
        var get = function (id) { return svg.querySelector(prefix + id); };
        var all = function (selector) { return svg.querySelectorAll(selector); };
        var tl = gsap.timeline({paused: true, onComplete: done});
        if (!calm && scenes[i]) scenes[i](tl, get, all);
        if (tl.duration() < MIN) tl.to({}, {duration: MIN - tl.duration()});
        return tl;
    };

    var timelines = [];
    var crop = function () {
        each(slides, function (slide) {
            var svg = slide.querySelector('svg');
            svg.setAttribute('viewBox', svg.getAttribute(narrow.matches ? 'data-narrow' : 'data-wide'));
        });
    };

    function done() {
        if (mode === 'auto' && !paused && index < slides.length - 1) show(index + 1);
        else paint();
    }

    var ended = function () { return index === slides.length - 1 && timeline && timeline.progress() === 1; };

    function paint() {
        each(modes, function (button) { button.setAttribute('aria-pressed', String(button.getAttribute('data-mode') === mode)); });
        each(dots, function (dot, i) {
            if (i === index) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
            dot.setAttribute('aria-label', word('slide') + ' ' + (i + 1));
        });
        prev.disabled = index === 0;
        next.disabled = index === slides.length - 1;
        play.hidden = mode !== 'auto';
        play.textContent = ended() ? word('replay') : paused ? word('play') : word('pause');
        each(root.querySelectorAll('[data-ui]'), function (el) { el.textContent = word(el.getAttribute('data-ui')); });
        each(root.querySelectorAll('[data-ui-label]'), function (el) { el.setAttribute('aria-label', word(el.getAttribute('data-ui-label'))); });
        each(root.querySelectorAll('[data-lang]'), function (el) { el.hidden = el.getAttribute('data-lang') !== lang; });
        picker.value = lang;
    }

    function show(i) {
        if (timeline) timeline.pause();
        index = i;
        each(slides, function (slide, n) { slide.classList.toggle('is-active', n === index); });
        if (!timelines[index]) timelines[index] = build(index);
        timeline = timelines[index];
        if (calm && mode === 'manual') timeline.progress(1, true); else timeline.restart();
        if (paused && mode === 'auto') timeline.pause();
        paint();
    }

    gsap.ticker.add(function () {
        var part = timeline ? timeline.progress() : 0;
        bar.style.width = ((index + part) / slides.length * 100) + '%';
    });

    prev.addEventListener('click', function () { if (index > 0) show(index - 1); });
    next.addEventListener('click', function () { if (index < slides.length - 1) show(index + 1); });
    each(dots, function (dot, i) { dot.addEventListener('click', function () { show(i); }); });
    each(modes, function (button) {
        button.addEventListener('click', function () {
            mode = button.getAttribute('data-mode');
            paused = false;
            if (mode === 'auto' && timeline.progress() === 1 && index < slides.length - 1) show(index + 1); else paint();
        });
    });
    play.addEventListener('click', function () {
        if (ended()) { paused = false; show(0); return; }
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
    show(index);
})();
