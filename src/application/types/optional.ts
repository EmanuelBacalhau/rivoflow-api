/**
 * Makes specified keys in a type optional.
 * @template T - The original type.
 * @template K - The keys of T to make optional.
 * @return A new type with specified keys made optional.
 * @example
 * type User = {
 *   id: string;
 *   name: string;
 *   email: string;
 * };
 * type PartialUser = Optional<User, 'email'>;
 * // Resulting type:
 * // {
 * //   id: string;
 * //   name: string;
 * //   email?: string;
 * // }
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
