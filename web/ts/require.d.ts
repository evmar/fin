// This declares a function require('foo') with no return value;
// it's used for the CSS importing that webpack uses.
declare var require: {
  (path:string);
}
