(function () {
    var form = document.getElementById('deletion-form');
    if (!form) return;

    var text = JSON.parse(document.getElementById('del-messages').textContent);
    var endpoint = form.getAttribute('data-endpoint');
    var steps = { ask: form.querySelector('[data-step="ask"]'), confirm: form.querySelector('[data-step="confirm"]') };
    var sendButton = form.querySelector('[data-send]');
    var confirmButton = form.querySelector('[data-confirm]');
    var status = document.getElementById('del-status');
    var pending = false;

    function show(id, message) {
        var el = document.getElementById(id);
        el.textContent = message || '';
        el.hidden = !message;
    }

    function clearErrors() {
        show('del-role-error');
        show('del-phone-error');
        show('del-code-error');
        status.textContent = '';
        status.className = 'waitlist-status';
    }

    function say(message, kind) {
        status.textContent = message;
        status.className = 'waitlist-status ' + kind;
    }

    function setPending(button, on) {
        pending = on;
        button.disabled = on;
        if (on) {
            button.setAttribute('data-label', button.textContent);
            button.textContent = button.getAttribute('data-sending');
        } else if (button.hasAttribute('data-label')) {
            button.textContent = button.getAttribute('data-label');
        }
    }

    function digits(value) {
        return value.replace(/[\s\-().]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, '');
    }

    function goTo(step) {
        steps.ask.hidden = step !== 'ask';
        steps.confirm.hidden = step !== 'confirm';
        var target = step === 'ask' ? form.elements.phone_number : form.elements.otp;
        target.focus();
    }

    function body(extra) {
        var data = new URLSearchParams();
        data.set('role', form.elements.role.value);
        data.set('phone_number', digits(form.elements.phone_number.value));
        Object.keys(extra || {}).forEach(function (key) { data.set(key, extra[key]); });
        return data;
    }

    function post(url, data, button, onDone) {
        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, 15000);
        setPending(button, true);

        fetch(url, { method: 'POST', body: data, credentials: 'omit', signal: controller.signal })
            .then(function (response) {
                if (response.status === 204) return onDone();
                return refuse(response);
            }, function () {
                say(controller.signal.aborted ? text.slow : (navigator.onLine === false ? text.offline : text.failed), 'error');
            })
            .then(function () {
                clearTimeout(timer);
                if (!status.classList.contains('ok')) setPending(button, false);
            });
    }

    function refuse(response) {
        if (response.status === 429) return response.json().then(function (problem) {
            say(/too_soon/.test(problem.type || '') ? text.too_soon : text.too_many, 'error');
        }, function () { say(text.too_many, 'error'); });
        if (response.status !== 422) return say(text.failed, 'error');
        return response.json().then(function (problem) {
            var type = problem.type || '';
            if (/exhausted/.test(type)) return say(text.expired, 'error');
            if (/invalid_code/.test(type)) return show('del-code-error', text.wrong_code);
            say(text.failed, 'error');
        }, function () { say(text.failed, 'error'); });
    }

    function askProblems() {
        var found = false;
        if (!form.elements.role.value) { show('del-role-error', text.role); found = true; }
        if (!/^[6-9]\d{9}$/.test(digits(form.elements.phone_number.value))) { show('del-phone-error', text.phone); found = true; }
        return found;
    }

    sendButton.addEventListener('click', function () {
        if (pending) return;
        clearErrors();
        if (askProblems()) return;
        post(endpoint + '/code', body(), sendButton, function () { goTo('confirm'); });
    });

    form.querySelector('[data-back]').addEventListener('click', function () {
        clearErrors();
        form.elements.otp.value = '';
        goTo('ask');
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (pending) return;
        clearErrors();
        var code = form.elements.otp.value.replace(/\s/g, '');
        if (!/^\d{4,8}$/.test(code)) return show('del-code-error', text.code);
        post(endpoint, body({ otp: code }), confirmButton, function () {
            steps.ask.hidden = true;
            steps.confirm.hidden = true;
            say(text.success, 'ok');
            status.setAttribute('tabindex', '-1');
            status.focus();
        });
    });

    var wanted = new URLSearchParams(window.location.search).get('app');
    var radio = wanted && form.querySelector('input[name="role"][data-key="' + wanted.replace(/[^a-z]/g, '') + '"]');
    if (radio) radio.checked = true;
}());
