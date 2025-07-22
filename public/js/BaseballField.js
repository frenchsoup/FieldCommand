const { h, Component } = window.preact;
const { useState, useEffect } = window.preactHooks;

// Load saved positions from session storage or default
const loadPositions = () => {
  try {
    const saved = sessionStorage.getItem('fieldPositions');
    return saved ? JSON.parse(saved) : {
      marker: { x: 50, y: 50 },
      pitcher: { x: 400, y: 100 },
      firstBase: { x: 700, y: 200 },
      secondBase: { x: 400, y: 300 },
      thirdBase: { x: 100, y: 200 },
      shortstop: { x: 300, y: 250 },
      leftField: { x: 100, y: 350 },
      centerField: { x: 400, y: 350 },
      rightField: { x: 700, y: 350 },
      runner1: { x: 600, y: 200 },
      runner2: { x: 500, y: 300 },
      ball: { x: 450, y: 150 },
    };
  } catch (e) {
    console.error('Failed to load positions:', e);
    return {
      marker: { x: 50, y: 50 },
      pitcher: { x: 400, y: 100 },
      firstBase: { x: 700, y: 200 },
      secondBase: { x: 400, y: 300 },
      thirdBase: { x: 100, y: 200 },
      shortstop: { x: 300, y: 250 },
      leftField: { x: 100, y: 350 },
      centerField: { x: 400, y: 350 },
      rightField: { x: 700, y: 350 },
      runner1: { x: 600, y: 200 },
      runner2: { x: 500, y: 300 },
      ball: { x: 450, y: 150 },
    };
  }
};

const DraggableElement = ({ id, x, y, onDrag, color }) => {
  return h('div', {
    style: {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: '15px',
      height: '15px',
      background: color || 'red',
      borderRadius: '50%',
      cursor: 'move',
    },
    onMouseDown: onDrag,
  });
};

const BaseballField = ({ setError }) => {
  const [positions, setPositions] = useState(loadPositions());
  const [error, setLocalError] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawStyle, setDrawStyle] = useState('solid'); // 'solid' or 'dotted'

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

  useEffect(() => {
    const checkPremium = () => setTimeout(() => setIsPremium(true), 1000);
    checkPremium();
  }, []);

  const handleDrag = (id, e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = positions[id];

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setPositions(prev => ({
        ...prev,
        [id]: { x: startPos.x + dx, y: startPos.y + dy }
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleDrawStart = (e) => {
    if (isPremium) {
      setIsDrawing(true);
      setDrawStart({ x: e.clientX - 400, y: e.clientY - 100 }); // Offset to field center
    }
  };

  const handleDrawMove = (e) => {
    if (isDrawing && isPremium) {
      const end = { x: e.clientX - 400, y: e.clientY - 100 };
      setLines(prev => [...prev, { start: drawStart, end, style: drawStyle }]);
    }
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
    setDrawStart(null);
  };

  return h('div', null,
    h('div', {
      style: { position: 'relative', width: '800px', height: '400px', border: '1px solid black', margin: '20px auto' },
      onMouseDown: handleDrawStart,
      onMouseMove: handleDrawMove,
      onMouseUp: handleDrawEnd,
      onMouseLeave: handleDrawEnd
    },
      // Field positions
      h(DraggableElement, { id: 'pitcher', x: positions.pitcher.x, y: positions.pitcher.y, onDrag: (e) => handleDrag('pitcher', e), color: 'blue' }),
      h(DraggableElement, { id: 'firstBase', x: positions.firstBase.x, y: positions.firstBase.y, onDrag: (e) => handleDrag('firstBase', e), color: 'blue' }),
      h(DraggableElement, { id: 'secondBase', x: positions.secondBase.x, y: positions.secondBase.y, onDrag: (e) => handleDrag('secondBase', e), color: 'blue' }),
      h(DraggableElement, { id: 'thirdBase', x: positions.thirdBase.x, y: positions.thirdBase.y, onDrag: (e) => handleDrag('thirdBase', e), color: 'blue' }),
      h(DraggableElement, { id: 'shortstop', x: positions.shortstop.x, y: positions.shortstop.y, onDrag: (e) => handleDrag('shortstop', e), color: 'blue' }),
      h(DraggableElement, { id: 'leftField', x: positions.leftField.x, y: positions.leftField.y, onDrag: (e) => handleDrag('leftField', e), color: 'blue' }),
      h(DraggableElement, { id: 'centerField', x: positions.centerField.x, y: positions.centerField.y, onDrag: (e) => handleDrag('centerField', e), color: 'blue' }),
      h(DraggableElement, { id: 'rightField', x: positions.rightField.x, y: positions.rightField.y, onDrag: (e) => handleDrag('rightField', e), color: 'blue' }),
      // Runners
      h(DraggableElement, { id: 'runner1', x: positions.runner1.x, y: positions.runner1.y, onDrag: (e) => handleDrag('runner1', e), color: 'green' }),
      h(DraggableElement, { id: 'runner2', x: positions.runner2.x, y: positions.runner2.y, onDrag: (e) => handleDrag('runner2', e), color: 'green' }),
      // Ball
      h(DraggableElement, { id: 'ball', x: positions.ball.x, y: positions.ball.y, onDrag: (e) => handleDrag('ball', e), color: 'yellow' }),
      // Draw lines
      lines.map((line, index) => h('div', {
        key: index,
        style: {
          position: 'absolute',
          left: `${400 + line.start.x}px`,
          top: `${100 + line.start.y}px`,
          width: `${Math.sqrt((line.end.x - line.start.x) ** 2 + (line.end.y - line.start.y) ** 2)}px`,
          height: '2px',
          background: line.style === 'dotted' ? 'black dotted' : 'black',
          transform: `rotate(${Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x) * 180 / Math.PI}deg)`,
          transformOrigin: '0 0',
        }
      }))
    ),
    isPremium && h('div', { style: { color: '#10b981', marginTop: '10px', textAlign: 'center' } }, 'Premium: Toggle lines (solid/dotted) - Coming Soon'),
    error && h('div', { style: { color: '#e53e3e', marginTop: '10px', textAlign: 'center' }, className: 'error-message' }, error)
  );
};

export { BaseballField };