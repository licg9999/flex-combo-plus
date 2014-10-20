# Usage
## Install
```
npm install debug.log
```

## Invoke
```
var delog = require("debug.log");

delog.log(string, [...], [level]);
delog.warn(string, [...], [level]);
delog.error(string, [...], [level]);
delog.request(string, [...], [level]);
delog.response(string, [...], [level]);
delog.process(string, [...], [level]);
delog.success(string, [...], [level]);

```

### Type Specifier
The `Type Specifier` is supported in the FIRST string, which says what type the argument data should be treated as.

 |Format specifier	|Description
 |------------------|-----------|
 |%s|               Formats the value as a string.
 |%d or %i|         Formats the value as an integer.
 |%f|               Formats the object as a floating point value.
 |%o|               Formats the value as an expandable DOM element (as in the Elements panel).
 |%O|               Formats the value as an expandable JavaScript object.
 |%c|               Applies CSS style rules to output string specified by the second parameter.

### Level
The `Level` the last one in the arguments, which point out indentation of the console line.
