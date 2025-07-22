async function initializeFirebase() {
    try {
        await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
        await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js');
        const firebaseConfig = {
            apiKey: "${FIREBASE_API_KEY}",
            authDomain: "${FIREBASE_AUTH_DOMAIN}",
            projectId: "${FIREBASE_PROJECT_ID}",
            storageBucket: "${FIREBASE_STORAGE_BUCKET}",
            messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
            appId: "${FIREBASE_APP_ID}",
            measurementId: "${FIREBASE_MEASUREMENT_ID}"
        };
        const app = firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        return { app, auth };
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        document.getElementById('loading').innerHTML = `
            <div style="text-align: center; color: #e53e3e;">
                Failed to initialize Firebase. Please check your configuration and try again later.
            </div>`;
        return null;
    }
}

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
                Unable to load the app. Please check your internet connection and refresh, or contact support at support@fieldcommand.netlify.app.
            </div>`;
    }
}

async function initApp() {
    const { DraggableMarker } = await import('./DraggableMarker.js');
    const { BaseballField } = await import('./BaseballField.js');
    window.DraggableMarker = DraggableMarker;
    const firebaseInstance = await initializeFirebase();
    if (!firebaseInstance) return;
    const { app, auth } = firebaseInstance;

    const stripeKey = "${STRIPE_PUBLIC_KEY}" || 'pk_test_51RBeP6B311TbF66104ceu6MjOAU7FBEHtNyrCccF93ZJNgj4QGQPirUo28iyaWewu6xX9frkQrEwCR2kVdQb5XrC00aNVEvPJ5';
    const stripePromise = import('https://js.stripe.com/v3/').then(() => {
        return window.Stripe(stripeKey);
    }).catch(error => {
        console.error('Stripe load failed:', error);
        return null;
    });

    const { h, render } = window.preact;
    const { useState } = window.preactHooks;

    function App() {
        const [error, setError] = useState(null);
        return h(BaseballField, { app, auth, stripePromise, setError });
    }

    render(h(App), document.getElementById('root'));
}

loadPreact();