async function loadPreact() {
    try {
        const preactModule = await import('https://esm.sh/preact@10.23.2');
        window.Preact = preactModule;
        window.preact = preactModule;
        const hooksModule = await import('https://esm.sh/preact@10.23.2/hooks');
        if (!hooksModule) {
            throw new Error('Preact hooks module failed to load');
        }
        window.preactHooks = hooksModule;
        await initApp();
    } catch (error) {
        console.error('Failed to load Preact:', error);
        document.getElementById('loading').innerHTML = `
            <div style="text-align: center; color: #e53e3e;">
                Unable to load the app. Please check your internet connection and refresh.
            </div>`;
    }
}

async function initApp() {
    const { DraggableMarker } = await import('./DraggableMarker.js');
    const { BaseballField } = await import('./BaseballField.js');
    window.DraggableMarker = DraggableMarker;

    const { h, render } = window.preact;
    const { useState } = window.preactHooks;

    function App() {
        const [email, setEmail] = useState('');
        const [hasAccess, setHasAccess] = useState(sessionStorage.getItem('hasAccess') === 'true');
        const [error, setError] = useState(null);

        const handleEmailSubmit = (e) => {
            e.preventDefault();
            if (email) {
                setHasAccess(true);
                sessionStorage.setItem('hasAccess', 'true');
            } else {
                setError('Please enter an email');
            }
        };

        return h('div', null,
            h('h1', { className: 'title-highlight' }, 'FieldCommand'),
            h('p', { style: { textAlign: 'center', margin: '10px 0' } }, 'A tool for coaches to draw baseball plays and strategize.'),
            !hasAccess && h('form', { onSubmit: handleEmailSubmit, style: { textAlign: 'center', marginTop: '20px' } },
                h('input', {
                    type: 'email',
                    value: email,
                    onInput: (e) => setEmail(e.target.value),
                    placeholder: 'Enter your email to access',
                    required: true,
                    style: { padding: '5px', marginRight: '10px' }
                }),
                h('button', { type: 'submit', style: { padding: '5px 10px' }, className: 'button-green' }, 'Submit')
            ),
            hasAccess && h(BaseballField, { setError })
        );
    }

    render(h(App), document.getElementById('root'));
}

loadPreact();