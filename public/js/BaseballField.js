function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

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

const BaseballField = ({ app, db, auth, stripePromise, setError }) => {
    const { useState, useEffect } = window.PreactHooks;
    const { h } = window.Preact;
    const { DraggableMarker } = window;

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
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setLocalError] = useState(null); // Added local error state

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    useEffect(() => {
        if (!app || !db || !auth) {
            setLocalError("Firebase not initialized. Check console for details.");
            setError("Firebase not initialized. Check console for details.");
            return;
        }
        auth.signInAnonymously().then((userCredential) => {
            const userId = userCredential.user.uid;
            db.collection('users').doc(userId).collection('plays').onSnapshot((querySnapshot) => {
                const plays = [];
                querySnapshot.forEach((doc) => plays.push(doc.data()));
                setSavedPlays(plays);
                document.getElementById('loading').style.display = 'none';
            }, (err) => {
                setLocalError("Failed to load plays: " + err.message);
                setError("Failed to load plays: " + err.message);
            });
        }).catch((err) => {
            setLocalError("Authentication failed: " + err.message);
            setError("Authentication failed: " + err.message);
        });
    }, [app, db, auth, setError]);

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
            localStorage.setItem('fieldCommandUnlocked', 'true');
        } catch (err) {
            errorMessage.textContent = "Something went wrong. Please try again.";
            errorMessage.style.display = 'block';
            setLocalError("Email submission failed: " + err.message);
            setError("Email submission failed: " + err.message);
            gtag('event', 'unlock_app_error', { event_category: 'Engagement', event_label: 'Email Submission Error' });
        }
    };

    const handleDrag = debounce((id, newX, newY) => {
        setPositions(prev => ({ ...prev, [id]: { ...prev[id], x: newX, y: newY } }));
    }, 16);

    const savePlay = () => {
        if (!isPremium) return triggerPremiumModal();
        if (playName) {
            const newPlay = { name: playName, positions: { ...positions }, lines: [...lines], notes: '' };
            const newSavedPlays = [...savedPlays, newPlay];
            setSavedPlays(newSavedPlays);
            if (auth.currentUser) {
                db.collection('users').doc(auth.currentUser.uid).collection('plays').doc(playName).set(newPlay);
            }
            setPlayName('');
            setLocalError(null); // Clear error on success
            setError(null);
        }
    };

    const loadPlay = (play) => {
        setPositions(play.positions);
        setLines(play.lines || []);
        setPlayName(play.name);
        setLocalError(null);
        setError(null);
    };

    const deletePlay = (index) => {
        const playToDelete = savedPlays[index];
        const newSavedPlays = savedPlays.filter((_, i) => i !== index);
        setSavedPlays(newSavedPlays);
        if (auth.currentUser) {
            db.collection('users').doc(auth.currentUser.uid).collection('plays').doc(playToDelete.name).delete();
        }
        resetPositions();
        setLocalError(null);
        setError(null);
    };

    const resetPositions = () => {
        setPositions(initialPositions);
        setLines([]);
        setDrawing(false);
        setCurrentLine(null);
        setIsSolidMode(false);
        setIsDottedMode(false);
        setPlayName('');
        setLocalError(null);
        setError(null);
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
            if (result.error) {
                setLocalError(`Payment error: ${result.error.message}`);
                setError(`Payment error: ${result.error.message}`);
                gtag('event', 'payment_error', { event_category: 'Ecommerce', event_label: result.error.message });
            }
        } catch (err) {
            console.error('Error in handleGoPremium:', err);
            setLocalError('Failed to initiate payment. Please try again.');
            setError('Failed to initiate payment. Please try again.');
        }
    };

    const openNotesModal = (index) => {
        if (!isPremium) return triggerPremiumModal();
        setCurrentPlayIndex(index);
        setCurrentNotes(savedPlays[index].notes || '');
        setShowNotesModal(true);
    };

    const saveNotes = () => {
        if (currentPlayIndex !== null) {
            const updatedPlays = [...savedPlays];
            updatedPlays[currentPlayIndex] = { ...updatedPlays[currentPlayIndex], notes: currentNotes };
            setSavedPlays(updatedPlays);
            if (auth.currentUser) {
                db.collection('users').doc(auth.currentUser.uid).collection('plays').doc(updatedPlays[currentPlayIndex].name).set(updatedPlays[currentPlayIndex]);
            }
            setLocalError(null);
            setError(null);
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
        return h('div', { style: { textAlign: 'center', color: '#e53e3e' } }, [
            h('h1', null, 'Error'),
            h('p', null, error),
            h('p', null, 'Check the console (F12) for more details.')
        ]);
    }

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
                h('label', { htmlFor: 'unlock-email', style: { display: 'block', marginBottom: '0.5rem', fontWeight: '600' } }, 'Enter Your Email to Unlock'),
                h('input', {
                    type: 'email',
                    name: 'EMAIL',
                    id: 'unlock-email',
                    defaultValue: '',
                    style: { padding: '0.75rem', borderRadius: '8px', width: '100%', marginBottom: '1rem' },
                    placeholder: 'user@domain.com',
                    required: true,
                    'aria-required': 'true'
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
                    role: 'img',
                    'aria-label': 'Interactive baseball field for planning defensive strategies',
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
};

export { BaseballField, initialPositions };