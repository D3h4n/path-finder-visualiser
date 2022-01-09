import React, { useState, useEffect, useCallback } from 'react';
import Square, { Node, NodeType } from './Square';
import './App.css';
import Heap from 'heap-js';

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
  end?: string;
  diagonals: boolean;
  debug: boolean;
}

function App() {
  const [gridSize, setGridSize] = useState<number>(5);
  const [speed, setSpeed] = useState<number>(1);
  const [squares, setSquares] = useState<Map<string, Node>>(new Map());
  const [state, setState] = useState<State>({
    operation: Operation.SelectStart,
    diagonals: false,
    debug: false,
  });
  const [openList, setOpenList] = useState<Heap<Node>>(
    new Heap((a, b) => {
      let fDiff = a.fCost - b.fCost;

      if (fDiff !== 0) {
        return fDiff;
      }

      let hDiff = a.hCost - b.hCost;

      if (hDiff !== 0) {
        return hDiff;
      }

      return a.gCost - b.gCost;
    })
  );
  const [closedList, setClosedList] = useState<Set<string>>(new Set<string>());
  const [visited, setVisited] = useState<Set<string>>(new Set<string>());
  const [currentNode, setCurrentNode] = useState<Node>();

  const reset = () => {
    setSquares(
      new Map(
        [...new Array(gridSize ** 2)].map((_, idx) => {
          const x = idx % gridSize;
          const y = Math.floor(idx / gridSize);

          return [`${x},${y}`, new Node(x, y, gridSize)];
        })
      )
    );

    setState((prev) => ({
      ...prev,
      operation: Operation.SelectStart,
    }));

    setOpenList((prev) => {
      prev.clear();
      return prev;
    });
    setClosedList(new Set<string>());
    setVisited(new Set<string>());
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
    (node: Node) => {
      setSquares((_prev) => {
        const prev = new Map(_prev);

        switch (state.operation) {
          case Operation.SelectStart:
            if (!node) {
              alert('Error selecting start node');
              break;
            }

            node.type = NodeType.Start;
            node.gCost = 0;
            node.calculateFCost();
            setState((prev) => ({
              ...prev,
              start: node?.coord,
              operation: Operation.SelectEnd,
            }));
            setOpenList((prev) => {
              prev.add(node);
              return prev;
            });
            setVisited((prev) => {
              prev.add(node.coord);
              return prev;
            });
            setCurrentNode(node);
            break;

          case Operation.SelectEnd:
            if (!node) {
              alert('error selecting end node');
              break;
            }
            if (node?.coord === state.start) break;

            node.type = NodeType.End;

            setState((prev) => ({
              ...prev,
              operation: Operation.SelectWalls,
              end: node?.coord,
            }));

            for (let square of squares.values()) {
              square.calculateHCost(node.x, node.y);
            }
            break;

          case Operation.SelectWalls:
            if (node?.coord === state.start || node?.coord === state.end) break;

            if (!node) {
              alert('error selecting wall');
              break;
            }
            node.fCost = 0;
            node.gCost = 0;
            node.hCost = 0;
            node.type = NodeType.Wall;

            break;

          default:
            console.log(node?.coord);
        }

        return prev;
      });
    },
    [state, squares]
  );

  const handleStart = useCallback(async () => {
    if (openList.isEmpty()) {
      setState((prev) => ({ ...prev, operation: Operation.PathNotFound }));
      setSquares((prev) => {
        prev.get(state.start!)!.type = NodeType.Start;
        return new Map(prev);
      });

      return false;
    }

    let node = openList.pop();

    if (!node) {
      alert('ERROR');
      reset();
      return false;
    }

    node.type = NodeType.Start;
    setCurrentNode(node);

    closedList.add(node.coord);

    setOpenList(openList);
    setClosedList(closedList);

    //TODO: Fix error where nodes already in the closed list are readded to the open list

    await new Promise((resolve) => setTimeout(resolve, 50 / speed));

    let ret = true;

    setSquares((prev) => {
      for (let [coord, cost] of node!.neighbours) {
        const neighbour = prev.get(coord)!;

        if (!state.diagonals && cost === 1.4) continue;
        if (closedList.has(neighbour.coord)) continue;
        if (neighbour.type === NodeType.Wall) continue;
        if (neighbour.coord === state.end?.toString()) {
          neighbour.gCost = node!.gCost + cost;
          neighbour.calculateFCost();
          let pathNode: Node | undefined = node;

          while (pathNode) {
            pathNode.type = NodeType.Path;
            pathNode = pathNode.prevNode;
          }

          prev.get(state.start!)!.type = NodeType.Start;
          setState((prev) => ({ ...prev, operation: Operation.PathFound }));
          ret = false;
          return new Map(prev);
        }

        let newCost = node!.gCost + cost;

        if (newCost < neighbour.gCost) {
          neighbour.gCost = newCost;
          neighbour.calculateFCost();
          neighbour.prevNode = node;

          if (!visited.has(coord)) {
            neighbour.type = NodeType.Searching;
            visited.add(coord);
            setVisited(visited);
            setOpenList((prev) => {
              prev.add(neighbour);
              return prev;
            });
          }
        }
      }

      node!.type = NodeType.Visited;
      return new Map(prev);
    });

    return ret;
  }, [state, closedList, openList, visited, speed]);

  const handleSkip = useCallback(async () => {
    while (await handleStart());
  }, [handleStart]);

  useEffect(reset, [gridSize, speed]);

  return (
    <>
      <h2 style={{ textAlign: 'center' }}>{getHeader()}</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, auto)`,
          justifyContent: 'center',
          alignSelf: 'center',
        }}
      >
        {[...squares.entries()].map(([_, node], idx) => (
          <Square
            key={idx}
            node={node}
            debug={state.debug}
            handleUpdateSquare={handleUpdateSquare}
          />
        ))}
      </div>
      <div
        style={{
          position: 'fixed',
          top: '2rem',
          left: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: 'column',
          width: '20vw',
        }}
      >
        <p
          style={{
            display: state.debug ? 'block' : 'none',
            position: 'fixed',
            top: '2rem',
            right: '2rem',
          }}
        >{`Position: ${currentNode?.coord} FCost: ${currentNode?.fCost.toFixed(
          2
        )}`}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label>Grid Size</label>
          <select onChange={(e) => setGridSize(Number(e.target.value))}>
            <option value="5">5x5</option>
            <option value="10">10x10</option>
            <option value="20">20x20</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label>Speed</label>
          <input
            type="number"
            value={speed}
            style={{
              width: '3rem',
            }}
            onChange={(e) => {
              let num = Number(e.target.value);

              if (num < 1) {
                num = 1;
              }

              if (num > 5) {
                num = 5;
              }

              setSpeed(num);
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label>Diagonals</label>
          <input
            type="checkbox"
            checked={state.diagonals}
            onChange={(e) =>
              setState((prev) => ({ ...prev, diagonals: e.target.checked }))
            }
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label>Debug</label>
          <input
            type="checkbox"
            checked={state.debug}
            onChange={(e) =>
              setState((prev) => ({ ...prev, debug: e.target.checked }))
            }
          />
        </div>
        <p></p>
        <button onClick={() => reset()}>Reset</button>
        <button
          disabled={
            state.operation < Operation.SelectWalls ||
            state.operation >= Operation.PathFound
          }
          onClick={() => {
            setState((prev) => ({ ...prev, operation: Operation.FindPath }));
            handleStart();
          }}
        >
          {state.operation <= Operation.SelectWalls ? 'Start' : 'Next'}
        </button>
        <button
          disabled={
            state.operation < Operation.SelectWalls ||
            state.operation >= Operation.PathFound
          }
          onClick={() => {
            setState((prev) => ({ ...prev, operation: Operation.FindPath }));
            handleSkip();
          }}
        >
          Run
        </button>
      </div>
    </>
  );
}

export default App;
