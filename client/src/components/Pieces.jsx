import { useState } from "react";
import bomb from '../assets/bomb.png';
import captain from '../assets/captain.png';
import colonel from '../assets/colonel.png';
import flag from '../assets/flag.png';
import general from '../assets/general.png';
import lieutenant from '../assets/lieutenant.png';
import major from '../assets/major.png';
import marshal from '../assets/marshal.png';
import miner from '../assets/miner.png';
import scout from '../assets/scout.png';
import sergeant from '../assets/sergeant.png';
import spy from '../assets/spy.png';

// Maps rank labels (as strings) to piece metadata.
// "S" is an alias for Spy used in some legacy contexts; Bomb and Flag have null rank (non-combat).
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
  'S':  { rank: 1,  name: 'Spy',        image: spy        }, // legacy alias
  '11': { rank: null, name: 'Bomb',     image: bomb       },
  '0':  { rank: null, name: 'Flag',     image: flag       },
};

// The four lake squares (two 2x2 blocks in the center) — stored as "row,col" strings
export const LAKES = new Set([
  "4,2", "4,3", "5,2", "5,3",
  "4,6", "4,7", "5,6", "5,7",
]);

export const BOARD_SIZE = 10;

// Renders the image icon for a piece by label. Returns null for unknown labels (e.g. hidden pieces).
export function PieceIcon({ label }) {
  const piece = PIECES[label];
  if (!piece) return null;

  return (
    <div className="piece-icon-wrapper">
      <img className="piece-icon" src={piece.image} alt={piece.name} />
    </div>
  );
}