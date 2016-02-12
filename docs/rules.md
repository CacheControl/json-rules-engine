# Rules

## Actions

## Conditions

Each rule condition *must* begin with a boolean operator(```all``` or ```any```) at its root.

The _operator_ compares the value returned by the "fact" to what is stored in the 'value' property.  If the result is truthy, the condition passes. Available operators:

  ```equal``` - _fact_ must equal _value_

  ```notEqual```  - _fact_ must not equal _value_

  ```in```  - _fact_ must be included in _value_, which is an array

  ```notIn```  - _fact_ must not be included in _value_, which is an array

  ```lessThan``` - _fact_ must be less than _value_;

  ```lessThanInclusive```- _fact_ must be less than or equal to _value_

  ```greaterThan``` - _fact_ must be greater than _value_;

  ```greaterThanInclusive```- _fact_ must be greater than or equal to _value_
