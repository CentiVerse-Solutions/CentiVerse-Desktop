/**
 * The quick-add expense form's state.
 *
 * Mirrors what useExpenseForm holds; the port turns it into a CreateExpenseInput
 * (amount parsed to minor units, split type mapped to a core strategy).
 */
export interface ExpenseFormState {
  description: string;
  amount: string;
  paidBy: string;
  splitType: 'equal' | 'unequal' | 'percent' | 'shares';
  date: string;
  category: string;
  participants: number[];
  notes: string;
}
