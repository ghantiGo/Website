(function () {
    var form = document.getElementById('waitlist-form');
    if (!form) return;

    var text = JSON.parse(document.getElementById('wl-messages').textContent);
    var button = form.querySelector('.waitlist-submit');
    var status = document.getElementById('wl-status');
    var label = button.textContent;
    var pending = false;

    function show(id, message) {
        var el = document.getElementById(id);
        el.textContent = message || '';
        el.hidden = !message;
    }

    function clearErrors() {
        show('wl-role-error');
        show('wl-phone-error');
        show('wl-consent-error');
        status.textContent = '';
        status.className = 'waitlist-status';
    }

    function say(message, kind) {
        status.textContent = message;
        status.className = 'waitlist-status ' + kind;
    }

    function sync() {
        button.disabled = pending || !form.elements.consent.checked;
        button.setAttribute('aria-busy', pending ? 'true' : 'false');
    }

    function setPending(on) {
        pending = on;
        sync();
        button.textContent = on ? button.getAttribute('data-sending') : label;
    }

    function digits(value) {
        return value.replace(/[\s\-().]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, '');
    }

    function problems() {
        var found = {};
        if (!form.elements.role.value) found.role = text.role;
        if (!/^[6-9]\d{9}$/.test(digits(form.elements.phone_number.value))) found.phone = text.phone;
        if (!form.elements.consent.checked) found.consent = text.consent;
        return found;
    }

    function showProblems(found) {
        show('wl-role-error', found.role);
        show('wl-phone-error', found.phone);
        show('wl-consent-error', found.consent);
        var first = form.querySelector('.field-error:not([hidden])');
        if (first) {
            var target = first.parentNode.querySelector('input');
            if (target) target.focus();
        }
    }

    function succeed() {
        form.reset();
        Array.prototype.forEach.call(form.querySelectorAll('fieldset, .waitlist-field, .waitlist-consent, .waitlist-submit'), function (el) {
            el.hidden = true;
        });
        say(text.success, 'ok');
        status.setAttribute('tabindex', '-1');
        status.focus();
    }

    function refuse(response) {
        if (response.status === 429) return say(text.too_many, 'error');
        if (response.status !== 422) return say(text.failed, 'error');
        response.json().then(function (body) {
            var errors = body.errors || {};
            if (errors.choices) return say(text.failed, 'error');
            showProblems({
                role: errors.role && text.role,
                phone: errors.phone_number && text.phone,
                consent: (errors.consent || errors.consent_notice_version) && text.consent
            });
        }, function () {
            say(text.failed, 'error');
        });
    }

    form.elements.consent.addEventListener('change', sync);
    form.addEventListener('reset', function () { setTimeout(sync, 0); });
    sync();

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (pending) return;
        clearErrors();

        var found = problems();
        if (found.role || found.phone || found.consent) return showProblems(found);

        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, 15000);
        setPending(true);

        fetch(form.getAttribute('data-endpoint'), {
            method: 'POST',
            body: new URLSearchParams(new FormData(form)),
            credentials: 'omit',
            signal: controller.signal
        }).then(function (response) {
            if (response.status === 204) return succeed();
            refuse(response);
        }, function () {
            say(controller.signal.aborted ? text.slow : (navigator.onLine === false ? text.offline : text.failed), 'error');
        }).then(function () {
            clearTimeout(timer);
            if (!status.classList.contains('ok')) setPending(false);
        });
    });
}());
