export function buildScoreRows(labels, values){
    return Object.entries(labels).map(([key, label]) => {
        const value = values[key];
        const dots = [1, 2, 3, 4, 5].map(n => n <= value);
        return { key, label, value, dots};
    });
}