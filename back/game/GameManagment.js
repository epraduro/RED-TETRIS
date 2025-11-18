export const games = new Set();

export const getGameValue = (name) => {
    const game = [...games].find(g => g.name === name);
    return game || null;};