export type FinderAnswer = { readonly questionId: string; readonly value: string };

export type FinderOption = { readonly value: string; readonly label: string };

export type FinderQuestion = {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly FinderOption[];
};
