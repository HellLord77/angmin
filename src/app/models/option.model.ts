export interface Option<T> {
  label: string;
  icon: string;
  disabled?: boolean;
  value: T;
}
