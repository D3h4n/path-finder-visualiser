import React, { useState, useEffect } from 'react';

interface Props {
  pos: [number, number];
  value: number;
  handleUpdateSquare: (pos: [number, number]) => void;
}

export default function Square({ pos, value, handleUpdateSquare }: Props) {
  const [backgroundColor, setBackgroundColor] = useState<string>();

  const handleUpdateBackground = () => {
    let color = '';

    switch (value) {
      case 1:
        color = 'red';
        break;

      case 2:
        color = 'red';
        break;

      case 3:
        color = 'gray';
        break;

      default:
        color = 'white';
        break;
    }

    setBackgroundColor(color);
  };

  useEffect(handleUpdateBackground, [value]);

  return (
    <div
      style={{
        height: `2rem`,
        width: `2rem`,
        backgroundColor,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        outline: '1px solid',
      }}
      onClick={() => {
        handleUpdateSquare(pos);
      }}
    >
      {value}
    </div>
  );
}
