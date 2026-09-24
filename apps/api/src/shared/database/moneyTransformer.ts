import { ValueTransformer } from 'typeorm'

// node-postgres returns numeric columns as strings so no precision is silently lost.
// Money columns are numeric(10,2): at most 10 significant digits, which a JS number
// (15+ significant digits) represents exactly enough to round-trip every value to the cent.
// Converting here keeps entity types truthful (`amount: number`) for the whole app.
export const moneyTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
}
