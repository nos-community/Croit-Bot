export function calculateGrades(musicData: any[]) {
  const basicGrades: number[] = [];
  const recitalGrades: number[] = [];

  for (const song of musicData) {
    if (!song.sheet) continue;
    for (const sheet of song.sheet) {
      if (sheet.grade_basic) basicGrades.push(Number(sheet.grade_basic));
      if (sheet.grade_recital) recitalGrades.push(Number(sheet.grade_recital));
    }
  }

  const basicSum = basicGrades
    .sort((a, b) => b - a)
    .slice(0, 50)
    .reduce((acc, val) => acc + val, 0);

  const recitalSum = recitalGrades
    .sort((a, b) => b - a)
    .slice(0, 50)
    .reduce((acc, val) => acc + val, 0);

  return { basicSum, recitalSum };
}