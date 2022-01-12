import React, { useState, useEffect } from 'react';

export enum NodeType {
  Empty,
  Wall,
  Start,
  End,
  Path,
  Searching,
  Visited,
}

const NodeColor = new Map([
  [NodeType.Empty, 'white'],
  [NodeType.Wall, '#222'],
  [NodeType.Path, 'gray'],
  [NodeType.End, 'blue'],
  [NodeType.Start, 'green'],
  [NodeType.Searching, 'lightblue'],
  [NodeType.Visited, 'red'],
]);
interface Props {
  node: Node;
  debug: boolean;
  gridSize: number;
  handleUpdateSquare: (node: Node) => void;
}

export default function Square({
  node,
  debug,
  handleUpdateSquare,
  gridSize,
}: Props) {
  const [backgroundColor, setBackgroundColor] = useState<string>();

  const handleUpdateBackground = () => {
    setBackgroundColor(NodeColor.get(node.type));
  };

  useEffect(handleUpdateBackground, [node.type]);

  return (
    <div
      draggable="false"
      className='square'
      style={{
        backgroundColor,
      }}
      onMouseDown={() => {
        handleUpdateSquare(node);
      }}
      onMouseOver={(e) => {
        if (e.buttons === 1) {
          handleUpdateSquare(node);
        }
      }}
    >
      {debug &&
        node.type !== NodeType.Empty &&
        node.type !== NodeType.Wall && [
          <p
            draggable="false"
            key={0}
            className = "square-info"
          >
            {node.gCost < 99.0 ? node.gCost.toFixed(1) : '∞'}
          </p>,
          <p
            draggable="false"
            key={1}
            className = "square-info"
          >
            {node.fCost < 99.0 ? node.fCost.toFixed(1) : '∞'}
          </p>,
          <p
            draggable="false"
            key={2}
            className = "square-info"
          >
            {node.hCost.toFixed(1)}
          </p>,
        ]}
    </div>
  );
}

export class Node {
  x: number;
  y: number;
  coord: string;
  fCost: number;
  hCost: number;
  gCost: number;
  type: NodeType;
  neighbours: [string, number][];
  prevNode: Node | undefined;

  constructor(x: number, y: number, gridSize: number) {
    this.x = x;
    this.y = y;
    this.coord = `${x},${y}`;
    this.type = NodeType.Empty;
    this.fCost = Number.MAX_VALUE;
    this.hCost = 0;
    this.gCost = Number.MAX_VALUE;
    this.neighbours = Node.getNeighbours(x, y, gridSize);
  }

  calculateFCost() {
    this.fCost = this.hCost + this.gCost;
  }

  calculateHCost(x: number, y: number) {
    this.hCost = Math.abs(this.x - x) + Math.abs(this.y - y);
  }

  setType(type: NodeType) {
    this.type = type;
  }

  static getNeighbours(
    x: number,
    y: number,
    gridSize: number
  ): [string, number][] {
    let neighbours: [string, number][] = [];

    // top
    if (y > 0) {
      neighbours.push([`${x},${y - 1}`, 1]);
    }

    // bottom
    if (y < gridSize - 1) {
      neighbours.push([`${x},${y + 1}`, 1]);
    }

    // left
    if (x > 0) {
      neighbours.push([`${x - 1},${y}`, 1]);

      // left top
      if (y > 0) {
        neighbours.push([`${x - 1},${y - 1}`, 1.4]);
      }

      // left bottom
      if (y < gridSize - 1) {
        neighbours.push([`${x - 1},${y + 1}`, 1.4]);
      }
    }

    // right
    if (x < gridSize - 1) {
      neighbours.push([`${x + 1},${y}`, 1]);

      // right top
      if (y > 0) {
        neighbours.push([`${x + 1},${y - 1}`, 1.4]);
      }

      // right bottom
      if (y < gridSize - 1) {
        neighbours.push([`${x + 1},${y + 1}`, 1.4]);
      }
    }

    return neighbours;
  }
}
