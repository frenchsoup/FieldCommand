function memo(fn) {
    let lastProps, lastResult;
    return (props) => {
        const propsStr = JSON.stringify(props);
        if (lastProps === propsStr) return lastResult;
        lastProps = propsStr;
        lastResult = fn(props);
        return lastResult;
    };
}

const DraggableMarker = memo(({ id, x, y, label, color, onDrag }) => {
    const [isDragging, setIsDragging] = window.PreactHooks.useState(false);

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

    window.PreactHooks.useEffect(() => {
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

    return window.Preact.h('g', {
        onMouseDown: handleStart,
        onTouchStart: handleStart,
        onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') handleStart(e);
        },
        className: 'cursor-move touch-none',
        tabIndex: 0,
        role: 'button',
        'aria-label': `${label} marker at position ${x},${y}`
    }, [
        window.Preact.h('circle', { cx: x, cy: y, r: id === 'baseball' ? 10 : 15, fill: color, stroke: 'white', strokeWidth: 2 }),
        label && window.Preact.h('text', { x: x, y: y + (id === 'baseball' ? 4 : 5), textAnchor: 'middle', fill: 'white', fontSize: id === 'baseball' ? 14 : 12 }, label)
    ]);
});

export { DraggableMarker };