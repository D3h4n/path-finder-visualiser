import React, { useState, useEffect, useCallback } from 'react';
import Square from './Square';
import './App.css';

const SIZE = 15;

function App() {
  const [squares, setSquares] = useState<Map<number, number>>(new Map());
  const [state, setState] = useState(0);
  const [start, setStart] = useState(-1);
  const [end, setEnd] = useState(-1);

  const reset = () => {
    setSquares(new Map([...new Array(SIZE ** 2)].map((_, idx) => [idx, 0])));
    setState(0);
  };

  const getHeader = useCallback(() => {
    switch (state) {
      case 0:
        return 'Select start position';

      case 1:
        return 'Select end position';

      case 2:
        return 'Draw walls';
    }
  }, [state]);

  const handleUpdateSquare = useCallback(
    ([x, y]) => {
      setSquares((_prev) => {
        const pos = y * SIZE + x;
        const prev = new Map(_prev);

        switch (state) {
          case 0:
            prev.set(pos, 1);
            setState(1);
            setStart(pos);
            break;

          case 1:
            prev.set(pos, 2);
            setState(2);
            setEnd(pos);
            break;

          case 2:
            if (pos === start || pos === end) break;
            prev.set(pos, 3);
            break;
        }

        return prev;
      });
    },
    [setSquares, state, end, start]
  );

  const handleStart = () => {
    console.log(`Start: ${start}, End: ${end}`);
  };

  useEffect(reset, []);
  return (
    <>
      <h2 style={{ textAlign: 'center' }}>{getHeader()}</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${SIZE}, auto)`,
          justifyContent: 'center',
          alignSelf: 'center',
        }}
      >
        {[...squares.entries()].map(([pos, value]) => (
          <Square
            key={pos}
            pos={[pos % SIZE, Math.floor(pos / SIZE)]}
            value={value}
            handleUpdateSquare={handleUpdateSquare}
          />
        ))}
      </div>
      <div
        style={{
          position: 'fixed',
          top: '50vh',
          right: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <button onClick={() => reset()}>Reset</button>
        <button
          style={{ display: state < 2 ? 'none' : 'block' }}
          onClick={() => handleStart()}
        >
          Start
        </button>
      </div>
    </>
  );
}

export default App;
