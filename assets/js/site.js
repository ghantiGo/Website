(function () {
    var root = document.documentElement;
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

    var chip = document.querySelector('[data-clock]');
    if (chip && window.Intl) {
        var out = chip.querySelector('[data-clock-time]');
        var format = new Intl.DateTimeFormat('en-IN', {hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'});
        var tick = function () { out.textContent = format.format(new Date()); };
        tick();
        chip.hidden = false;
        setInterval(tick, 30000);
    }

    var phone = document.querySelector('[data-day-phone]');
    var moments = document.querySelectorAll('[data-moment]');
    if (phone && moments.length && 'IntersectionObserver' in window) {
        var rows = phone.querySelectorAll('[data-row]');
        var clock = phone.querySelector('[data-phone-clock]');
        var show = function (index) {
            each(rows, function (row, i) {
                row.classList.toggle('is-now', i === index);
                row.classList.toggle('is-next', i > index);
            });
            each(moments, function (moment, i) { moment.classList.toggle('is-now', i === index); });
            clock.textContent = moments[index].getAttribute('data-clock');
        };
        var wide = window.matchMedia('(min-width: 900px)').matches;
        var watcher = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) show(Array.prototype.indexOf.call(moments, entry.target));
            });
        }, {rootMargin: wide ? '-50% 0px -49% 0px' : '-72% 0px -27% 0px'});
        phone.closest('.day').classList.add('is-live');
        show(0);
        each(moments, function (moment) { watcher.observe(moment); });
    }

    if (!calm && 'IntersectionObserver' in window && !(window.CSS && CSS.supports('animation-timeline: view()'))) {
        root.classList.add('no-timeline');
        var reveal = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                reveal.unobserve(entry.target);
            });
        }, {rootMargin: '0px 0px -12% 0px'});
        each(document.querySelectorAll('.reveal'), function (el) { reveal.observe(el); });
    }

    each(document.querySelectorAll('[data-video]'), function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            var frame = document.createElement('iframe');
            frame.src = 'https://www.youtube-nocookie.com/embed/' + link.getAttribute('data-video') + '?autoplay=1';
            frame.title = link.getAttribute('data-title');
            frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            frame.allowFullscreen = true;
            var holder = document.createElement('div');
            holder.className = 'video video--playing';
            holder.appendChild(frame);
            link.parentNode.replaceChild(holder, link);
            frame.focus();
        });
    });

    if (!calm && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        each(document.querySelectorAll('[data-magnetic]'), function (el) {
            el.addEventListener('pointermove', function (event) {
                var box = el.getBoundingClientRect();
                var x = (event.clientX - box.left - box.width / 2) * 0.18;
                var y = (event.clientY - box.top - box.height / 2) * 0.3;
                el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
            });
            el.addEventListener('pointerleave', function () { el.style.transform = ''; });
        });
    }
}());
