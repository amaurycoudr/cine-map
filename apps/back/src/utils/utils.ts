async function asyncForEach<T>(array: T[][], callback: (array: T[]) => void) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index]);
  }
}
function split<T>(arr: T[], n: number) {
  const res: T[][] = [];
  while (arr.length) {
    res.push(arr.splice(0, n));
  }
  return res;
}
const delayMS = (t = 200) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(t);
    }, t);
  });
};
export const throttledPromises = <T, R>(items: T[] = [], asyncFunction: (arg: T) => Promise<R>, batchSize = 1, delay = 0): Promise<R[]> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const output: R[] = [];
    const batches = split(items, batchSize);

    await asyncForEach(batches, async (batch) => {
      const promises = batch.map(asyncFunction).map((p) => p.catch(reject)) as Promise<R>[];
      const results = await Promise.all(promises);
      output.push(...results);
      await delayMS(delay);
    });
    resolve(output);
  });
};
