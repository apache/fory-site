---
id: what-is-fory
title: What is Apache Fory?
sidebar_position: 2
---

## In simple terms

**Apache Fory** is a **fast and efficient way to convert data and objects into bytes and back**, so they can be:
- sent over the network
- stored on disk
- shared between different programming languages

This process is commonly called **serialization**.

---

## Why does Fory exist?

Most applications need to move data:
- between services
- between machines
- between different programming languages

While many serialization tools exist, they often have trade-offs:
- slow performance
- large data size
- limited cross-language support
- complex schemas or IDLs

**Fory focuses on solving these problems** by being:
- **High-performance**
- **Cross-language**
- **Easy to use**
- **Schema-less (no IDL required)**

---

## What problem does Fory solve?

Imagine you have:
- a Java service
- a Python service
- a Rust service  

All of them need to exchange complex objects.

With Fory:
- you don’t need to define schemas
- you don’t need to generate code
- you don’t need to worry about language differences

You just serialize the object in one language and deserialize it in another.

Fory is especially useful when:

- Java needs to communicate with Python
- Rust needs to communicate with Java
- Data moves inside distributed systems
- Performance and efficiency are critical

---

## A very small example

This example shows how a Java object can be serialized and then deserialized in another language without defining schemas, IDLs, or generated code.

### Step 1: Define a data object (Java)

Create a simple Java class that represents the data you want to serialize.

```java
public class User {
    public String name;
    public int age;

    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }
}
```

### Step 2: Serialize the object (Java)

Use Fory to serialize the object into a compact binary representation.

```java
User user = new User("Alice", 20);

// Serialize the object
byte[] bytes = fory.serialize(user);
```

At this point, the `User` object is converted into a binary format that can be stored, sent over the network, or shared with applications written in other languages.

### Step 3: Deserialize the object (Python)

The same binary data can be deserialized in another language without any additional configuration.

```python
user = fory.deserialize(bytes)

print(user.name)  # Alice
print(user.age)   # 20
```

Fory automatically reconstructs the object structure and values, preserving types and references.