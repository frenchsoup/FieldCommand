const { h, Component } = window.preact;
const { useState, useEffect } = window.preactHooks;

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
  baseball: { x: 350, y: 325, label: '⚾' }, // Moved to pitcher’s circle
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

  const handleEnd = () => {
    setIsDragging(false);
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
  }, [isDragging, handleMove, handleEnd]);

  const radius = id === 'baseball' ? 8 : 12;
  return h('g', {
    onMouseDown: handleStart,
    onTouchStart: handleStart,
    className: 'cursor-move touch-none',
    tabIndex: '0',
    role: 'button',
    'aria-label': `${label} marker at position ${x},${y}`
  },
    h('circle', {
      cx: x,
      cy: y,
      r: radius,
      fill: color,
      stroke: 'white',
      strokeWidth: '2'
    }),
    label && h('text', {
      x: x,
      y: y - (radius / 2) + 2, // Centered vertically within circle
      textAnchor: 'middle',
      fill: 'white',
      fontSize: id === 'baseball' ? 12 : 10
    }, label)
  );
}

const BaseballField = ({ setError }) => {
  const [positions, setPositions] = useState(() => {
    const saved = sessionStorage.getItem('fieldPositions');
    return saved ? JSON.parse(saved) : initialPositions;
  });
  const [isPremium, setIsPremium] = useState(sessionStorage.getItem('isPremium') === 'true');
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [isSolidMode, setIsSolidMode] = useState(false);
  const [isDottedMode, setIsDottedMode] = useState(false);
  const [error, setLocalError] = useState(null);

  useEffect(() => {
    setError(error);
  }, [error, setError]);

  useEffect(() => {
    try {
      sessionStorage.setItem('fieldPositions', JSON.stringify(positions));
    } catch (e) {
      console.error('Failed to save positions:', e);
      setLocalError('Failed to save positions');
    }
  }, [positions]);

  const handleDrag = (id, newX, newY) => {
    setPositions(prev => ({
      ...prev,
      [id]: { ...prev[id], x: newX, y: newY }
    }));
  };

  const handleMouseDown = (e) => {
    if (isPremium && (isSolidMode || isDottedMode)) {
      const svg = e.currentTarget;
      const { x, y } = getClientPosition(e);
      const pt = svg.createSVGPoint();
      pt.x = x;
      pt.y = y;
      const transformed = pt.matrixTransform(svg.getScreenCTM().inverse());
      setDrawing(true);
      setCurrentLine({
        start: { x: transformed.x, y: transformed.y },
        end: { x: transformed.x, y: transformed.y },
        type: isDottedMode ? 'dotted' : 'solid' // Use isDottedMode to determine type
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (drawing) {
      const svg = document.querySelector('svg');
      const { x, y } = getClientPosition(e);
      const pt = svg.createSVGPoint();
      pt.x = x;
      pt.y = y;
      const transformed = pt.matrixTransform(svg.getScreenCTM().inverse());
      setCurrentLine(prev => ({
        ...prev,
        end: { x: transformed.x, y: transformed.y }
      }));
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

  const getClientPosition = (e) => {
    const isTouch = e.type.startsWith('touch');
    return {
      x: isTouch ? e.touches[0].clientX : e.clientX,
      y: isTouch ? e.touches[0].clientY : e.clientY
    };
  };

  const toggleSolidMode = () => {
    if (!isPremium) return;
    setIsSolidMode(prev => {
      const newState = !prev;
      if (newState) setIsDottedMode(false);
      return newState;
    });
  };

  const toggleDottedMode = () => {
    if (!isPremium) return;
    setIsDottedMode(prev => {
      const newState = !prev;
      if (newState) setIsSolidMode(false);
      return newState;
    });
  };

  const resetPositions = () => {
    setPositions(initialPositions);
    setLines([]);
    setDrawing(false);
    setCurrentLine(null);
    setIsSolidMode(false);
    setIsDottedMode(false);
  };

  return h('div', { className: 'container p-4 md:p-6 w-full max-w-[1200px] flex flex-col md:flex-row gap-4 min-h-[600px]' },
    h('div', { className: 'w-full md:w-1/4 p-4 flex flex-col gap-4 sidebar' },
      h('div', { className: 'text-center' },
        h('h1', { className: 'text-xl md:text-2xl font-bold title-highlight' }, 'FieldCommand'),
        h('p', { className: 'text-sm text-gray-600 mt-1' }, 'Baseball Defense Planner'),
        h('p', { className: 'text-xs text-gray-500 mt-1' }, 'Plan Winning Defensive Strategies')
      ),
      h('button', {
        onClick: resetPositions,
        className: 'bg-gray-600 text-white px-4 py-3 rounded-lg text-base hover:bg-gray-700 transition'
      }, 'Reset Play'),
      h('button', {
        onClick: toggleSolidMode,
        className: `px-4 py-3 rounded-lg text-base ${isPremium && isSolidMode ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'} ${!isPremium ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'} transition`
      }, 'Solid Line', isPremium ? '' : ' (Premium)'),
      h('button', {
        onClick: toggleDottedMode,
        className: `px-4 py-3 rounded-lg text-base ${isPremium && isDottedMode ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'} ${!isPremium ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'} transition`
      }, 'Dotted Line', isPremium ? '' : ' (Premium)'),
      !isPremium && h('button', {
        onClick: () => setIsPremium(true), // Mock premium for now
        className: 'bg-blue-600 text-white px-4 py-3 rounded-lg text-base hover:bg-blue-700 transition'
      }, 'Go Premium')
    ),
    h('div', { className: 'flex-1 flex justify-center w-full' },
      h('svg', {
        width: '100%',
        height: '100%',
        viewBox: '150 25 400 450',
        preserveAspectRatio: 'xMidYMid meet',
        className: 'border rounded-lg svg-shadow w-full max-w-[600px] h-auto',
        style: { backgroundColor: 'rgba(0, 128, 0, 0.8)', touchAction: 'none' },
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onTouchStart: handleMouseDown,
        onTouchMove: handleMouseMove,
        onTouchEnd: handleMouseUp
      },
        h('defs', null,
          h('marker', {
            id: 'arrow',
            markerWidth: '10',
            markerHeight: '10',
            refX: '8',
            refY: '3',
            orient: 'auto'
          }, h('path', { d: 'M0,0 L0,6 L9,3 Z', fill: 'black' }))
        ),
        h('path', {
          d: 'M 350 425 L 200 275 Q 250 175 350 175 Q 450 175 500 275 L 350 425 Z',
          fill: 'burlywood'
        }),
        h('path', {
          d: 'M 350 425 L 250 325 L 350 225 L 450 325 Z',
          fill: 'rgba(0, 128, 0, 0.8)'
        }),
        h('circle', { cx: '350', cy: '325', r: '20', fill: 'burlywood' }), // Pitcher’s circle
        h('rect', { x: '340', y: '320', width: '20', height: '5', fill: 'white' }),
        h('path', { d: 'M 340 417 L 360 417 L 360 432 L 350 436 L 340 432 Z', fill: 'white' }),
        h('rect', { x: '240', y: '315', width: '15', height: '15', fill: 'white', transform: 'rotate(45 250 325)' }),
        h('rect', { x: '340', y: '215', width: '15', height: '15', fill: 'white', transform: 'rotate(45 350 225)' }),
        h('rect', { x: '440', y: '315', width: '15', height: '15', fill: 'white', transform: 'rotate(45 450 325)' }),
        h('line', { x1: '350', y1: '425', x2: '250', y2: '325', stroke: 'white', strokeWidth: '2' }),
        h('line', { x1: '250', y1: '325', x2: '350', y2: '225', stroke: 'white', strokeWidth: '2' }),
        h('line', { x1: '350', y1: '225', x2: '450', y2: '325', stroke: 'white', strokeWidth: '2' }),
        h('line', { x1: '450', y1: '325', x2: '350', y2: '425', stroke: 'white', strokeWidth: '2' }),
        lines.map((line, index) => h('g', { key: index },
          h('line', {
            x1: line.start.x,
            y1: line.start.y,
            x2: line.end.x,
            y2: line.end.y,
            stroke: 'black',
            strokeWidth: '2',
            strokeDasharray: line.type === 'dotted' ? '5,5' : 'none',
            markerEnd: 'url(#arrow)' // Add arrow at end
          })
        )),
        currentLine && h('g', null,
          h('line', {
            x1: currentLine.start.x,
            y1: currentLine.start.y,
            x2: currentLine.end.x,
            y2: currentLine.end.y,
            stroke: 'black',
            strokeWidth: '2',
            strokeDasharray: currentLine.type === 'dotted' ? '5,5' : 'none',
            markerEnd: 'url(#arrow)' // Add arrow at end
          })
        ),
        Object.entries(positions).map(([id, { x, y, label }]) => h(DraggableMarker, {
          key: id,
          id: id,
          x: x,
          y: y,
          label: label,
          color: id === 'baseball' ? 'white' : id.includes('runner') ? 'black' : 'red',
          onDrag: handleDrag
        }))
      )
    ),
    error && h('div', { className: 'error-message text-center mt-2' }, error)
  );
};

export { BaseballField };