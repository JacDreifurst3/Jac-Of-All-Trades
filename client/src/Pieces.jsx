import { useState } from "react";
import bomb from './bomb.png';
import captain from './captain.png';
import colonel from './colonel.png';
import flag from './flag.png';
import general from './general.png';
import lieutenant from './lieutenant.png';
import major from './major.png';
import marshal from './marshal.png';
import miner from './miner.png';
import scout from './scout.png';
import sergeant from './sergeant.png';
import spy from './spy.png';

export const PIECES = {
  '10': { rank: 10, name: 'Marshal',    image: marshal    },
  '9':  { rank: 9,  name: 'General',    image: general    },
  '8':  { rank: 8,  name: 'Colonel',    image: colonel    },
  '7':  { rank: 7,  name: 'Major',      image: major      },
  '6':  { rank: 6,  name: 'Captain',    image: captain    },
  '5':  { rank: 5,  name: 'Lieutenant', image: lieutenant },
  '4':  { rank: 4,  name: 'Sergeant',   image: sergeant   },
  '3':  { rank: 3,  name: 'Miner',      image: miner      },
  '2':  { rank: 2,  name: 'Scout',      image: scout      },
  '1':  { rank: 1,  name: 'Spy',        image: spy        },
  'S':  { rank: 1,  name: 'Spy',        image: spy        },
  'B':  { rank: null, name: 'Bomb',     image: bomb       },
  'F':  { rank: null, name: 'Flag',     image: flag       },
};

export const LAKES = new Set([
  "4,2", "4,3", "5,2", "5,3",
  "4,6", "4,7", "5,6", "5,7",
]);

export const BOARD_SIZE = 10;

export function PieceIcon({ label }) {
  const piece = PIECES[label];
  if (!piece) return null;

  return (
    <div className="piece-icon-wrapper">
      <img className="piece-icon" src={piece.image} alt={piece.name} />
    </div>
  );
}