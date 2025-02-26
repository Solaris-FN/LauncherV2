export interface ResponseOrError<T> {
  success: boolean;
  data: T;
} // just for axios
