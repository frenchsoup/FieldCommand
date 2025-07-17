console.log('Script started');

        function initApp() {
            console.log('initApp called');
            console.log('Preact:', window.Preact);
            console.log('PreactHooks:', window.PreactHooks);
            if (typeof window.Preact === 'undefined' || typeof window.Preact.h === 'undefined' || 
                typeof window.PreactHooks === 'undefined' || typeof window.PreactHooks.useState === 'undefined') {
                console.error('Preact or Hooks incomplete');
                document.getElementById('loading').innerHTML = '<div style="text-align: center; color: #e53e3e;">Failed to load app. Please check your connection and refresh.</div>';
                return;
            }
            console.log('Preact loaded');

            const { h, render } = window.Preact;
            const { useState, useEffect } = window.PreactHooks;

            const firebaseConfig = {
                apiKey: "AIzaSyCrSN8xc3KTGrc2gUzcqerL6SSYrF3LXZM",
                authDomain: "fieldcommand.firebaseapp.com",
                projectId: "fieldcommand",
                storageBucket: "fieldcommand.firebasestorage.app",
                messagingSenderId: "944064034218",
                appId: "1:944064034218:web:bb6744acdd0d66e9ba27d3",
                measurementId: "G-C3TQ7DWTX8"
            };

            let app, db, auth;
            try {
                console.log('Initializing Firebase');
                app = firebase.initializeApp(firebaseConfig);
                db = firebase.firestore();
                auth = firebase.auth();
                console.log('Firebase initialized');
            } catch (error) {
                console.error("Firebase initialization failed:", error);
            }

            let stripe;
            const stripePromise = new Promise((resolve) => {
                const checkStripe = () => {
                    if (window.Stripe) {
                        stripe = window.Stripe('pk_test_51RBeP6B311TbF66104ceu6MjOAU7FBEHtNyrCccF93ZJNgj4QGQPirUo28iyaWewu6xX9frkQrEwCR2kVdQb5XrC00aNVEvPJ5');
                        resolve(stripe);
                    } else {
                        setTimeout(checkStripe, 100);
                    }
                };
                checkStripe();
            });

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            const initialPositions = {
                pitcher: { x: 350, y: 308, label: 'P' },
                catcher: { x: 350, y: 455, label: 'C' },
                first: { x: 450, y: 275, label: '1B' },
                second: { x: 400, y: 205, label: '2B' },
                third: { x: 250, y: 275, label: '3B' },
                shortstop: { x: 300, y: 205, label: 'SS' },
                left: { x: 225, y: 125, label: 'LF' },
                center: { x: 350, y: 75, label: 'CF' },
                right: { x: 475, y: 125, label: 'RF' },
                baseball: { x: 450, y: 410, label: '⚾' },
                runner1: { x: 485, y: 410, label: 'BR' },
                runner2: { x: 520, y: 410, label: 'BR' },
                runner3: { x: 485, y: 445, label: 'BR' },
                runner4: { x: 520, y: 445, label: 'BR' }
            };

            function DraggableMarker({ id, x, y, label, color, onDrag }) {
                const [isDragging, setIsDragging] = useState(false);

                const getClientPosition = (e) => {
                    const isTouch = e.type.startsWith('touch');
                    return {
                        x: isTouch ? e.touches[0].clientX : e.clientX,
                        y: isTouch ? e.touches[0].clientY : e.clientY
                    };
                };

                const handleStart = (e) => {
                    setIsDragging(true);
                    e.preventDefault();
                    e.stopPropagation();
                };

                const handleMove = (e) => {
                    if (isDragging) {
                        const { x, y } = getClientPosition(e);
                        const svg = document.querySelector('svg');
                        const pt = svg.createSVGPoint();
                        pt.x = x;
                        pt.y = y;
                        const transformed = pt.matrixTransform(svg.getScreenCTM().inverse());
                        onDrag(id, transformed.x, transformed.y);
                        e.preventDefault();
                    }
                };

                const handleEnd = (e) => {
                    setIsDragging(false);
                    e.preventDefault();
                };

                useEffect(() => {
                    if (isDragging) {
                        document.addEventListener('mousemove', handleMove);
                        document.addEventListener('mouseup', handleEnd);
                        document.addEventListener('touchmove', handleMove, { passive: false });
                        document.addEventListener('touchend', handleEnd);
                    }
                    return () => {
                        document.removeEventListener('mousemove', handleMove);
                        document.removeEventListener('mouseup', handleEnd);
                        document.removeEventListener('touchmove', handleMove);
                        document.removeEventListener('touchend', handleEnd);
                    };
                }, [isDragging]);

                return h('g', {
                    onMouseDown: handleStart,
                    onTouchStart: handleStart,
                    className: 'cursor-move touch-none',
                    tabIndex: 0,
                    role: 'button',
                    'aria-label': `${label} marker at position ${x},${y}`
                }, [
                    h('circle', { cx: x, cy: y, r: id === 'baseball' ? 10 : 15, fill: color, stroke: 'white', strokeWidth: 2 }),
                    label && h('text', { x: x, y: y + (id === 'baseball' ? 4 : 5), textAnchor: 'middle', fill: 'white', fontSize: id === 'baseball' ? 14 : 12 }, label)
                ]);
            }

            function BaseballField() {
                const [positions, setPositions] = useState(initialPositions);
                const [playName, setPlayName] = useState('');
                const [savedPlays, setSavedPlays] = useState([]);
                const [isSolidMode, setIsSolidMode] = useState(false);
                const [isDottedMode, setIsDottedMode] = useState(false);
                const [drawing, setDrawing] = useState(false);
                const [currentLine, setCurrentLine] = useState(null);
                const [lines, setLines] = useState([]);
                const [showPremiumModal, setShowPremiumModal] = useState(false);
                const [showNotesModal, setShowNotesModal] = useState(false);
                const [currentPlayIndex, setCurrentPlayIndex] = useState(null);
                const [currentNotes, setCurrentNotes] = useState('');
                const [isPremium, setIsPremium] = useState(localStorage.getItem('isPremium') === 'true');
                const [showEmailGate, setShowEmailGate] = useState(localStorage.getItem('fieldCommandUnlocked') !== 'true' && !isPremium);
                const [error, setError] = useState(null);
                const [showSuccess, setShowSuccess] = useState(false);

                useEffect(() => {
                    console.log('useEffect running');
                    if (!app || !db || !auth) {
                        setError("Firebase not initialized. Check console for details.");
                        console.log('Firebase not initialized');
                        return;
                    }
                    console.log('Attempting anonymous sign-in');
                    auth.signInAnonymously().then((userCredential) => {
                        console.log('Signed in anonymously:', userCredential.user.uid);
                        const userId = userCredential.user.uid;
                        db.collection('users').doc(userId).collection('plays').onSnapshot((querySnapshot) => {
                            console.log('Firestore snapshot received');
                            const plays = [];
                            querySnapshot.forEach((doc) => plays.push(doc.data()));
                            setSavedPlays(plays);
                            document.getElementById('loading').style.display = 'none';
                            console.log('Loader hidden, plays loaded:', plays);
                        }, (error) => {
                            console.error('Error loading plays:', error);
                            setError("Failed to load plays: " + error.message);
                        });
                    }).catch((error) => {
                        console.error('Error signing in anonymously:', error);
                        setError("Authentication failed: " + error.message);
                    });
                }, []);

                const getClientPosition = (e) => {
                    const isTouch = e.type.startsWith('touch');
                    return {
                        x: isTouch ? e.touches[0].clientX : e.clientX,
                        y: isTouch ? e.touches[0].clientY : e.clientY
                    };
                };

                const triggerPremiumModal = () => {
                    gtag('event', 'premium_modal_view', { event_category: 'Premium', event_label: 'Premium Modal Displayed' });
                    setShowPremiumModal(true);
                };

                const handleEmailSubmit = async (e) => {
                    e.preventDefault();
                    const email = e.target.querySelector('#unlock-email').value;
                    const errorMessage = e.target.querySelector('#email-error');
                    const successMessage = e.target.querySelector('#email-success');

                    if (!emailRegex.test(email)) {
                        errorMessage.style.display = 'block';
                        return;
                    }
                    errorMessage.style.display = 'none';
                    gtag('event', 'unlock_app_attempt', { event_category: 'Engagement', event_label: 'Email Submission Attempt' });
                    const formData = new FormData();
                    formData.append('EMAIL', email);
                    formData.append('b_c3a7558bf8ddc22b2955671f5_1130a67a8c', '');
                    try {
                        await fetch('https://us20.list-manage.com/subscribe/post?u=c3a7558bf8ddc22b2955671f5&id=1130a67a8c&f_id=0076c2edf0', {
                            method: 'POST',
                            body: formData,
                            mode: 'no-cors'
                        });
                        setShowSuccess(true);
                        setTimeout(() => {
                            setShowSuccess(false);
                            setShowEmailGate(false);
                        }, 2000);
                        gtag('event', 'unlock_app_success', { event_category: 'Engagement', event_label: 'Email Submission Success', value: 1 });
                    } catch (error) {
                        console.error('Error submitting to Mailchimp:', error);
                        errorMessage.textContent = "Something went wrong. Please try again.";
                        errorMessage.style.display = 'block';
                        gtag('event', 'unlock_app_error', { event_category: 'Engagement', event_label: 'Email Submission Error' });
                    }
                    localStorage.setItem('fieldCommandUnlocked', 'true');
                };

                const handleDrag = (id, newX, newY) => {
                    setPositions(prev => ({ ...prev, [id]: { ...prev[id], x: newX, y: newY } }));
                };

                const savePlay = () => {
                    if (!isPremium) return triggerPremiumModal();
                    if (playName) {
                        const newPlay = { name: playName, positions: { ...positions }, lines: [...lines], notes: '' };
                        const newSavedPlays = [...savedPlays, newPlay];
                        setSavedPlays(newSavedPlays);
                        if (auth.currentUser) {
                            db.collection('users').doc(auth.currentUser.uid).collection('plays').doc(playName).set(newPlay)
                                .catch((error) => console.error('Error saving play:', error));
                        }
                        setPlayName('');
                    }
                };

                const loadPlay = (play) => {
                    setPositions(play.positions);
                    setLines(play.lines || []);
                    setPlayName(play.name);
                };

                const deletePlay = (index) => {
                    const playToDelete = savedPlays[index];
                    const newSavedPlays = savedPlays.filter((_, i) => i !== index);
                    setSavedPlays(newSavedPlays);
                    if (auth.currentUser) {
                        db.collection('users').doc(auth.currentUser.uid).collection('plays').doc(playToDelete.name).delete()
                            .catch((error) => console.error('Error deleting play:', error));
                    }
                    resetPositions();
                };

                const resetPositions = () => {
                    setPositions(initialPositions);
                    setLines([]);
                    setDrawing(false);
                    setCurrentLine(null);
                    setIsSolidMode(false);
                    setIsDottedMode(false);
                    setPlayName('');
                };

                const toggleSolidMode = () => {
                    if (!isPremium) return triggerPremiumModal();
                    setIsSolidMode(prev => {
                        const newState = !prev;
                        if (newState) setIsDottedMode(false);
                        return newState;
                    });
                };

                const toggleDottedMode = () => {
                    if (!isPremium) return triggerPremiumModal();
                    setIsDottedMode(prev => {
                        const newState = !prev;
                        if (newState) setIsSolidMode(false);
                        return newState;
                    });
                };

                const handleMouseDown = (e) => {
                    if (!isPremium || (!isSolidMode && !isDottedMode)) return;
                    const svg = e.currentTarget;
                    const { x, y } = getClientPosition(e);
                    const pt = svg.createSVGPoint();
                    pt.x = x;
                    pt.y = y;
                    const transformed = pt.matrixTransform(svg.getScreenCTM().inverse());
                    setDrawing(true);
                    setCurrentLine({ start: { x: transformed.x, y: transformed.y }, end: { x: transformed.x, y: transformed.y }, type: isSolidMode ? 'solid' : 'dotted' });
                    e.preventDefault();
                };

                const handleMouseMove = (e) => {
                    if (drawing) {
                        const svg = document.querySelector('svg');
                        const { x, y } = getClientPosition(e);
                        const pt = svg.createSVGPoint();
                        pt.x = x;
                        pt.y = y;
                        const transformed = pt.matrixTransform(svg.getScreenCTM().inverse());
                        setCurrentLine(prev => ({ ...prev, end: { x: transformed.x, y: transformed.y } }));
                        e.preventDefault();
                    }
                };

                const handleMouseUp = () => {
                    if (drawing && currentLine) {
                        setLines(prev => [...prev, currentLine]);
                        setDrawing(false);
                        setCurrentLine(null);
                    }
                };

                const undoLine = () => {
                    setLines(prev => prev.slice(0, -1));
                    setDrawing(false);
                    setCurrentLine(null);
                };

                const resetLines = () => {
                    setLines([]);
                    setDrawing(false);
                    setCurrentLine(null);
                };

                const handleGoPremium = async (plan) => {
                    gtag('event', 'premium_interest', { event_category: 'Premium', event_label: `Go Premium Clicked - ${plan}`, value: plan === 'monthly' ? 4.99 : plan === 'annual' ? 39.99 : 74.99 });
                    try {
                        const stripeInstance = await stripePromise;
                        let priceId, mode;
                        if (plan === 'monthly') { priceId = 'price_1RBeSTB311TbF661Wzqqc3OW'; mode = 'subscription'; }
                        else if (plan === 'annual') { priceId = 'price_1RBeT4B311TbF661BchpXFF1'; mode = 'subscription'; }
                        else if (plan === 'onetime') { priceId = 'price_1RBoExB311TbF661pkuJDeP5'; mode = 'payment'; }
                        localStorage.setItem('lastPremiumPlan', plan);
                        const result = await stripeInstance.redirectToCheckout({
                            lineItems: [{ price: priceId, quantity: 1 }],
                            mode: mode,
                            successUrl: window.location.href + '?premium_success=true',
                            cancelUrl: window.location.href
                        });
                        if (result.error) console.error('Stripe checkout error:', result.error.message);
                    } catch (error) {
                        console.error('Error in handleGoPremium:', error);
                    }
                };

                const openNotesModal = (index) => {
                    if (!isPremium) return triggerPremiumModal();
                    setCurrentPlayIndex(index);
                    setCurrentNotes(savedPlays[index].notes || '');
                    setShowNotesModal(true);
                };

                const saveNotes = () => {
                    if (currentPlayIndex !== W) {
                        const updatedPlays = [...savedPlays];
                        updatedPlays[currentPlayIndex] = { ...updatedPlays[currentPlayIndex], notes: currentNotes };
                        setSavedPlays(updatedPlays);
                        if (auth.currentUser) {
                            db.collection('users').doc(auth.currentUser.uid).collection('plays').doc(updatedPlays[currentPlayIndex].name).set(updatedPlays[currentPlayIndex])
                                .catch((error) => console.error('Error saving notes:', error));
                        }
                    }
                    setShowNotesModal(false);
                    setCurrentPlayIndex(null);
                    setCurrentNotes('');
                };

                useEffect(() => {
                    if (window.location.search.includes('premium_success=true')) {
                        gtag('event', 'purchase', {
                            event_category: 'Ecommerce',
                            event_label: 'Premium Purchase',
                            value: localStorage.getItem('lastPremiumPlan') === 'monthly' ? 4.99 : localStorage.getItem('lastPremiumPlan') === 'annual' ? 39.99 : 74.99,
                            currency: 'USD'
                        });
                        localStorage.setItem('isPremium', 'true');
                        setIsPremium(true);
                        setShowEmailGate(false);
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }, []);

                if (error) {
                    console.log('Rendering error state');
                    return h('div', { style: { textAlign: 'center', color: '#e53e3e' } }, [
                        h('h1', null, 'Error'),
                        h('p', null, error),
                        h('p', null, 'Check the console (F12) for more details.')
                    ]);
                }

                console.log('Rendering main UI');
                return h('div', null, [
                    h('div', { style: { textAlign: 'center', marginBottom: '1.5rem' } }, [
                        h('h1', { style: { fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' } }, [
                            'Welcome to ',
                            h('span', { className: 'title-highlight' }, 'FieldCommand')
                        ]),
                        h('p', { style: { fontSize: '1.125rem', color: '#4b5563', marginTop: '0.5rem' } }, 
                            'The ultimate baseball defense planner for coaches. Position players, draw plays, and save strategies—all in one tool.'
                        )
                    ]),
                    showEmailGate ? h('div', { style: { maxWidth: '28rem', margin: '0 auto', position: 'relative' } }, [
                        h('form', { onSubmit: handleEmailSubmit, className: 'validate', noValidate: true }, [
                            h('label', { htmlFor: 'unlock-email', className: 'sr-only' }, 'Email'),
                            h('input', {
                                type: 'email',
                                name: 'EMAIL',
                                id: 'unlock-email',
                                defaultValue: '',
                                style: { padding: '0.75rem', borderRadius: '8px', width: '100%', marginBottom: '1rem' },
                                placeholder: 'Enter your email to try free',
                                required: true
                            }),
                            h('p', { id: 'email-error', className: 'error-message' }, 'Please enter a valid email address (e.g., user@domain.com).'),
                            h('p', { id: 'email-success', className: `success-message ${showSuccess ? 'block' : ''}` }, 'Thanks for signing up! Starting now...'),
                            h('div', { style: { position: 'absolute', left: '-5000px' }, 'aria-hidden': true }, 
                                h('input', { type: 'text', name: 'b_c3a7558bf8ddc22b2955671f5_1130a67a8c', tabIndex: -1, defaultValue: '' })
                            ),
                            h('input', {
                                type: 'submit',
                                value: 'Start Planning',
                                className: 'button-green',
                                style: { padding: '0.75rem 1.5rem', borderRadius: '8px', width: '100%' }
                            })
                        ]),
                        h('p', { style: { fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' } }, 'No credit card required—just your email to get started.')
                    ]) : h('div', { className: 'container', style: { display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '600px' } }, [
                        h('div', { className: 'sidebar', style: { flex: '1 1 25%' } }, [
                            h('div', { style: { textAlign: 'center' } }, [
                                h('h1', { className: 'title-highlight', style: { fontSize: '1.5rem', fontWeight: 'bold' } }, 'FieldCommand'),
                                h('p', { style: { fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' } }, 'Baseball Defense Planner'),
                                h('p', { style: { fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' } }, 'Plan Winning Defensive Strategies')
                            ]),
                            h('input', {
                                type: 'text',
                                value: playName,
                                onChange: (e) => setPlayName(e.target.value),
                                placeholder: 'Enter play name',
                                style: { padding: '0.75rem', borderRadius: '8px', width: '100%', marginTop: '1rem' }
                            }),
                            h('button', {
                                onClick: savePlay,
                                className: isPremium ? 'button-green' : 'button',
                                style: { padding: '0.75rem', borderRadius: '8px', width: '100%', marginTop: '1rem', opacity: isPremium ? 1 : 0.5 },
                                disabled: !isPremium
                            }, `Save Play ${isPremium ? '' : '(Premium)'}`),
                            h('button', {
                                onClick: resetPositions,
                                className: 'button-gray',
                                style: { padding: '0.75rem', borderRadius: '8px', width: '100%', marginTop: '1rem' }
                            }, 'Reset Play'),
                            h('button', {
                                onClick: toggleSolidMode,
                                className: isPremium && isSolidMode ? 'button-green' : isPremium ? 'button' : 'button',
                                style: { padding: '0.75rem', borderRadius: '8px', width: '100%', marginTop: '1rem', opacity: isPremium ? 1 : 0.5 },
                                disabled: !isPremium
                            }, `Solid Line ${isSolidMode ? '(On)' : '(Off)'} ${isPremium ? '' : '(Premium)'}`),
                            h('button', {
                                onClick: toggleDottedMode,
                                className: isPremium && isDottedMode ? 'button-green' : isPremium ? 'button' : 'button',
                                style: { padding: '0.75rem', borderRadius: '8px', width: '100%', marginTop: '1rem', opacity: isPremium ? 1 : 0.5 },
                                disabled: !isPremium
                            }, `Dotted Line ${isDottedMode ? '(On)' : '(Off)'} ${isPremium ? '' : '(Premium)'}`),
                            h('div', { style: { display: 'flex', gap: '0.5rem', marginTop: '1rem' } }, [
                                h('button', {
                                    onClick: undoLine,
                                    className: 'button-gray',
                                    style: { padding: '0.75rem', borderRadius: '8px', flex: 1 }
                                }, 'Undo'),
                                h('button', {
                                    onClick: resetLines,
                                    className: 'button-gray',
                                    style: { padding: '0.75rem', borderRadius: '8px', flex: 1 }
                                }, 'Reset Lines')
                            ]),
                            !isPremium && h('button', {
                                onClick: () => setShowPremiumModal(true),
                                className: 'button-blue',
                                style: { padding: '0.75rem', borderRadius: '8px', width: '100%', marginTop: '1rem' }
                            }, 'Go Premium')
                        ]),
                        h('div', { style: { flex: '1', display: 'flex', justifyContent: 'center' } }, [
                            h('svg', {
                                width: '100%',
                                height: '100%',
                                viewBox: '150 25 400 450',
                                preserveAspectRatio: 'xMidYMid meet',
                                className: 'svg-shadow',
                                style: { maxWidth: '600px', border: '1px solid #e5e7eb', borderRadius: '8px' },
                                onMouseDown: handleMouseDown,
                                onMouseMove: handleMouseMove,
                                onMouseUp: handleMouseUp,
                                onTouchStart: handleMouseDown,
                                onTouchMove: handleMouseMove,
                                onTouchEnd: handleMouseUp
                            }, [
                                h('defs', null, [
                                    h('marker', { id: 'arrow', markerWidth: 10, markerHeight: 10, refX: 8, refY: 3, orient: 'auto' }, 
                                        h('path', { d: 'M0,0 L0,6 L9,3 Z', fill: 'black' })
                                    )
                                ]),
                                h('path', { d: 'M 350 425 L 200 275 Q 250 175 350 175 Q 450 175 500 275 L 350 425 Z', fill: 'burlywood' }),
                                h('path', { d: 'M 350 425 L 250 325 L 350 225 L 450 325 Z', fill: 'rgba(0, 128, 0, 0.8)' }),
                                h('circle', { cx: 350, cy: 325, r: 20, fill: 'burlywood' }),
                                h('rect', { x: 340, y: 320, width: 20, height: 5, fill: 'white' }),
                                h('path', { d: 'M 340 417 L 360 417 L 360 432 L 350 436 L 340 432 Z', fill: 'white' }),
                                h('rect', { x: 240, y: 315, width: 15, height: 15, fill: 'white', transform: 'rotate(45 250 325)' }),
                                h('rect', { x: 340, y: 215, width: 15, height: 15, fill: 'white', transform: 'rotate(45 350 225)' }),
                                h('rect', { x: 440, y: 315, width: 15, height: 15, fill: 'white', transform: 'rotate(45 450 325)' }),
                                h('line', { x1: 350, y1: 425, x2: 250, y2: 325, stroke: 'white', strokeWidth: 2 }),
                                h('line', { x1: 250, y1: 325, x2: 350, y2: 225, stroke: 'white', strokeWidth: 2 }),
                                h('line', { x1: 350, y1: 225, x2: 450, y2: 325, stroke: 'white', strokeWidth: 2 }),
                                h('line', { x1: 450, y1: 325, x2: 350, y2: 425, stroke: 'white', strokeWidth: 2 }),
                                lines.map((line, index) => h('g', { key: index }, [
                                    h('line', {
                                        x1: line.start.x,
                                        y1: line.start.y,
                                        x2: line.end.x,
                                        y2: line.end.y,
                                        stroke: 'black',
                                        strokeWidth: 2,
                                        strokeDasharray: line.type === 'dotted' ? '5,5' : 'none',
                                        markerEnd: 'url(#arrow)'
                                    })
                                ])),
                                currentLine && h('g', null, [
                                    h('line', {
                                        x1: currentLine.start.x,
                                        y1: currentLine.start.y,
                                        x2: currentLine.end.x,
                                        y2: currentLine.end.y,
                                        stroke: 'black',
                                        strokeWidth: 2,
                                        strokeDasharray: currentLine.type === 'dotted' ? '5,5' : 'none',
                                        markerEnd: 'url(#arrow)'
                                    })
                                ]),
                                Object.entries(positions).map(([id, { x, y, label }]) => 
                                    h(DraggableMarker, {
                                        key: id,
                                        id: id,
                                        x: x,
                                        y: y,
                                        label: label,
                                        color: id === 'baseball' ? 'white' : id.includes('runner') ? 'black' : 'red',
                                        onDrag: handleDrag
                                    })
                                )
                            ])
                        ]),
                        h('div', { className: 'sidebar', style: { flex: '1 1 25%' } }, [
                            h('h2', { style: { fontSize: '1.125rem', fontWeight: '600', textAlign: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' } }, 'Saved Plays'),
                            h('div', { style: { flex: 1, overflowY: 'auto' } }, [
                                h('div', { className: 'grid', style: { gap: '0.5rem' } }, 
                                    savedPlays.map((play, index) => h('div', { key: index, className: 'tooltip-container', style: { display: 'flex', gap: '0.5rem', alignItems: 'center' } }, [
                                        h('button', {
                                            onClick: () => loadPlay(play),
                                            style: { flex: 1, background: '#dbeafe', padding: '0.5rem', borderRadius: '8px', textAlign: 'left' },
                                            title: play.name
                                        }, play.name),
                                        h('button', {
                                            onClick: () => openNotesModal(index),
                                            className: 'button-yellow',
                                            style: { padding: '0.25rem 0.5rem', borderRadius: '8px' }
                                        }, '📝'),
                                        play.notes && h('span', { className: 'tooltip' }, play.notes),
                                        h('button', {
                                            onClick: () => deletePlay(index),
                                            className: 'button-red',
                                            style: { padding: '0.25rem 0.5rem', borderRadius: '8px' }
                                        }, 'Delete')
                                    ]))
                                )
                            ])
                        ]),
                        showPremiumModal && h('div', { className: 'modal' }, [
                            h('div', { className: 'modal-content' }, [
                                h('h2', { style: { fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' } }, 'Upgrade to Premium'),
                                h('p', { style: { color: '#4b5563', marginBottom: '1rem' } }, 'Unlock saving plays, drawing lines, and adding notes!'),
                                h('button', {
                                    onClick: () => handleGoPremium('monthly'),
                                    className: 'button-blue',
                                    style: { padding: '0.5rem 1rem', borderRadius: '8px', display: 'block', margin: '0 auto 0.5rem' }
                                }, '$4.99/month'),
                                h('button', {
                                    onClick: () => handleGoPremium('annual'),
                                    className: 'button-blue',
                                    style: { padding: '0.5rem 1rem', borderRadius: '8px', display: 'block', margin: '0 auto 0.5rem' }
                                }, '$39.99/year (Save 33%)'),
                                h('button', {
                                    onClick: () => handleGoPremium('onetime'),
                                    className: 'button-blue',
                                    style: { padding: '0.5rem 1rem', borderRadius: '8px', display: 'block', margin: '0 auto 0.5rem' }
                                }, '$74.99 One-Time Full Access'),
                                h('div', { style: { display: 'flex', justifyContent: 'center', marginTop: '1rem' } }, [
                                    h('button', {
                                        onClick: () => setShowPremiumModal(false),
                                        className: 'button-gray',
                                        style: { padding: '0.5rem 1rem', borderRadius: '8px' }
                                    }, 'Cancel')
                                ])
                            ])
                        ]),
                        showNotesModal && h('div', { className: 'modal' }, [
                            h('div', { className: 'modal-content' }, [
                                h('h2', { style: { fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' } }, 'Play Notes'),
                                h('textarea', {
                                    value: currentNotes,
                                    onChange: (e) => setCurrentNotes(e.target.value),
                                    placeholder: 'Add notes (e.g., 2 outs, runner on 3rd)',
                                    style: { padding: '0.75rem', borderRadius: '8px', width: '100%', height: '8rem', resize: 'none', marginBottom: '1rem' }
                                }),
                                h('div', { style: { display: 'flex', justifyContent: 'center', gap: '1rem' } }, [
                                    h('button', {
                                        onClick: saveNotes,
                                        className: 'button-green',
                                        style: { padding: '0.5rem 1rem', borderRadius: '8px' }
                                    }, 'Save Notes'),
                                    h('button', {
                                        onClick: () => setShowNotesModal(false),
                                        className: 'button-gray',
                                        style: { padding: '0.5rem 1rem', borderRadius: '8px' }
                                    }, 'Cancel')
                                ])
                            ])
                        ])
                    ])
                ]);
            }

            console.log('Rendering app');
            render(h(BaseballField), document.getElementById('root'));
        }

// Polling with timeout
function waitForPreact() {
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();

    function checkPreact() {
        if (typeof window.Preact !== 'undefined' && typeof window.Preact.h !== 'undefined' && 
            typeof window.PreactHooks !== 'undefined' && typeof window.PreactHooks.useState !== 'undefined') {
            console.log('Preact globals ready');
            initApp();
        } else if (Date.now() - startTime > maxWaitTime) {
            console.error('Preact globals timeout');
            document.getElementById('loading').innerHTML = '<div style="text-align: center; color: #e53e3e;">Failed to load app. Please refresh or check your connection.</div>';
        } else {
            console.log('Waiting for Preact globals...');
            setTimeout(checkPreact, 500);
        }
    }
    checkPreact();
}

console.log('Starting Preact wait');
waitForPreact();