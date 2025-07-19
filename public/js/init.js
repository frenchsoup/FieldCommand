async function initializeFirebase() {
    try {
        await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
        await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js');
        await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js');
        const firebaseConfig = {
            apiKey: "AIzaSyCrSN8xc3KTGrc2gUzcqerL6SSYrF3LXZM",
            authDomain: "fieldcommand.firebaseapp.com",
            projectId: "fieldcommand",
            storageBucket: "fieldcommand.firebasestorage.app",
            messagingSenderId: "944064034218",
            appId: "1:944064034218:web:bb6744acdd0d66e9ba27d3",
            measurementId: "G-C3TQ7DWTX8"
        };
        const app = firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const auth = firebase.auth();
        return { app, db, auth };
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        document.getElementById('loading').innerHTML = `
            <div style="text-align: center; color: #e53e3e;">
                Failed to connect to the server. Please try again later or contact support.
            </div>`;
        return null;
    }
}

async function loadPreact() {
    try {
        // Load core Preact module first
        const preactModule = await import('https://esm.sh/preact@10.23.2');
        window.Preact = preactModule;
        window.preact = preactModule; // Ensure lowercase for hooks compatibility
        // Load hooks module after core Preact
        const hooksModule = await import('https://esm.sh/preact@10.23.2/hooks');
        if (!hooksModule) {
            throw new Error('Preact hooks module failed to load');
        }
        window.PreactHooks = hooksModule;
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
    const { app, db, auth } = firebaseInstance;

    const stripeKey = window.ENV?.STRIPE_PUBLIC_KEY || 'pk_test_51RBeP6B311TbF66104ceu6MjOAU7FBEHtNyrCccF93ZJNgj4QGQPirUo28iyaWewu6xX9frkQrEwCR2kVdQb5XrC00aNVEvPJ5';
    if (!stripeKey || stripeKey === '[STRIPE_PUBLIC_KEY]') {
        console.error('Stripe public key is missing or not configured in Netlify environment variables.');
        document.getElementById('loading').innerHTML = `
            <div style="text-align: center; color: #e53e3e;">
                Payment system unavailable. Please try again later or contact support.
            </div>`;
        return;
    }
    const stripePromise = import('https://js.stripe.com/v3/').then(() => {
        return window.Stripe(stripeKey);
    }).catch(error => {
        console.error('Stripe load failed:', error);
        document.getElementById('loading').innerHTML = `
            <div style="text-align: center; color: #e53e3e;">
                Payment system unavailable. Please try again later or contact support.
            </div>`;
        return null;
    });

    const { h, render } = window.Preact;
    const { useState } = window.PreactHooks;

    function App() {
        const [error, setError] = useState(null);
        return h(BaseballField, { app, db, auth, stripePromise, setError });
    }

    render(h(App), document.getElementById('root'));
}

loadPreact();