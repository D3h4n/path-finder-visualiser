import React, { useState, useEffect, useCallback } from 'react';
import Square, { Node, NodeType } from './Square';
import './App.css';
import Heap from 'heap-js';

export const SIZE = 10;

enum Operation {
  SelectStart,
  SelectEnd,
  SelectWalls,
  FindPath,
  PathFound,
  PathNotFound,
}

interface State {
  operation: number;
  start?: string;
  end?: [number, number];
  diagonals: boolean;
}

function App() {
  const [squares, setSquares] = useState<Map<string, Node>>(new Map());
  const [state, setState] = useState<State>({
    operation: Operation.SelectStart,
    diagonals: false,
  });

  const reset = () => {
    setSquares(
      new Map(
        [...new Array(SIZE ** 2)].map((_, idx) => {
          const x = idx % SIZE;
          const y = Math.floor(idx / SIZE);

          return [`${x},${y}`, new Node(x, y)];
        })
      )
    );

    setState((prev) => ({
      ...prev,
      operation: Operation.SelectStart,
    }));
  };

  const getHeader = useCallback(() => {
    switch (state.operation) {
      case Operation.SelectStart:
        return 'Select start position';

      case Operation.SelectEnd:
        return 'Select end position';

      case Operation.SelectWalls:
        return 'Draw walls';

      case Operation.FindPath:
        return 'Calculating Path';

      case Operation.PathFound:
        return 'Path Found';

      case Operation.PathNotFound:
        return 'No Possible Path';
    }
  }, [state]);

  const handleUpdateSquare = useCallback(
    (coord: string) => {
      setSquares((_prev) => {
        let node: Node | undefined;
        const prev = new Map(_prev);

        switch (state.operation) {
          case Operation.SelectStart:
            node = prev.get(coord);
            if (!node) {
              alert('error selecting start node');
              break;
            }

            node.type = NodeType.Start;
            node.gCost = 0;
            node.calculateFCost();
            setState((prev) => ({
              ...prev,
              start: coord,
              operation: Operation.SelectEnd,
            }));
            break;

          case Operation.SelectEnd:
            if (coord === state.start) break;
            node = prev.get(coord.toString());

            if (!node) {
              alert('error selecting end node');
              break;
            }

            node.type = NodeType.End;

            setState((prev) => ({
              ...prev,
              operation: Operation.SelectWalls,
              end: coord.split(',').map((x) => Number(x)) as [number, number],
            }));

            let [x, y] = coord.split(',').map((x) => Number(x));
            for (let node of squares.values()) {
              node.calculateHCost([x, y]);
            }
            break;

          case Operation.SelectWalls:
            if (coord === state.start || coord === state.end?.toString()) break;
            node = prev.get(coord.toString());

            if (!node) {
              alert('error selecting wall');
              break;
            }

            node.type = NodeType.Wall;

            break;
        }

        return prev;
      });
    },
    [state, squares]
  );

  const handleStart = useCallback(() => {
    setState((prev) => ({ ...prev, operation: Operation.FindPath }));

    setSquares((_prev) => {
      const prev = new Map(_prev);

      const openList = new Heap<Node>((a, b) => a.fCost - b.fCost);
      const closedList = new Set<string>();
      const visited = new Set<string>();

      openList.add(prev.get(state.start!)!);

      while (openList.size() > 0) {
        const node = openList.pop()!;
        node.type = NodeType.Visited;
        closedList.add(node.coord);
        visited.add(node.coord);

        for (let [coord, cost] of node.neighbours) {
          const neighbour = prev.get(coord)!;

          if (!state.diagonals && cost === 1.4) continue;

          if (closedList.has(neighbour.coord)) continue;
          if (neighbour.type === NodeType.Wall) continue;
          if (neighbour.coord === state.end?.toString()) {
            let pathNode: Node | undefined = node;

            while (pathNode) {
              pathNode.type = NodeType.Path;
              pathNode = pathNode.prevNode;
            }

            prev.get(state.start!)!.type = NodeType.Start;
            setState((prev) => ({ ...prev, operation: Operation.PathFound }));
            return prev;
          }

          let newCost = node.gCost + cost;

          if (newCost < neighbour.gCost) {
            neighbour.gCost = newCost;
            neighbour.calculateFCost();
            neighbour.prevNode = node;
          }

          if (!visited.has(coord)) {
            neighbour.type = NodeType.Searching;
            visited.add(coord);
            openList.add(neighbour);
          }
        }
      }

      setState((prev) => ({ ...prev, operation: Operation.PathNotFound }));
      prev.get(state.start!)!.type = NodeType.Start;
      return prev;
    });
  }, [state]);

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
        {[...squares.entries()].map(([_, node], idx) => (
          <Square
            key={idx}
            node={node}
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
          flexDirection: 'column',
        }}
      >
        <button onClick={() => reset()}>Reset</button>
        <button
          disabled={state.operation !== Operation.SelectWalls}
          onClick={() => handleStart()}
        >
          Start
        </button>
        <div>
          <label>Diagonals</label>
          <input
            type="checkbox"
            checked={state.diagonals}
            onChange={(e) =>
              setState((prev) => ({ ...prev, diagonals: e.target.checked }))
            }
          />
        </div>
      </div>
    </>
  );
}

export default App;
