import React, { useCallback } from 'react';
import './App.css';
import gpuRayCast from './gpuRayCast';

function App() {
  const gpuWork = useCallback(() => {
    const centerPoints = [[5,5], [3,3]];
    const radius = 5;
    const blocker1 = [[1,1],[1,2]];
    const blocker2 = [[3,3],[3,4]];
    const blockers = [blocker1, blocker2];

    const results = gpuRayCast(
      centerPoints,
      radius,
      blockers,
      blockers.length,
    );
    console.log(results);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={gpuWork}>
          Click me
        </button>
      </header>
    </div>
  );
}

export default App;
