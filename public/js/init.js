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
        const [hasAccess, setHasAccess] = useState(sessionStorage.getItem('fieldCommandUnlocked') === 'true');
        const [error, setError] = useState(null);

        const handleEmailSubmit = (e) => {
            e.preventDefault();
            if (email) {
                setHasAccess(true);
                sessionStorage.setItem('fieldCommandUnlocked', 'true');
            } else {
                setError('Please enter a valid email');
            }
        };

        return h('div', { className: 'min-h-screen flex items-center justify-center' },
            h('div', { className: 'w-full max-w-[1200px] mx-auto p-4 md:p-6' },
                !hasAccess && h('div', { className: 'max-w-md mx-auto' },
                    h('h1', { className: 'text-3xl md:text-4xl font-bold text-gray-800 text-center mb-4' },
                        'Welcome to ',
                        h('span', { className: 'title-highlight' }, 'FieldCommand')
                    ),
                    h('p', { className: 'text-base md:text-lg text-gray-600 text-center mb-6' },
                        'The ultimate baseball defense planner for coaches. Position players, draw plays, and save strategies—all in one tool.'
                    ),
                    h('form', { onSubmit: handleEmailSubmit, className: 'validate' },
                        h('label', { htmlFor: 'unlock-email', className: 'sr-only' }, 'Email'),
                        h('input', {
                            type: 'email',
                            name: 'EMAIL',
                            id: 'unlock-email',
                            value: email,
                            onInput: (e) => setEmail(e.target.value),
                            className: 'border border-gray-300 p-3 rounded-lg w-full mb-4 text-base focus:outline-none focus:ring-2 focus:ring-green-500',
                            placeholder: 'Enter your email to try free',
                            required: true
                        }),
                        h('p', { id: 'email-error', className: 'error-message' }, 'Please enter a valid email address (e.g., user@domain.com).'),
                        h('input', {
                            type: 'submit',
                            value: 'Start Planning',
                            className: 'bg-green-600 text-white px-6 py-3 rounded-lg w-full text-base hover:bg-green-700 transition cursor-pointer'
                        })
                    ),
                    h('p', { className: 'text-sm text-gray-500 text-center mt-2' }, 'No credit card required—just your email to get started.')
                ),
                hasAccess && h(BaseballField, { setError })
            )
        );
    }

    render(h(App), document.getElementById('root'));
}

loadPreact();