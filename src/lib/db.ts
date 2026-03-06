// D1ではINTEGER[]が使えないのでJSON文字列として保存・取得する

export function numbersToJson(numbers: number[]): string {
  return JSON.stringify(numbers);
}

export function jsonToNumbers(json: string): number[] {
  return JSON.parse(json) as number[];
}
