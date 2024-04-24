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
export const throttledPromises = <Input, Output>(
  items: Input[] = [],
  asyncFunction: (arg: Input) => Promise<Output>,
  batchSize = 1,
  delay = 0,
): Promise<Output[]> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const output: Output[] = [];
    const batches = split(items, batchSize);

    await asyncForEach(batches, async (batch) => {
      const promises = batch.map(asyncFunction).map((p) => p.catch(reject)) as Promise<Output>[];
      const results = await Promise.all(promises);
      output.push(...results);
      await delayMS(delay);
    });
    resolve(output);
  });
};

export function isKeyOfObject<T extends object>(key: string | number | symbol, obj: T): key is keyof T {
  return key in obj;
}
