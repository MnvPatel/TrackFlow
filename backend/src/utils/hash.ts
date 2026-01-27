import bcrypt from "bcrypt";

export const hashValue = (val: string) => bcrypt.hash(val, 10);
export const compareHash = (val: string, hash: string) => bcrypt.compare(val, hash);
