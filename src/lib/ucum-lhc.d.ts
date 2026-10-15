declare module '@lhncbc/ucum-lhc' {
  export interface ConvertResult {
    status: 'succeeded' | 'failed' | 'error';
    toVal: number | null;
    msg: string[];
  }
  export interface ConvertOptions {
    suggest?: boolean;
    molecularWeight?: number | null;
    charge?: number | null;
  }
  export class UcumLhcUtils {
    static getInstance(): UcumLhcUtils;
    convertUnitTo(from: string, value: number, to: string, options?: ConvertOptions): ConvertResult;
    validateUnitString(unit: string): { status: string; msg: string[] };
  }
}
