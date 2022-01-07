import React, { useState, useEffect } from 'react';
import { SIZE } from './App';

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
  handleUpdateSquare: (node: Node) => void;
}

export default function Square({ node, debug, handleUpdateSquare }: Props) {
  const [backgroundColor, setBackgroundColor] = useState<string>();

  const handleUpdateBackground = () => {
    setBackgroundColor(NodeColor.get(node.type));
  };

  useEffect(handleUpdateBackground, [node.type]);

  return (
    <div
      style={{
        position: 'relative',
        height: `2rem`,
        width: `2rem`,
        backgroundColor,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        outline: '1px solid',
      }}
      onClick={() => {
        handleUpdateSquare(node);
      }}
    >
      {debug &&
        node.type !== NodeType.Empty &&
        node.type !== NodeType.Wall && [
          <p
            key={0}
            style={{
              position: 'absolute',
              fontSize: '0.5rem',
              top: '-0.5rem',
              left: '0.15rem',
            }}
          >
            {node.gCost < 99.0 ? node.gCost.toFixed(1) : '∞'}
          </p>,
          <p key={1}>{node.fCost < 99.0 ? node.fCost.toFixed(1) : '∞'}</p>,
          <p
            key={2}
            style={{
              position: 'absolute',
              fontSize: '0.5rem',
              bottom: '-0.5rem',
              right: '0.15rem',
            }}
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

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.coord = `${x},${y}`;
    this.type = NodeType.Empty;
    this.fCost = Number.MAX_VALUE;
    this.hCost = 0;
    this.gCost = Number.MAX_VALUE;
    this.neighbours = Node.getNeighbours(x, y);
  }

  calculateFCost() {
    this.fCost = this.hCost + this.gCost;
  }

  calculateHCost(x: number, y: number) {
    this.hCost = Math.abs(this.x - x) + Math.abs(this.y - y);
  }

  static getNeighbours(x: number, y: number): [string, number][] {
    let neighbours: [string, number][] = [];

    if (x > 0) {
      neighbours.push([`${x - 1},${y}`, 1]);

      if (y > 0) {
        neighbours.push([`${x - 1},${y - 1}`, 1.4]);
      }

      if (y < SIZE - 1) {
        neighbours.push([`${x - 1},${y + 1}`, 1.4]);
      }
    }

    if (x < SIZE - 1) {
      neighbours.push([`${x + 1},${y}`, 1]);

      if (y > 0) {
        neighbours.push([`${x + 1},${y - 1}`, 1.4]);
      }

      if (y < SIZE - 1) {
        neighbours.push([`${x + 1},${y + 1}`, 1.4]);
      }
    }

    if (y > 0) {
      neighbours.push([`${x},${y - 1}`, 1]);
    }

    if (y < SIZE - 1) {
      neighbours.push([`${x},${y + 1}`, 1]);
    }

    return neighbours;
  }
}
