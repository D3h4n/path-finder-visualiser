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
  const [gridSize, setGridSize] = useState<number>(10);
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

  const reset = useCallback(() => {
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

    setClosedList(new Set<string>());
    setVisited(new Set<string>());
    setCurrentNode(undefined);
  }, [gridSize]);

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

            node.setType(NodeType.Start);
            setCurrentNode(node);
            node.gCost = 0;
            node.calculateFCost();

            setState((prev) => ({
              ...prev,
              start: node?.coord,
              operation: Operation.SelectEnd,
            }));

            setOpenList((prev) => {
              prev.clear();
              prev.add(node);
              return prev;
            });

            setVisited((prev) => {
              prev.add(node.coord);
              return prev;
            });

            break;

          case Operation.SelectEnd:
            if (!node) {
              alert('error selecting end node');
              break;
            }
            if (node?.coord === state.start) break;

            node.setType(NodeType.End);

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

            node.setType(NodeType.Wall);
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

    node?.setType(NodeType.Visited);
    closedList.add(node.coord);

    setOpenList(openList);
    setClosedList(closedList);

    //TODO: Fix error where nodes already in the closed list are read to the open list

    let ret = true;

    await new Promise((resolve) => setTimeout(resolve, 100 / speed));
    setSquares((prev) => {
      for (let [coord, cost] of node!.neighbours) {
        const neighbour = prev.get(coord)!;

        if (
          (!state.diagonals && cost === 1.4) ||
          closedList.has(neighbour.coord) ||
          neighbour.type === NodeType.Wall
        )
          continue;
        if (neighbour.coord === state.end) {
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
            neighbour.setType(NodeType.Searching);
            visited.add(coord);
            setVisited(visited);
            setOpenList((prev) => {
              prev.add(neighbour);
              return prev;
            });
          }
        }
      }
      return new Map(prev);
    });

    if (ret) {
      let nextNode = openList.peek();
      nextNode?.setType(NodeType.Start);
      setCurrentNode(nextNode);
    }

    return ret;
  }, [state, closedList, openList, visited, speed, reset]);

  const handleSkip = useCallback(async () => {
    while (await handleStart());
  }, [handleStart]);

  useEffect(reset, [gridSize, reset]);

  return (
    <div className="app">
      <h2 className='header'>{getHeader()}</h2>
      <p
        style={{
          display: state.debug ? 'block' : 'none',
          textAlign:"center",
          gridColumn: 1,
          gridRow: 1
        }}
      >{`Position: ${currentNode?.coord} FCost: ${currentNode?.fCost.toFixed(
        2
      )}`}
      </p>
      <div
        className="menu-bar"
      >
        <div className='menu-bar-buttons'>
          <button className="menu-bar-button" onClick={() => reset()}>Reset</button>
          <button
            className="menu-bar-button"
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
            className="menu-bar-button"
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
        <div>
          <div className="menu-bar-option">
            <label>Grid Size</label>
            <select className="menu-bar-option-input" onChange={(e) => setGridSize(Number(e.target.value))}>
              <option value="10">10x10</option>
              <option value="15">15x15</option>
              <option value="20">20x20</option>
            </select>
          </div>
          <div className="menu-bar-option">
            <label>Speed</label>
            <input
              className='menu-bar-option-input'
              type="number"
              value={speed}
              onChange={(e) => {
                let num = Number(e.target.value);

                if (num < 1) {
                  num = 1;
                }

                if (num > 10) {
                  num = 10;
                }

                setSpeed(num);
              }}
            />
          </div>
          <div className="menu-bar-option">
            <label>Diagonals</label>
            <input
              type="checkbox"
              checked={state.diagonals}
              onChange={(e) =>
                setState((prev) => ({ ...prev, diagonals: e.target.checked }))
              }
            />
          </div>
          <div className="menu-bar-option">
            <label>Debug</label>
            <input
              type="checkbox"
              checked={state.debug}
              onChange={(e) =>
                setState((prev) => ({ ...prev, debug: e.target.checked }))
              }
            />
          </div>
        </div>
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, auto)`,
        }}
      >
        {[...squares.entries()].map(([_, node], idx) => (
          <Square
            key={idx}
            node={node}
            debug={state.debug}
            gridSize={gridSize}
            handleUpdateSquare={handleUpdateSquare}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
